from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class AgentPolicy(BaseModel):
    id: Optional[str] = None
    agent_id: str
    single_tx_cap_usdc: float
    daily_spend_cap_usdc: float
    whitelisted_addresses: List[str] = Field(default_factory=list)
    active: bool = True
    current_daily_spend_usdc: Optional[float] = 0.0
    remaining_daily_budget_usdc: Optional[float] = None
    created_at: Optional[str] = None

class TransferResult(BaseModel):
    success: bool
    message: str
    transaction_id: Optional[str] = None
    tx_hash: Optional[str] = None
    state: Optional[str] = None
    amount: Optional[float] = None
    destination_address: Optional[str] = None
    blockchain: Optional[str] = "base-sepolia"
    error: Optional[str] = None
    reason: Optional[str] = None
    policy: Optional[Dict[str, Any]] = None

class VirtualCard(BaseModel):
    id: str
    agent_id: str
    last4: str
    spending_limit_usd: float
    current_spend_usd: float = 0.0
    status: str
    memo: Optional[str] = None
    allowed_mcc: Optional[List[str]] = None
    created_at: Optional[str] = None
    expires_at: Optional[str] = None

class JournalLine(BaseModel):
    id: str
    entry_id: str
    account_code: str
    entry_type: str
    amount: float
    currency: str = "USDC"

class JournalEntry(BaseModel):
    id: str
    reference_id: str
    memo: str
    lines: List[JournalLine] = Field(default_factory=list)
    created_at: str

class AuditLogItem(BaseModel):
    id: str
    agent_id: Optional[str] = None
    wallet_id: Optional[str] = None
    destination_address: Optional[str] = None
    amount: Optional[float] = None
    reason: str
    created_at: str
