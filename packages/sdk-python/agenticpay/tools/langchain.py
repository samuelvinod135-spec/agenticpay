import asyncio
from typing import Optional, Type, Dict, Any
from pydantic import BaseModel, Field

try:
    from langchain_core.tools import BaseTool
except ImportError:
    try:
        from langchain.tools import BaseTool
    except ImportError:
        class BaseTool:  # Fallback duck-typing
            name: str = ""
            description: str = ""

from ..client import AgenticPayClient

class TransferInput(BaseModel):
    amount: float = Field(..., description="Amount of USDC to transfer (e.g. 1.50)")
    recipient: str = Field(..., description="42-character EVM address (0x...) on Base Sepolia")
    reason: str = Field(default="Autonomous AI Agent Transfer", description="Business justification for payment")

class AgenticPayLangChainTool(BaseTool):
    name: str = "agenticpay_transfer"
    description: str = (
        "Send USDC payments on Base Sepolia from an AI agent wallet. "
        "Automatically checks and enforces institutional spending policy limits and fraud firewalls."
    )
    args_schema: Type[BaseModel] = TransferInput

    def __init__(self, client: AgenticPayClient, agent_id: str = "AutoPay-Agent-01", **kwargs):
        super().__init__(**kwargs)
        self._client = client
        self._agent_id = agent_id

    def _run(self, amount: float, recipient: str, reason: str = "Autonomous Transfer") -> str:
        """Synchronous runner"""
        return asyncio.run(self._arun(amount=amount, recipient=recipient, reason=reason))

    async def _arun(self, amount: float, recipient: str, reason: str = "Autonomous Transfer") -> str:
        """Asynchronous runner"""
        result = await self._client.transfers.create(
            agent_id=self._agent_id,
            amount=amount,
            recipient=recipient,
            reason=reason,
        )

        if result.success:
            tx_info = f" Hash: {result.tx_hash}" if result.tx_hash else f" ID: {result.transaction_id}"
            return f"✅ Payment Approved: Transferred ${amount:.2f} USDC to {recipient}.{tx_info} Status: {result.state}."
        else:
            return f"❌ Payment Blocked by Firewall: {result.reason or result.error or 'Policy limit exceeded'}."

AgenticPayTool = AgenticPayLangChainTool
