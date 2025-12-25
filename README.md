# CrewAI Manager

A comprehensive web-based management system for designing, configuring, and executing CrewAI projects with a modern UI/UX.

## Features

### Core Features
- **Visual Project Management**: Create and manage CrewAI projects through an intuitive web interface
- **Agent Configuration**: Design and configure AI agents with custom roles, goals, and backstories
- **Task Orchestration**: Define tasks, set dependencies, and assign agents
- **Universal LLM Support**: Integrate with any LLM provider (OpenAI, Anthropic, Google, Ollama, etc.) via LiteLLM
- **Tool Library**: Access built-in tools and create custom tools with Python using Monaco Editor
- **Project Templates**: Quick-start with pre-built templates for common use cases

### Advanced Features (New!)
- **Real-time Execution**: Execute crews with live WebSocket updates and progress monitoring
- **Memory Management**: AI agent memory with Mem0 integration - semantic search and context retention
- **Token Analytics**: Track token usage with interactive Recharts visualizations and cost estimation
- **Multi-format Export**: Export execution results to JSON, Markdown, HTML, Excel, Word, and PDF
- **Background Processing**: Celery + Redis for async task execution
- **Visual Flow Designer**: React Flow based project visualization with drag-and-drop interface
- **Code Editor**: Monaco Editor integration for custom Python tool development

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework with WebSocket support
- **PostgreSQL** - Robust relational database
- **SQLAlchemy** - ORM for database operations
- **CrewAI 0.22.5** - AI agent orchestration framework
- **LiteLLM** - Universal LLM provider integration (OpenAI, Anthropic, Google, etc.)
- **Celery + Redis** - Background task processing and message queue
- **Mem0** - AI memory management with vector storage (ChromaDB)
- **Alembic** - Database migrations

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and HMR
- **Tailwind CSS** - Utility-first styling
- **React Query (TanStack Query)** - Data fetching, caching, and synchronization
- **Zustand** - Lightweight state management
- **Monaco Editor** - VS Code-powered code editor
- **Recharts** - Composable charting library
- **React Flow** - Interactive node-based UI

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

**Core APIs:**
- `POST /api/v1/initialize` - Initialize system
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/llm-providers` - List LLM providers
- `POST /api/v1/projects/{id}/execute` - Execute project

**Advanced APIs:**
- `GET /api/v1/agents/{id}/memory` - Get agent memories
- `POST /api/v1/agents/{id}/memory/search` - Semantic memory search
- `GET /api/v1/token-usage?range=7d` - Token usage statistics
- `GET /api/v1/executions/{id}/export?format=excel` - Export results (excel/word/pdf/json/html/markdown)
- `WS /ws/execution/{id}` - WebSocket for real-time execution updates

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

**Completed in v1.0:**
- [x] Real-time execution with WebSocket
- [x] Memory management UI with Mem0
- [x] Visual flow designer with React Flow
- [x] Multi-format export (Excel, Word, PDF)
- [x] Token usage analytics with charts
- [x] Background task processing with Celery
- [x] Monaco code editor for custom tools

**Planned for v2.0:**
- [ ] Multi-user authentication and RBAC
- [ ] Custom tool marketplace
- [ ] Export project to standalone Python code
- [ ] Scheduled/recurring executions
- [ ] Team collaboration features
- [ ] Agent performance benchmarking
- [ ] Dark mode UI theme

## Version History

**v1.0.0** (Current) - December 2024
- Initial release with full CrewAI management features
- Memory management with Mem0 integration
- Advanced export capabilities (6 formats)
- Real-time execution monitoring
- Visual flow designer
- Token usage analytics

## Dependencies

Key dependencies and their versions:
- CrewAI: 0.22.5
- FastAPI: 0.109.0
- React: 18.x
- Mem0: 0.0.9
- ChromaDB: 0.4.22
- Celery: 5.3.4
- LiteLLM: 1.17.9

For complete dependency list, see `backend/requirements.txt` and `frontend/package.json`

## Authors

CrewAI Manager Development Team
