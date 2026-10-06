import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '../config/supabase';

export interface VirtualCardRecord {
  id: string;
  org_id: string;
  agent_id: string;
  card_token: string;
  card_number_masked: string;
  cvv_token: string;
  expiration_month: number;
  expiration_year: number;
  spending_limit_usd: number;
  current_spent_usd: number;
  allowed_mcc: string[];
  memo?: string;
  status: 'ACTIVE' | 'FROZEN' | 'TERMINATED';
  expires_at: string;
  created_at: string;
}

const memoryCards = new Map<string, VirtualCardRecord>();

export const cardService = {
  /**
   * Issue an ephemeral virtual card for an agent
   */
  async issueCard(params: {
    orgId: string;
    agentId: string;
    spendingLimitUsd: number;
    memo?: string;
    allowedMcc?: string[];
    ttlMinutes?: number;
  }): Promise<VirtualCardRecord> {
    const id = crypto.randomUUID();
    const ttl = params.ttlMinutes || 15; // default 15 minutes ephemeral TTL
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();
    const now = new Date();

    const lastFour = Math.floor(1000 + Math.random() * 9000).toString();
    const maskedCard = `4111-22XX-XXXX-${lastFour}`;
    const cardToken = `vcc_${crypto.randomBytes(16).toString('hex')}`;
    const cvv = Math.floor(100 + Math.random() * 900).toString();

    const card: VirtualCardRecord = {
      id,
      org_id: params.orgId,
      agent_id: params.agentId,
      card_token: cardToken,
      card_number_masked: maskedCard,
      cvv_token: cvv,
      expiration_month: now.getMonth() + 1,
      expiration_year: now.getFullYear() + 2,
      spending_limit_usd: Number(params.spendingLimitUsd),
      current_spent_usd: 0.0,
      allowed_mcc: params.allowedMcc || ['5734', '7372', '7379'], // Default cloud/developer MCCs
      memo: params.memo || 'Ephemeral Agentic Micro-Purchase',
      status: 'ACTIVE',
      expires_at: expiresAt,
      created_at: now.toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('virtual_cards').insert({
          id,
          org_id: card.org_id,
          agent_id: card.agent_id,
          card_token: card.card_token,
          card_number_masked: card.card_number_masked,
          cvv_token: card.cvv_token,
          expiration_month: card.expiration_month,
          expiration_year: card.expiration_year,
          spending_limit_usd: card.spending_limit_usd,
          current_spent_usd: card.current_spent_usd,
          allowed_mcc: card.allowed_mcc,
          memo: card.memo,
          status: 'ACTIVE',
          expires_at: card.expires_at,
        });
        if (error) console.warn('[cardService] Notice inserting virtual card to DB:', error.message);
      } catch (err) {}
    }

    memoryCards.set(id, card);
    memoryCards.set(cardToken, card);
    return card;
  },

  /**
   * Get card details
   */
  async getCard(cardIdOrToken: string): Promise<VirtualCardRecord | null> {
    const card = memoryCards.get(cardIdOrToken);
    if (card) {
      // Auto-expire check
      if (new Date(card.expires_at).getTime() < Date.now() && card.status === 'ACTIVE') {
        card.status = 'TERMINATED';
      }
      return card;
    }

    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('virtual_cards')
          .select('*')
          .or(`id.eq.${cardIdOrToken},card_token.eq.${cardIdOrToken}`)
          .maybeSingle();
        if (data) return data;
      } catch (err) {}
    }

    return null;
  },

  /**
   * Process and authorize a card swipe against strict spending caps and MCC rules
   */
  async authorizeTransaction(
    cardIdOrToken: string,
    amountUsd: number,
    merchantMcc?: string
  ): Promise<{ approved: boolean; reason?: string; card?: VirtualCardRecord }> {
    const card = await this.getCard(cardIdOrToken);
    if (!card) {
      return { approved: false, reason: 'Card token not found or invalid' };
    }

    // 1. Status Check
    if (card.status !== 'ACTIVE') {
      return { approved: false, reason: `Card is ${card.status}`, card };
    }

    // 2. Expiration Check
    if (new Date(card.expires_at).getTime() < Date.now()) {
      card.status = 'TERMINATED';
      return { approved: false, reason: 'Card authorization failed: Card has expired', card };
    }

    // 3. MCC Restriction Check
    if (merchantMcc && card.allowed_mcc && card.allowed_mcc.length > 0) {
      if (!card.allowed_mcc.includes(merchantMcc)) {
        return {
          approved: false,
          reason: `Merchant Category Code ${merchantMcc} is not in approved list [${card.allowed_mcc.join(', ')}]`,
          card,
        };
      }
    }

    // 4. Spending Cap Check
    if (card.current_spent_usd + amountUsd > card.spending_limit_usd) {
      return {
        approved: false,
        reason: `Exceeds single card spending limit (Spent: $${card.current_spent_usd.toFixed(2)}, Requested: $${amountUsd.toFixed(2)}, Cap: $${card.spending_limit_usd.toFixed(2)})`,
        card,
      };
    }

    // Approved: Deduct balance
    card.current_spent_usd += amountUsd;
    if (card.current_spent_usd >= card.spending_limit_usd) {
      card.status = 'TERMINATED'; // Auto-destroy upon exhausting limit
    }

    return { approved: true, card };
  },
};
