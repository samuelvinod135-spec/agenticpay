# agenticpay

> Official Python SDK & Framework Adapters (LangChain, CrewAI, AutoGen) for AgenticPay.

## Installation

```bash
pip install agenticpay
# Or with framework adapters
pip install "agenticpay[all]"
```

## Quickstart

```python
import asyncio
from agenticpay import AgenticPayClient

client = AgenticPayClient(
    api_key="ag_live_...",
    base_url="http://localhost:4000"
)

async def main():
    # 1. Fetch Agent Budget Policy
    policy = await client.policies.get("AutoPay-Agent-01")
    print(f"Daily Spend Cap: ${policy.daily_spend_cap_usdc} USDC")

    # 2. Transfer USDC on Base Sepolia
    transfer = await client.transfers.create(
        agent_id="AutoPay-Agent-01",
        amount=1.50,
        recipient="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        reason="Purchase autonomous computing credits"
    )
    print("Transfer status:", transfer.state)

    # 3. Issue Ephemeral Virtual Credit Card (VCC)
    card = await client.cards.issue(
        agent_id="AutoPay-Agent-01",
        limit_usdc=25.0,
        merchant_category="Compute"
    )
    print("Card issued:", card.last4)

    # 4. Check Double-Entry Financial Ledger
    logs = await client.ledger.get_logs(agent_id="AutoPay-Agent-01")
    print(f"Total journal entries: {len(logs)}")

asyncio.run(main())
```

## LangChain Integration

```python
from agenticpay.tools import AgenticPayLangChainTool

tool = AgenticPayLangChainTool(client=client, agent_id="AutoPay-Agent-01")
agent_tools = [tool]
```

## CrewAI Integration

```python
from agenticpay.tools import AgenticPayCrewTool

crew_tool = AgenticPayCrewTool(client=client, agent_id="Crew-Agent-01")
```
