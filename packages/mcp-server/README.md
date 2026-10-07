# @agenticpay/mcp-server

> Official Model Context Protocol (MCP) Server for AgenticPay. Exposes institutional budget inspection, policy-governed micro-transfers, virtual card issuing, and compliance logs to Claude Desktop, Cursor, and LLM agent runtimes.

## Available MCP Tools

1. `agenticpay_check_budget`: Retrieves active daily cap, spent total, and remaining allowable balance.
2. `agenticpay_transfer`: Initiates policy-verified on-chain USDC transfer on Base Sepolia.
3. `agenticpay_issue_vcc`: Generates dynamic virtual credit card with spending cap for Web2 merchants.
4. `agenticpay_get_audit_log`: Fetches firewall policy flags, rejections, and compliance audit trail.

## Claude Desktop Configuration

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agenticpay": {
      "command": "node",
      "args": [
        "/path/to/agenticpay/packages/mcp-server/dist/index.js"
      ],
      "env": {
        "AGENTICPAY_BASE_URL": "http://localhost:4000",
        "AGENTICPAY_API_KEY": "ag_live_your_api_key_here"
      }
    }
  }
}
```

## Cursor / Local LLM Configuration

In `.cursor/mcp.json` or Cursor Settings -> Features -> MCP:

```json
{
  "mcpServers": {
    "agenticpay": {
      "command": "npx",
      "args": ["-y", "@agenticpay/mcp-server"],
      "env": {
        "AGENTICPAY_BASE_URL": "http://localhost:4000",
        "AGENTICPAY_API_KEY": "ag_live_your_api_key_here"
      }
    }
  }
}
```
