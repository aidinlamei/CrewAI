"""
LLM Providers API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.api.deps import get_db
from app.models import LLMProvider
from app.schemas import (
    LLMProviderCreate,
    LLMProviderUpdate,
    LLMProviderResponse,
    MessageResponse,
    LLMProviderTestRequest,
    LLMProviderTestResponse,
)
from app.services.encryption_service import encryption_service
from app.services.llm_service import llm_service
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=List[LLMProviderResponse])
def list_providers(db: Session = Depends(get_db)):
    """List all LLM providers."""
    providers = db.query(LLMProvider).all()

    # Convert to response model (hide API keys)
    response = []
    for provider in providers:
        provider_dict = {
            "id": provider.id,
            "name": provider.name,
            "display_name": provider.display_name,
            "api_base_url": provider.api_base_url,
            "available_models": provider.available_models or [],
            "default_model": provider.default_model,
            "config": provider.config or {},
            "is_active": provider.is_active,
            "last_tested_at": provider.last_tested_at,
            "created_at": provider.created_at,
            "has_api_key": bool(provider.api_key_encrypted),
        }
        response.append(LLMProviderResponse(**provider_dict))

    return response


@router.post("/", response_model=LLMProviderResponse)
def create_provider(provider: LLMProviderCreate, db: Session = Depends(get_db)):
    """Create a new LLM provider."""
    # Encrypt API key if provided
    api_key_encrypted = None
    if provider.api_key:
        api_key_encrypted = encryption_service.encrypt(provider.api_key)

    db_provider = LLMProvider(
        name=provider.name,
        display_name=provider.display_name,
        api_key_encrypted=api_key_encrypted,
        api_base_url=provider.api_base_url,
        available_models=provider.available_models,
        default_model=provider.default_model,
        config=provider.config,
        is_active=provider.is_active,
    )

    db.add(db_provider)
    db.commit()
    db.refresh(db_provider)

    return LLMProviderResponse(
        id=db_provider.id,
        name=db_provider.name,
        display_name=db_provider.display_name,
        api_base_url=db_provider.api_base_url,
        available_models=db_provider.available_models or [],
        default_model=db_provider.default_model,
        config=db_provider.config or {},
        is_active=db_provider.is_active,
        last_tested_at=db_provider.last_tested_at,
        created_at=db_provider.created_at,
        has_api_key=bool(db_provider.api_key_encrypted),
    )


@router.put("/{provider_id}", response_model=LLMProviderResponse)
def update_provider(
    provider_id: UUID, provider: LLMProviderUpdate, db: Session = Depends(get_db)
):
    """Update an LLM provider."""
    db_provider = db.query(LLMProvider).filter(LLMProvider.id == provider_id).first()
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    update_data = provider.model_dump(exclude_unset=True)

    # Handle API key encryption
    if "api_key" in update_data and update_data["api_key"]:
        update_data["api_key_encrypted"] = encryption_service.encrypt(
            update_data["api_key"]
        )
        del update_data["api_key"]

    for field, value in update_data.items():
        setattr(db_provider, field, value)

    db.commit()
    db.refresh(db_provider)

    return LLMProviderResponse(
        id=db_provider.id,
        name=db_provider.name,
        display_name=db_provider.display_name,
        api_base_url=db_provider.api_base_url,
        available_models=db_provider.available_models or [],
        default_model=db_provider.default_model,
        config=db_provider.config or {},
        is_active=db_provider.is_active,
        last_tested_at=db_provider.last_tested_at,
        created_at=db_provider.created_at,
        has_api_key=bool(db_provider.api_key_encrypted),
    )


@router.delete("/{provider_id}", response_model=MessageResponse)
def delete_provider(provider_id: UUID, db: Session = Depends(get_db)):
    """Delete an LLM provider."""
    db_provider = db.query(LLMProvider).filter(LLMProvider.id == provider_id).first()
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    db.delete(db_provider)
    db.commit()

    return MessageResponse(message="Provider deleted successfully")


@router.post("/{provider_id}/test", response_model=LLMProviderTestResponse)
async def test_provider(
    provider_id: UUID,
    request: LLMProviderTestRequest,
    db: Session = Depends(get_db),
):
    """Test connection to an LLM provider."""
    db_provider = db.query(LLMProvider).filter(LLMProvider.id == provider_id).first()
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Decrypt API key
    api_key = None
    if db_provider.api_key_encrypted:
        api_key = encryption_service.decrypt(db_provider.api_key_encrypted)

    # Test connection
    result = await llm_service.test_connection(
        provider=db_provider.name,
        model=db_provider.default_model or "gpt-3.5-turbo",
        api_key=api_key,
        api_base=db_provider.api_base_url,
        test_message=request.test_message,
    )

    # Update last_tested_at if successful
    if result["success"]:
        db_provider.last_tested_at = datetime.utcnow()
        db.commit()

    return LLMProviderTestResponse(**result)
