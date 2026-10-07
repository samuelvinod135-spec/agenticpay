#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_BASE_URL = (process.env.AGENTICPAY_BASE_URL || process.env.API_URL || 'http://localhost:4000').replace(/\/+$/, '');
const API_KEY = (process.env.AGENTICPAY_API_KEY || process.env.API_KEY || '').trim();

async function apiRequest(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.reason || data.message || data.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

const server = new Server(
  {
    name: 'agenticpay-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// -------------------------------------------------------------------------
// Register Available Tools
// -------------------------------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'agenticpay_check_budget',
        description:
          'Retrieves active daily spending cap, spent total, and remaining allowable balance for an autonomous agent from the AgenticPay firewall.',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'The agent ID or name to inspect (e.g. "AutoPay-Agent-01")',
            },
          },
          required: ['agentId'],
        },
      },
      {
        name: 'agenticpay_transfer',
        description:
          'Initiates an on-chain USDC transfer governed and validated by the AgenticPay policy firewall on Base Sepolia.',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'The paying agent ID or wallet identifier',
            },
            amount: {
              type: 'number',
              description: 'Amount in USDC to send (e.g. 0.50, 5.00)',
            },
            recipient: {
              type: 'string',
              description: '42-character EVM destination address (0x...) on Base Sepolia',
            },
            reason: {
              type: 'string',
              description: 'Operational justification or description of the autonomous payment',
            },
            chain: {
              type: 'string',
              description: 'Target blockchain rail (default: "base-sepolia")',
            },
          },
          required: ['agentId', 'amount', 'recipient'],
        },
      },
      {
        name: 'agenticpay_issue_vcc',
        description:
          'Generates a dynamic ephemeral Virtual Credit Card (VCC) with hard spending caps and optional MCC whitelist for Web2 vendors.',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'The agent ID requesting virtual card issuance',
            },
            limitUsdc: {
              type: 'number',
              description: 'Maximum spending limit for this card in USD/USDC (e.g. 25.00)',
            },
            merchantCategory: {
              type: 'string',
              description: 'Optional merchant or category description (e.g. "Compute", "Cloud SaaS")',
            },
            memo: {
              type: 'string',
              description: 'Optional business memo or project tag',
            },
          },
          required: ['agentId', 'limitUsdc'],
        },
      },
      {
        name: 'agenticpay_get_audit_log',
        description:
          'Fetches policy violations, security firewall block flags, and compliance audit trail records.',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'Optional agent ID filter',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of records to retrieve (default: 20)',
            },
          },
        },
      },
    ],
  };
});

// -------------------------------------------------------------------------
// Handle Tool Calls
// -------------------------------------------------------------------------
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'agenticpay_check_budget': {
        const agentId = String(args?.agentId || 'AutoPay-Agent-01');
        const data = await apiRequest(`/api/v1/agents/${encodeURIComponent(agentId)}/policy`);
        const policy = data.policy || {};
        const dailyCap = policy.daily_spend_cap_usdc ?? 50.0;
        const currentSpend = policy.current_daily_spend_usdc ?? 0.0;
        const remaining = policy.remaining_daily_budget_usdc ?? Math.max(0, dailyCap - currentSpend);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  agentId,
                  active: policy.active ?? true,
                  singleTxCapUsdc: policy.single_tx_cap_usdc ?? 10.0,
                  dailySpendCapUsdc: dailyCap,
                  currentDailySpendUsdc: currentSpend,
                  remainingDailyBudgetUsdc: remaining,
                  whitelistedAddressesCount: policy.whitelisted_addresses?.length ?? 0,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'agenticpay_transfer': {
        const agentId = String(args?.agentId || '');
        const amount = Number(args?.amount);
        const recipient = String(args?.recipient || '');
        const reason = String(args?.reason || 'MCP Autonomous Agent Payment');
        const chain = String(args?.chain || 'base-sepolia');

        const payload = {
          agentId,
          walletId: agentId,
          recipient,
          destinationAddress: recipient,
          amount,
          chain,
          reason,
        };

        const res = await fetch(`${API_BASE_URL}/api/v1/payments/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        const data: any = await res.json().catch(() => ({}));

        if (!res.ok || data.success === false) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'BLOCKED_BY_FIREWALL',
                    error: data.error || 'Policy Violation',
                    reason: data.reason || data.message || 'Transfer rejected by policy firewall',
                    policy: data.policy,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'APPROVED_AND_EXECUTED',
                  message: data.message || 'Transfer successful',
                  transaction: data.transaction,
                  recordId: data.recordId,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'agenticpay_issue_vcc': {
        const agentId = String(args?.agentId || '');
        const limitUsdc = Number(args?.limitUsdc || 50);
        const merchantCategory = args?.merchantCategory ? String(args.merchantCategory) : undefined;
        const memo = args?.memo ? String(args.memo) : undefined;

        const data = await apiRequest('/api/v1/cards/issue', {
          method: 'POST',
          body: JSON.stringify({
            agentId,
            spendingLimitUsd: limitUsdc,
            memo: memo || (merchantCategory ? `Card for ${merchantCategory}` : undefined),
          }),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'ISSUED',
                  card: data.card,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'agenticpay_get_audit_log': {
        const agentId = args?.agentId ? String(args.agentId) : undefined;
        const limit = Number(args?.limit || 20);
        const query = new URLSearchParams();
        if (agentId) query.set('agentId', agentId);
        query.set('limit', String(limit));

        const data = await apiRequest(`/api/v1/audit-logs?${query.toString()}`);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  count: data.count || data.logs?.length || 0,
                  logs: data.logs || [],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${err.message}`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[agenticpay-mcp] MCP Server running on stdio transport');
}

main().catch((error) => {
  console.error('[agenticpay-mcp] Fatal error:', error);
  process.exit(1);
});
