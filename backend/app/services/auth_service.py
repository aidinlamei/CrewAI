"""
Authentication service for user management.
"""
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.auth import get_password_hash, verify_password
from app.utils.logger import logger
from app.utils.exceptions import ValidationError


class AuthService:
    """Service for user authentication and management."""

    @staticmethod
    def create_user(db: Session, email: str, password: str) -> User:
        """
        Create a new user.

        Args:
            db: Database session
            email: User email
            password: User password (plain text)

        Returns:
            Created user

        Raises:
            ValidationError: If email already exists
        """
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise ValidationError(f"User with email {email} already exists")

        # Hash password
        password_hash = get_password_hash(password)

        # Create user
        user = User(
            email=email,
            password_hash=password_hash,
            is_active=True,  # Auto-activate for now
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        logger.info(f"Created user: {email}")
        return user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """
        Authenticate a user.

        Args:
            db: Database session
            email: User email
            password: User password (plain text)

        Returns:
            User if authentication successful, None otherwise
        """
        user = db.query(User).filter(User.email == email).first()

        if not user:
            logger.warning(f"Authentication failed: user not found ({email})")
            return None

        if not verify_password(password, user.password_hash):
            logger.warning(f"Authentication failed: invalid password ({email})")
            return None

        if not user.is_active:
            logger.warning(f"Authentication failed: user inactive ({email})")
            return None

        logger.info(f"User authenticated: {email}")
        return user

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        """
        Get user by ID.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            User if found, None otherwise
        """
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """
        Get user by email.

        Args:
            db: Database session
            email: User email

        Returns:
            User if found, None otherwise
        """
        return db.query(User).filter(User.email == email).first()


# Singleton instance
auth_service = AuthService()
