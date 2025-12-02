# OpsRunner

A safety-first interface for executing operational Python scripts with mandatory dry-run verification.

Built with **SvelteKit**, **Tailwind CSS**, and **Google Gemini API** (for simulation).

## Design System

*   **Primary:** Ruby (Jewel Tone) for Primary Actions (Execute), Active States, and Alerts.
*   **Accent:** Gold (Metallic) for Secondary Actions, Focus rings, and Success indicators.
*   **Background:** True Neutral (Grey) for a clean, premium technical feel.

## Project Structure

*   `src/`: SvelteKit frontend source code.
*   `backend/`: Python/FastAPI service (mock/real execution engine).

---

## 🚀 Quick Start (Dev Mode)

### 1. Start Backend

Navigate to the backend directory:

```bash
cd backend
# (Optional) Create venv
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Start server on port 8000
python main.py
```

### 2. Start Frontend

In the root directory:

```bash
# Install Node dependencies
npm install

# Start the development server
npm run dev
```

**Important:** Ensure you have the `API_KEY` environment variable set for the frontend process so the Gemini simulation works if the backend is unavailable.

---

## 🐳 Docker Deployment

To deploy OpsRunner using Docker, you will need to build containers for both the Frontend and the Backend.

### 1. Backend Docker Setup

Create a file named `Dockerfile` inside the `backend/` directory:

```dockerfile
# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies if your scripts need them
# RUN apt-get update && apt-get install -y --no-install-recommends gcc

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the port FastAPI runs on
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Frontend Docker Setup

Create a file named `Dockerfile` in the root directory:

```dockerfile
# Dockerfile (Frontend)
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Pass API Key at build time or runtime. 
# For SvelteKit static/node adapters, runtime env is usually preferred.
# Here we build the app.
RUN npm run build

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/package.json .
COPY --from=builder /app/build ./build
# If using adapter-node, you need production dependencies
# If using adapter-auto (default), it might rely on vite preview for simple usage, 
# but adapter-node is recommended for Docker.
# For this demo setup using 'vite preview' to serve the build:
RUN npm install --production

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host"]
```

### 3. Orchestration (Docker Compose)

Create a `docker-compose.yml` in the root directory to run both services together:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    networks:
      - ops-network

  frontend:
    build: .
    ports:
      - "4173:4173"
    environment:
      - API_KEY=${API_KEY} # Pass your Gemini API Key here
    depends_on:
      - backend
    networks:
      - ops-network

networks:
  ops-network:
    driver: bridge
```

### 4. Running with Docker Compose

1.  Create a `.env` file in the root directory containing your API Key:
    ```
    API_KEY=your_actual_gemini_api_key
    ```
2.  Run the composition:
    ```bash
    docker-compose up --build
    ```
3.  Access the application at `http://localhost:4173`.
