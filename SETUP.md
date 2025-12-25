# CrewAI Manager - Setup Guide

This guide provides detailed instructions for setting up the CrewAI Manager system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Setup (Recommended)](#docker-setup-recommended)
3. [Manual Setup](#manual-setup)
4. [System Initialization](#system-initialization)
5. [Configuration](#configuration)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### For Docker Setup
- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- 4GB RAM minimum
- 10GB disk space

### For Manual Setup
- Python 3.11 or higher
- Node.js 18 or higher
- PostgreSQL 16
- Redis 7
- pip (Python package manager)
- npm (Node package manager)

## Docker Setup (Recommended)

Docker setup is the easiest way to get started with CrewAI Manager.

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd CrewAI
```

### Step 2: Environment Configuration

Create environment files from examples:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` to customize:
```bash
# Change these for production
SECRET_KEY=your-secure-secret-key-here
ENCRYPTION_KEY=your-secure-encryption-key-here

# Optional: Add your LLM API keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Step 3: Start Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Redis on port 6379
- Backend API on port 8000
- Frontend on port 5173
- Celery Worker (for background tasks)
- Celery Beat (for scheduled tasks)

### Step 4: Verify Services

```bash
# Check all services are running
docker-compose ps

# View logs
docker-compose logs -f

# Check backend health
curl http://localhost:8000/health
```

### Step 5: Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Step 6: Initialize System

1. Open http://localhost:5173/initialize
2. Click "Initialize System"
3. Wait for completion
4. You'll be redirected to the dashboard

## Manual Setup

If you prefer not to use Docker, follow these steps:

### Step 1: Install Prerequisites

#### Install PostgreSQL 16

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql-16 postgresql-contrib
```

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### Install Redis

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

### Step 2: Setup Database

```bash
# Create database user and database
sudo -u postgres psql

CREATE USER crewai WITH PASSWORD 'crewai123';
CREATE DATABASE crewai_db OWNER crewai;
\q
```

### Step 3: Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

### Step 4: Run Database Migrations

```bash
# Still in backend directory with venv activated
alembic upgrade head
```

### Step 5: Start Backend

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend should now be running at http://localhost:8000

### Step 6: Setup Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

Frontend should now be running at http://localhost:5173

### Step 7: Initialize System

1. Open http://localhost:5173/initialize
2. Click "Initialize System"
3. Wait for completion

## System Initialization

The initialization process:

1. **Creates Database Tables**: All required tables and indexes (11 models total)
2. **Adds Default Tools**: Web search, Wikipedia, File reader, Code analyzer, etc.
3. **Creates Templates**: Research Assistant, Content Writer, Data Analyst, etc.
4. **Sets up Memory Storage**: Initializes ChromaDB for Mem0 vector storage
5. **Configures Celery**: Sets up background task processing

**Database Models Created:**
- Projects, Agents, Tasks, Tools
- LLM Providers, Executions, Execution Tasks
- Memory Entries, Token Usage, Templates, Users

You only need to initialize once. If you reset the database, you'll need to initialize again.

## Configuration

### Backend Configuration

Edit `backend/.env`:

```bash
# Database
DATABASE_URL=postgresql://crewai:crewai123@localhost:5432/crewai_db

# Redis
REDIS_URL=redis://localhost:6379

# Security (IMPORTANT: Change these in production!)
SECRET_KEY=your-very-secure-secret-key-min-32-chars
ENCRYPTION_KEY=your-secure-encryption-key-for-api-keys

# Application
ENVIRONMENT=development
DEBUG=True

# CORS (Update for production)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Optional: LLM Provider API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Mem0 Configuration (optional)
MEM0_ENABLED=True
CHROMA_DB_PATH=./chroma_db

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Frontend Configuration

Edit `frontend/.env`:

```bash
# Backend API URL
VITE_API_URL=http://localhost:8000

# WebSocket URL (for real-time features)
VITE_WS_URL=ws://localhost:8000
```

### Production Configuration

For production deployment:

1. **Change SECRET_KEY and ENCRYPTION_KEY** to secure random values
2. **Update CORS_ORIGINS** to your production domain
3. **Set DEBUG=False**
4. **Set ENVIRONMENT=production**
5. **Use proper SSL certificates**
6. **Configure firewall rules**
7. **Enable database backups**

## Troubleshooting

### Database Connection Issues

**Problem**: Can't connect to PostgreSQL

**Solutions**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql
# or
brew services list | grep postgresql

# Check connection
psql -U crewai -d crewai_db -h localhost

# Verify DATABASE_URL in .env
cat backend/.env | grep DATABASE_URL
```

### Redis Connection Issues

**Problem**: Can't connect to Redis

**Solutions**:
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis if not running
sudo systemctl start redis
# or
brew services start redis
```

### Port Already in Use

**Problem**: Port 8000 or 5173 already in use

**Solutions**:
```bash
# Find process using port 8000
lsof -i :8000
# or
netstat -ano | findstr :8000

# Kill the process
kill -9 <PID>

# Or change port in configuration
```

### Frontend Not Loading

**Problem**: Frontend shows blank page

**Solutions**:
```bash
# Check browser console for errors
# Clear browser cache
# Verify API URL in frontend/.env
# Check backend is running: curl http://localhost:8000/health

# Rebuild frontend
cd frontend
rm -rf node_modules dist
npm install
npm run dev
```

### Database Migration Errors

**Problem**: Alembic migration fails

**Solutions**:
```bash
# Check current migration version
alembic current

# View migration history
alembic history

# Downgrade one version
alembic downgrade -1

# Upgrade to latest
alembic upgrade head

# If stuck, reset database (WARNING: Deletes all data)
DROP DATABASE crewai_db;
CREATE DATABASE crewai_db OWNER crewai;
alembic upgrade head
```

### Docker Issues

**Problem**: Docker containers not starting

**Solutions**:
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose restart

# Rebuild containers
docker-compose down
docker-compose up --build -d

# Check disk space
df -h

# Prune unused resources
docker system prune -a
```

### Import Errors

**Problem**: Python import errors

**Solutions**:
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt

# Check Python version
python --version  # Should be 3.11+
```

## Development Workflow

### Backend Development

```bash
# Activate virtual environment
source venv/bin/activate

# Run with auto-reload
uvicorn app.main:app --reload

# Run tests
pytest

# Format code
black app/

# Lint code
flake8 app/
```

### Frontend Development

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

### Database Management

```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one version
alembic downgrade -1

# View migration history
alembic history
```

## Next Steps

After successful setup:

1. **Create LLM Provider**: Add your preferred LLM provider (OpenAI, Anthropic, etc.)
2. **Create Project**: Start with a template or create from scratch
3. **Add Agents**: Configure AI agents with roles and goals
4. **Define Tasks**: Create tasks and assign to agents
5. **Add Tools**: Use built-in tools or create custom tools with Monaco Editor
6. **Execute**: Run your first crew and monitor real-time progress via WebSocket
7. **View Results**: Export results to Excel, Word, PDF or analyze token usage
8. **Review Memory**: Check agent memories and semantic search capabilities

## Support

If you encounter issues not covered here:

1. Check the [README.md](README.md) for general information
2. Review API documentation at http://localhost:8000/docs
3. Check application logs for errors
4. Create an issue on GitHub with details

## Security Notes

⚠️ **Important Security Reminders:**

1. **Never commit .env files** to version control
2. **Change default passwords** in production
3. **Use strong SECRET_KEY and ENCRYPTION_KEY**
4. **Keep dependencies updated**
5. **Use HTTPS in production**
6. **Implement proper authentication** for multi-user setups
7. **Regular database backups**

## Performance Tips

- Use connection pooling for database
- Enable Redis caching
- Configure proper resource limits in Docker
- Monitor token usage to control costs
- Use background tasks for long-running operations

---

**Happy building with CrewAI Manager!** 🚀
