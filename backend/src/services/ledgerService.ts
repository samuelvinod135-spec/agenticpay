import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '../config/supabase';

export interface JournalLine {
  id: string;
  entryId: string;
  accountCode: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
}

export interface JournalEntry {
  id: string;
  referenceId: string;
  memo: string;
  lines: JournalLine[];
  createdAt: string;
}

const memoryJournalEntries: JournalEntry[] = [];

export const ledgerService = {
  /**
   * Record a double-entry journal transaction for a transfer + platform fee
   */
  async recordTransfer(params: {
    referenceId: string;
    agentId: string;
    amountUsdc: number;
    feeUsdc: number;
    recipient: string;
    memo?: string;
  }): Promise<JournalEntry> {
    const entryId = crypto.randomUUID();
    const now = new Date().toISOString();
    const memo = params.memo || `Agentic transfer of $${params.amountUsdc.toFixed(2)} USDC to ${params.recipient}`;

    const totalDebitAmount = parseFloat((params.amountUsdc + params.feeUsdc).toFixed(4));
    const principalAmount = parseFloat(params.amountUsdc.toFixed(4));
    const feeAmount = parseFloat(params.feeUsdc.toFixed(4));

    // Balanced double-entry lines:
    // DEBIT: Agent Operating Account (Total spend)
    // CREDIT: Settlement Clearing Account (Recipient disbursement)
    // CREDIT: Platform Fee Revenue (AgenticPay margin)
    const lines: JournalLine[] = [
      {
        id: crypto.randomUUID(),
        entryId,
        accountCode: `AGENT_EXPENSE:${params.agentId}`,
        entryType: 'DEBIT',
        amount: totalDebitAmount,
        currency: 'USDC',
      },
      {
        id: crypto.randomUUID(),
        entryId,
        accountCode: `SETTLEMENT_CLEARING:${params.recipient.slice(0, 10)}`,
        entryType: 'CREDIT',
        amount: principalAmount,
        currency: 'USDC',
      },
      {
        id: crypto.randomUUID(),
        entryId,
        accountCode: 'PLATFORM_REVENUE:FEES',
        entryType: 'CREDIT',
        amount: feeAmount,
        currency: 'USDC',
      },
    ];

    // Zero-drift balance sanity assertion
    const sumDebits = lines
      .filter((l) => l.entryType === 'DEBIT')
      .reduce((sum, l) => sum + l.amount, 0);

    const sumCredits = lines
      .filter((l) => l.entryType === 'CREDIT')
      .reduce((sum, l) => sum + l.amount, 0);

    const drift = Math.abs(sumDebits - sumCredits);
    if (drift > 0.0001) {
      throw new Error(`Double-entry balance violation: Debits ($${sumDebits}) != Credits ($${sumCredits}), Drift: $${drift}`);
    }

    const entry: JournalEntry = {
      id: entryId,
      referenceId: params.referenceId,
      memo,
      lines,
      createdAt: now,
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('journal_entries').insert({
          id: entryId,
          reference_id: params.referenceId,
          memo,
        });

        const dbLines = lines.map((l) => ({
          id: l.id,
          entry_id: entryId,
          account_code: l.accountCode,
          entry_type: l.entryType,
          amount: l.amount,
          currency: l.currency,
        }));
        await supabase.from('journal_lines').insert(dbLines);
      } catch (err: any) {
        console.warn('[ledgerService] Notice writing journal to DB:', err.message);
      }
    }

    memoryJournalEntries.unshift(entry);
    return entry;
  },

  /**
   * Audit ledger balance sanity across all recorded entries
   */
  async verifyLedgerSanity(): Promise<{
    balanced: boolean;
    totalDebits: number;
    totalCredits: number;
    drift: number;
    entriesCount: number;
  }> {
    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of memoryJournalEntries) {
      for (const line of entry.lines) {
        if (line.entryType === 'DEBIT') totalDebits += line.amount;
        if (line.entryType === 'CREDIT') totalCredits += line.amount;
      }
    }

    totalDebits = parseFloat(totalDebits.toFixed(4));
    totalCredits = parseFloat(totalCredits.toFixed(4));
    const drift = Math.abs(totalDebits - totalCredits);

    return {
      balanced: drift < 0.0001,
      totalDebits,
      totalCredits,
      drift,
      entriesCount: memoryJournalEntries.length,
    };
  },
};
