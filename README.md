# CrewAI Manager

A comprehensive web-based management system for designing, configuring, and executing CrewAI projects with a modern UI/UX.

## Features

- **Visual Project Management**: Create and manage CrewAI projects through an intuitive web interface
- **Agent Configuration**: Design and configure AI agents with custom roles, goals, and backstories
- **Task Orchestration**: Define tasks, set dependencies, and assign agents
- **Universal LLM Support**: Integrate with any LLM provider (OpenAI, Anthropic, Google, Ollama, etc.) via LiteLLM
- **Tool Library**: Access built-in tools and create custom tools with Python
- **Real-time Execution**: Execute crews and monitor progress in real-time
- **Token Tracking**: Track token usage and estimate costs across executions
- **Project Templates**: Quick-start with pre-built templates for common use cases

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Robust relational database
- **SQLAlchemy** - ORM for database operations
- **CrewAI** - AI agent orchestration framework
- **LiteLLM** - Universal LLM provider integration
- **Celery + Redis** - Background task processing

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Query** - Data fetching and caching
- **Zustand** - State management

## Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- OR Python 3.11+, Node.js 18+, PostgreSQL 16, Redis 7

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd CrewAI
```

2. Start all services:
```bash
docker-compose up -d
```

3. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

4. Initialize the system:
- Navigate to http://localhost:5173/initialize
- Click "Initialize System"
- Wait for initialization to complete

### Manual Setup

See [SETUP.md](SETUP.md) for detailed installation instructions.

## Project Structure

```
crewai-manager/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utilities
│   ├── alembic/         # Database migrations
│   └── requirements.txt
│
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript types
│   │   └── stores/      # State management
│   └── package.json
│
└── docker-compose.yml   # Docker orchestration
```

## Usage

### Creating a Project

1. Navigate to the Projects page
2. Click "Create Project"
3. Enter project details
4. Add agents with roles and goals
5. Define tasks and assign agents
6. Execute the project

### Adding LLM Providers

1. Go to LLM Providers
2. Click "Add Provider"
3. Select provider (OpenAI, Anthropic, etc.)
4. Enter API key and configuration
5. Test the connection

### Executing a Project

1. Open a project
2. Click "Execute Project"
3. Provide input data
4. Monitor real-time execution logs
5. View results and token usage

## API Documentation

Interactive API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints

- `POST /api/v1/initialize` - Initialize system
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/llm-providers` - List LLM providers
- `POST /api/v1/projects/{id}/execute` - Execute project

## Development

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Database Migrations

```bash
cd backend
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

## Configuration

### Environment Variables

#### Backend (.env)
```
DATABASE_URL=postgresql://crewai:crewai123@localhost:5432/crewai_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
ENCRYPTION_KEY=your-encryption-key
```

#### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Security

- API keys are encrypted using Fernet encryption
- Environment variables for sensitive data
- CORS configuration for production
- Input validation on all endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Documentation: See SETUP.md for detailed setup instructions

## Roadmap

- [ ] Multi-user authentication
- [ ] Advanced flow designer
- [ ] Memory management UI
- [ ] Custom tool marketplace
- [ ] Export to Python code
- [ ] Scheduling and automation
- [ ] Team collaboration features

## Version

Current Version: 1.0.0

## Authors

CrewAI Manager Development Team
