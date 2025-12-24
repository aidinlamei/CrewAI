"""
LLM service using LiteLLM for universal provider support.
"""
from typing import Dict, Any, Optional, List
import time
from litellm import completion
from app.utils.logger import logger
from app.utils.exceptions import LLMProviderError


class LLMService:
    """Service for interacting with LLM providers via LiteLLM."""

    @staticmethod
    async def complete(
        provider: str,
        model: str,
        messages: List[Dict[str, str]],
        api_key: Optional[str] = None,
        api_base: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate completion using LiteLLM.

        Args:
            provider: Provider name (openai, anthropic, google, etc.)
            model: Model name
            messages: List of message dictionaries
            api_key: API key for the provider
            api_base: Custom API base URL
            temperature: Temperature for generation
            max_tokens: Maximum tokens to generate (optional)
            **kwargs: Additional parameters

        Returns:
            Dictionary with response content and usage

        Raises:
            LLMProviderError: If completion fails
        """
        try:
            # Build model string for LiteLLM
            model_string = f"{provider}/{model}"

            # Prepare kwargs
            completion_kwargs = {
                "model": model_string,
                "messages": messages,
                "temperature": temperature,
            }

            if api_key:
                completion_kwargs["api_key"] = api_key

            if api_base:
                completion_kwargs["api_base"] = api_base

            if max_tokens:
                completion_kwargs["max_tokens"] = max_tokens

            # Add any additional kwargs
            completion_kwargs.update(kwargs)

            # Make completion request
            start_time = time.time()
            response = completion(**completion_kwargs)
            latency = (time.time() - start_time) * 1000  # ms

            # Extract response data
            result = {
                "content": response.choices[0].message.content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                },
                "latency_ms": latency,
            }

            logger.info(
                f"LLM completion successful: {provider}/{model}, "
                f"tokens={result['usage']['total_tokens']}, latency={latency:.2f}ms"
            )

            return result

        except Exception as e:
            logger.error(f"LLM completion failed: {str(e)}")
            raise LLMProviderError(f"LLM completion failed: {str(e)}")

    @staticmethod
    async def test_connection(
        provider: str,
        model: str,
        api_key: Optional[str] = None,
        api_base: Optional[str] = None,
        test_message: str = "Hello, this is a test message.",
    ) -> Dict[str, Any]:
        """
        Test connection to LLM provider.

        Args:
            provider: Provider name
            model: Model name
            api_key: API key
            api_base: Custom API base URL
            test_message: Test message to send

        Returns:
            Dictionary with test results

        Raises:
            LLMProviderError: If test fails
        """
        messages = [{"role": "user", "content": test_message}]

        try:
            result = await LLMService.complete(
                provider=provider,
                model=model,
                messages=messages,
                api_key=api_key,
                api_base=api_base,
                temperature=0.7,
                max_tokens=50,
            )

            return {
                "success": True,
                "response": result["content"],
                "latency_ms": result["latency_ms"],
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }


# Singleton instance
llm_service = LLMService()
