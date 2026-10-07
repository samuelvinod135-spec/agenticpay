import os
from typing import Optional, List, Dict, Any
import httpx

from .types import (
    AgentPolicy,
    TransferResult,
    VirtualCard,
    JournalEntry,
    AuditLogItem,
)

class PoliciesService:
    def __init__(self, client: "AgenticPayClient"):
        self._c = client

    async def get(self, agent_id: str) -> AgentPolicy:
        data = await self._c._request("GET", f"/api/v1/agents/{agent_id}/policy")
        return AgentPolicy(**data.get("policy", {}))

    async def update(
        self,
        agent_id: str,
        single_tx_cap_usdc: Optional[float] = None,
        daily_spend_cap_usdc: Optional[float] = None,
        whitelisted_addresses: Optional[List[str]] = None,
        active: Optional[bool] = None,
    ) -> AgentPolicy:
        payload: Dict[str, Any] = {}
        if single_tx_cap_usdc is not None:
            payload["single_tx_cap_usdc"] = single_tx_cap_usdc
        if daily_spend_cap_usdc is not None:
            payload["daily_spend_cap_usdc"] = daily_spend_cap_usdc
        if whitelisted_addresses is not None:
            payload["whitelisted_addresses"] = whitelisted_addresses
        if active is not None:
            payload["active"] = active

        data = await self._c._request("PUT", f"/api/v1/agents/{agent_id}/policy", json=payload)
        return AgentPolicy(**data.get("policy", {}))

class TransfersService:
    def __init__(self, client: "AgenticPayClient"):
        self._c = client

    async def create(
        self,
        agent_id: str,
        amount: float,
        recipient: str,
        chain: str = "base-sepolia",
        reason: Optional[str] = None,
    ) -> TransferResult:
        payload = {
            "agentId": agent_id,
            "walletId": agent_id,
            "recipient": recipient,
            "destinationAddress": recipient,
            "amount": amount,
            "chain": chain,
            "reason": reason or "Autonomous Agent Payment",
        }
        try:
            data = await self._c._request("POST", "/api/v1/payments/transfer", json=payload, check_ok=False)
            if not data.get("success", False):
                return TransferResult(
                    success=False,
                    message=data.get("message") or data.get("reason") or "Transfer rejected by policy firewall",
                    error=data.get("error", "Policy Violation"),
                    reason=data.get("reason"),
                    policy=data.get("policy"),
                )

            tx = data.get("transaction", {})
            return TransferResult(
                success=True,
                message=data.get("message", "USDC transfer initiated"),
                transaction_id=tx.get("transactionId"),
                tx_hash=tx.get("txHash"),
                state=tx.get("state", "INITIATED"),
                amount=tx.get("amount", amount),
                destination_address=tx.get("destinationAddress", recipient),
                blockchain=tx.get("blockchain", chain),
            )
        except Exception as e:
            return TransferResult(
                success=False,
                message=str(e),
                error="Network Error",
                reason=str(e),
            )

class CardsService:
    def __init__(self, client: "AgenticPayClient"):
        self._c = client

    async def issue(
        self,
        agent_id: str,
        limit_usdc: float = 50.0,
        merchant_category: Optional[str] = None,
        memo: Optional[str] = None,
        allowed_mcc: Optional[List[str]] = None,
        ttl_minutes: Optional[int] = None,
    ) -> VirtualCard:
        payload = {
            "agentId": agent_id,
            "spendingLimitUsd": limit_usdc,
            "memo": memo or (f"Card for {merchant_category}" if merchant_category else None),
            "allowedMcc": allowed_mcc,
            "ttlMinutes": ttl_minutes,
        }
        data = await self._c._request("POST", "/api/v1/cards/issue", json=payload)
        return VirtualCard(**data.get("card", {}))

    async def get(self, card_id: str) -> VirtualCard:
        data = await self._c._request("GET", f"/api/v1/cards/{card_id}")
        return VirtualCard(**data.get("card", {}))

class LedgerService:
    def __init__(self, client: "AgenticPayClient"):
        self._c = client

    async def get_logs(self, agent_id: Optional[str] = None) -> List[JournalEntry]:
        params = {}
        if agent_id:
            params["agentId"] = agent_id
        data = await self._c._request("GET", "/api/v1/ledger/logs", params=params)
        return [JournalEntry(**item) for item in data.get("logs", [])]

class AuditLogsService:
    def __init__(self, client: "AgenticPayClient"):
        self._c = client

    async def list(self, agent_id: Optional[str] = None) -> List[AuditLogItem]:
        params = {}
        if agent_id:
            params["agentId"] = agent_id
        data = await self._c._request("GET", "/api/v1/audit-logs", params=params)
        return [AuditLogItem(**item) for item in data.get("logs", [])]

class AgenticPayClient:
    """
    Official Python Client for AgenticPay
    """
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = 10.0,
    ):
        self.api_key = (api_key or os.getenv("AGENTICPAY_API_KEY") or "").strip()
        if not self.api_key:
            raise ValueError("AgenticPayClient requires an api_key (or AGENTICPAY_API_KEY environment variable)")

        self.base_url = (base_url or os.getenv("AGENTICPAY_BASE_URL") or os.getenv("API_URL") or "http://localhost:4000").rstrip("/")
        self.timeout = timeout

        self.policies = PoliciesService(self)
        self.transfers = TransfersService(self)
        self.cards = CardsService(self)
        self.ledger = LedgerService(self)
        self.audit_logs = AuditLogsService(self)

    async def _request(
        self,
        method: str,
        path: str,
        json: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        check_ok: bool = True,
    ) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.request(method, url, headers=headers, json=json, params=params)
            try:
                data = resp.json()
            except Exception:
                data = {"raw": resp.text}

            if check_ok and resp.is_error:
                error_msg = data.get("reason") or data.get("message") or data.get("error") or f"HTTP {resp.status_code} Error"
                raise RuntimeError(error_msg)

            return data
