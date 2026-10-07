import asyncio
from typing import Any
from ..client import AgenticPayClient

def create_autogen_transfer_function(client: AgenticPayClient, agent_id: str = "AutoGen-01"):
    """
    Creates a callable function for AutoGen agent execution
    """
    def agenticpay_transfer(amount: float, recipient: str, reason: str = "AutoGen Autonomous Payment") -> str:
        async def _exec():
            res = await client.transfers.create(
                agent_id=agent_id,
                amount=amount,
                recipient=recipient,
                reason=reason,
            )
            if res.success:
                return f"Approved & Settled: ${amount:.2f} USDC transferred to {recipient} (Status: {res.state})"
            return f"Declined by Policy Firewall: {res.reason or res.error}"

        return asyncio.run(_exec())

    return agenticpay_transfer

def register_agenticpay_autogen_tool(
    caller: Any,
    executor: Any,
    client: AgenticPayClient,
    agent_id: str = "AutoGen-01"
):
    """
    Registers AgenticPay transfer tool onto AutoGen caller (LLM) and executor agents
    """
    func = create_autogen_transfer_function(client, agent_id)
    name = "agenticpay_transfer"
    desc = "Execute institutional USDC micro-transfers with firewall budget protection"

    if hasattr(caller, "register_for_llm"):
        caller.register_for_llm(name=name, description=desc)(func)
    if hasattr(executor, "register_for_execution"):
        executor.register_for_execution(name=name)(func)
    return func
