"""
Token counting and cost estimation service.
"""
from typing import Dict, Optional
from decimal import Decimal
import tiktoken
from app.utils.logger import logger


# Model pricing (per 1K tokens)
MODEL_PRICING = {
    "gpt-4": {"input": 0.03, "output": 0.06},
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "gpt-3.5-turbo": {"input": 0.0015, "output": 0.002},
    "claude-3-opus": {"input": 0.015, "output": 0.075},
    "claude-3-sonnet": {"input": 0.003, "output": 0.015},
    "claude-3-haiku": {"input": 0.00025, "output": 0.00125},
    "gemini-pro": {"input": 0.00025, "output": 0.0005},
    "gemini-1.5-pro": {"input": 0.0035, "output": 0.0105},
    # Add more models as needed
}


class TokenService:
    """Service for token counting and cost estimation."""

    @staticmethod
    def count_tokens(text: str, model: str = "gpt-3.5-turbo") -> int:
        """
        Count tokens in text using tiktoken.

        Args:
            text: Text to count tokens for
            model: Model name for tokenizer selection

        Returns:
            Token count
        """
        try:
            # Get encoding for model
            if "gpt-4" in model.lower():
                encoding = tiktoken.encoding_for_model("gpt-4")
            elif "gpt-3.5" in model.lower():
                encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
            else:
                # Default to cl100k_base encoding (used by most modern models)
                encoding = tiktoken.get_encoding("cl100k_base")

            tokens = encoding.encode(text)
            return len(tokens)

        except Exception as e:
            logger.warning(f"Token counting failed, using estimate: {str(e)}")
            # Fallback: rough estimate (1 token ≈ 4 characters)
            return len(text) // 4

    @staticmethod
    def estimate_cost(
        prompt_tokens: int,
        completion_tokens: int,
        model: str,
    ) -> Decimal:
        """
        Estimate cost based on token usage.

        Args:
            prompt_tokens: Number of prompt tokens
            completion_tokens: Number of completion tokens
            model: Model name

        Returns:
            Estimated cost in USD
        """
        # Normalize model name
        model_lower = model.lower()

        # Find matching pricing
        pricing = None
        for model_key, prices in MODEL_PRICING.items():
            if model_key in model_lower:
                pricing = prices
                break

        if not pricing:
            logger.warning(f"No pricing found for model {model}, using default")
            pricing = {"input": 0.001, "output": 0.002}

        # Calculate cost (pricing is per 1K tokens)
        input_cost = (prompt_tokens / 1000) * pricing["input"]
        output_cost = (completion_tokens / 1000) * pricing["output"]
        total_cost = input_cost + output_cost

        return Decimal(str(round(total_cost, 4)))

    @staticmethod
    def get_model_pricing(model: str) -> Optional[Dict[str, float]]:
        """
        Get pricing for a specific model.

        Args:
            model: Model name

        Returns:
            Pricing dictionary or None
        """
        model_lower = model.lower()

        for model_key, prices in MODEL_PRICING.items():
            if model_key in model_lower:
                return prices

        return None


# Singleton instance
token_service = TokenService()
