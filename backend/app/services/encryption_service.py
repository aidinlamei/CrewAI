"""
Encryption service for API keys.
"""
from base64 import urlsafe_b64encode
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from app.config import settings
from app.utils.exceptions import EncryptionError
from app.utils.logger import logger


class EncryptionService:
    """Service for encrypting and decrypting sensitive data."""

    # Static salt for key derivation (should be unique per application)
    # In production, this could be stored in environment variables
    SALT = b"crewai-manager-encryption-salt-v1"
    KDF_ITERATIONS = 480000  # OWASP recommended minimum for PBKDF2-SHA256

    def __init__(self):
        """Initialize encryption service with proper key derivation."""
        try:
            # Derive a proper Fernet key from the ENCRYPTION_KEY using PBKDF2
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,  # 32 bytes for Fernet
                salt=self.SALT,
                iterations=self.KDF_ITERATIONS,
            )

            # Derive key from password
            password = settings.ENCRYPTION_KEY.encode()
            derived_key = kdf.derive(password)

            # Encode for Fernet (requires base64-encoded 32-byte key)
            fernet_key = urlsafe_b64encode(derived_key)

            self.cipher = Fernet(fernet_key)

            logger.info("Encryption service initialized with PBKDF2 key derivation")
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
