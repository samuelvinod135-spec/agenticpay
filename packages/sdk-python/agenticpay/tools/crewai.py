import asyncio
from typing import Optional, Type
from pydantic import BaseModel, Field

try:
    from crewai.tools import BaseTool as CrewBaseTool
except ImportError:
    class CrewBaseTool:
        name: str = ""
        description: str = ""

from ..client import AgenticPayClient

class CrewTransferInput(BaseModel):
    amount: float = Field(..., description="Amount of USDC to transfer")
    recipient: str = Field(..., description="EVM recipient address (0x...)")
    reason: str = Field(default="CrewAI Task Spend", description="Purpose of spend")

class AgenticPayCrewTool(CrewBaseTool):
    name: str = "AgenticPay Financial Settlement"
    description: str = (
        "Enables CrewAI agents to purchase services, execute micro-transfers, and settle payments "
        "within cryptographically enforced daily budget boundaries."
    )
    args_schema: Type[BaseModel] = CrewTransferInput

    def __init__(self, client: AgenticPayClient, agent_id: str = "Crew-Agent-01", **kwargs):
        super().__init__(**kwargs)
        self._client = client
        self._agent_id = agent_id

    def _run(self, amount: float, recipient: str, reason: str = "CrewAI Task Spend") -> str:
        async def _exec():
            res = await self._client.transfers.create(
                agent_id=self._agent_id,
                amount=amount,
                recipient=recipient,
                reason=reason,
            )
            if res.success:
                return f"SUCCESS: Transferred ${amount:.2f} USDC to {recipient}. Status: {res.state}."
            return f"BLOCKED: {res.reason or res.error}"

        return asyncio.run(_exec())
