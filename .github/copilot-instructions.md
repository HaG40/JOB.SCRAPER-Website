# Copilot Instructions for JOB.SCRAPER-Website

## Big Picture Architecture
- **Monorepo Structure**: Three main components:
  - `frontend/job-site/`: React + Vite web app for job search, recommendations, user management, and AI chat/resume analysis.
  - `backend/`: Go server providing REST APIs for job posts, user accounts, comments, and scraping job data from external sources.
  - `ai_services/AI-Resume-Analyzer/`: Standalone Python service for AI-powered resume analysis (PDF extraction, similarity scoring, LLM-based feedback).

## Developer Workflows
- **Frontend**:
  - Start dev server: `npm run dev` in `frontend/job-site/`
  - Build: `npm run build`
  - Lint: `npm run lint`
  - Uses Vite, React, and custom ESLint config.
- **Backend**:
  - Start server: `go run main.go` in `backend/`
  - Entry point: `main.go`, routes in `router/routes.go`, controllers in `controller/`
  - Database connection: `database/connection.go`
- **AI Service**:
  - Run analyzer: `python main.py` in `ai_services/AI-Resume-Analyzer/`
  - All logic in a single file, see `README.md` for usage and dependencies.

## Project-Specific Patterns & Conventions
- **Frontend**:
  - Components grouped by feature in `src/components/` (e.g., `chat_bot`, `job_matcher`, `job_search`, `users`).
  - Utility functions in `src/utils/` (e.g., `Capitalize.jsx`, `TimeAgo.jsx`).
  - State/context for chat features in `chat_bot/ChatContext.jsx`.
- **Backend**:
  - Go models in `models/` (e.g., `User.go`, `JobPost.go`).
  - Scrapers for external job sites in `scrapers/` (e.g., `JobbkkScraper.go`).
  - Middleware in `middleware/middleware.go` for request handling.
- **AI Service**:
  - No framework, single-file Python logic. Uses Sentence Transformers and Llama-based LLM via Groq API.

## Integration Points
- **Frontend <-> Backend**: Communicates via REST API endpoints (see `jobPostController.go`, `userController.go`).
- **Frontend <-> AI Service**: Likely via HTTP requests to Python service (see `ResumeAnalyzer.jsx`).
- **Backend <-> Scrapers**: Scraper modules fetch and parse job data from external sites, exposed via API.

## External Dependencies
- **Frontend**: React, Vite, ESLint, custom assets.
- **Backend**: Go modules, database (see `connection.go`).
- **AI Service**: Python, Sentence Transformers, Groq API, PDF parsing libraries.

## Examples
- To add a new job search feature, create a component in `src/components/job_search/` and update API calls in `JobSearch.jsx`.
- To extend backend API, add a controller in `backend/controller/` and route in `router/routes.go`.
- To update AI resume logic, edit `ai_services/AI-Resume-Analyzer/main.py`.

---

For more details, see:
- `frontend/job-site/README.md`
- `ai_services/AI-Resume-Analyzer/README.md`
- Backend entry: `backend/main.go`

---

**Feedback:** Please review and suggest improvements or clarify any missing/incomplete sections.
