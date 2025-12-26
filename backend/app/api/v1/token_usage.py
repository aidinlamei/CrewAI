"""
Token usage API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta
from app.api.deps import get_db
from app.models import TokenUsage, Execution
from pydantic import BaseModel
from typing import List

router = APIRouter()


class DailyUsage(BaseModel):
    date: str
    tokens: int
    cost: float


class ModelUsage(BaseModel):
    model: str
    total_tokens: int
    total_cost: float
    executions: int


class TokenUsageResponse(BaseModel):
    total_tokens: int
    prompt_tokens: int
    completion_tokens: int
    total_cost: float
    daily_usage: List[DailyUsage]
    by_model: List[ModelUsage]


@router.get("/token-usage", response_model=TokenUsageResponse)
async def get_token_usage(
    range: str = "7d",
    db: Session = Depends(get_db),
):
    """Get token usage statistics."""
    # Calculate date range
    days = {"7d": 7, "30d": 30, "90d": 90}.get(range, 7)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get executions in range
    executions = db.query(Execution).filter(
        Execution.created_at >= start_date
    ).all()
    
    # Calculate totals
    total_tokens = sum(e.tokens_used or 0 for e in executions)
    total_cost = sum(float(e.estimated_cost or 0) for e in executions)
    
    # Estimate prompt vs completion (rough 70/30 split if not tracked separately)
    prompt_tokens = int(total_tokens * 0.7)
    completion_tokens = total_tokens - prompt_tokens
    
    # Daily usage
    daily_map = {}
    for e in executions:
        date_str = e.created_at.strftime("%Y-%m-%d")
        if date_str not in daily_map:
            daily_map[date_str] = {"tokens": 0, "cost": 0}
        daily_map[date_str]["tokens"] += e.tokens_used or 0
        daily_map[date_str]["cost"] += float(e.estimated_cost or 0)
    
    daily_usage = [
        DailyUsage(date=date, tokens=data["tokens"], cost=data["cost"])
        for date, data in sorted(daily_map.items())
    ]
    
    # By model (from token_usage table if available, otherwise aggregate)
    model_map = {}
    token_records = db.query(TokenUsage).filter(
        TokenUsage.created_at >= start_date
    ).all()
    
    for t in token_records:
        model = t.model or "unknown"
        if model not in model_map:
            model_map[model] = {"tokens": 0, "cost": 0, "count": 0}
        model_map[model]["tokens"] += t.total_tokens or 0
        model_map[model]["cost"] += float(t.estimated_cost or 0)
        model_map[model]["count"] += 1
    
    # If no token_usage records, create a summary entry
    if not model_map and total_tokens > 0:
        model_map["default"] = {
            "tokens": total_tokens,
            "cost": total_cost,
            "count": len(executions)
        }
    
    by_model = [
        ModelUsage(
            model=model,
            total_tokens=data["tokens"],
            total_cost=data["cost"],
            executions=data["count"]
        )
        for model, data in model_map.items()
    ]
    
    return TokenUsageResponse(
        total_tokens=total_tokens,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_cost=total_cost,
        daily_usage=daily_usage,
        by_model=by_model,
    )
