"""
Encryption service for API keys.
"""
from cryptography.fernet import Fernet
from app.config import settings
from app.utils.exceptions import EncryptionError
from app.utils.logger import logger


class EncryptionService:
    """Service for encrypting and decrypting sensitive data."""

    def __init__(self):
        """Initialize encryption service."""
        try:
            # Use the encryption key from settings
            # In production, this should be a proper base64-encoded Fernet key
            key = settings.ENCRYPTION_KEY.encode()
            # Ensure the key is properly formatted
            if len(key) != 44:  # Fernet keys must be 44 bytes (32 bytes base64 encoded)
                # Generate a proper key from the settings key
                from base64 import urlsafe_b64encode
                import hashlib
                key = urlsafe_b64encode(hashlib.sha256(key).digest())
            self.cipher = Fernet(key)
        except Exception as e:
            logger.error(f"Failed to initialize encryption service: {str(e)}")
            raise EncryptionError(f"Failed to initialize encryption: {str(e)}")

    def encrypt(self, data: str) -> str:
        """
        Encrypt data.

        Args:
            data: Plain text data

        Returns:
            Encrypted data as string

        Raises:
            EncryptionError: If encryption fails
        """
        try:
            encrypted = self.cipher.encrypt(data.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            raise EncryptionError(f"Encryption failed: {str(e)}")

    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt data.

        Args:
            encrypted_data: Encrypted data as string

        Returns:
            Decrypted plain text

        Raises:
            EncryptionError: If decryption fails
        """
        try:
            decrypted = self.cipher.decrypt(encrypted_data.encode())
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            raise EncryptionError(f"Decryption failed: {str(e)}")


# Singleton instance
encryption_service = EncryptionService()
