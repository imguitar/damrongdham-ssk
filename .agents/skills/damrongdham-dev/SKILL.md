---
name: damrongdham-dev
description: >-
  Manages the Damrongdham SSK full-stack web application. Use when working with
  Docker Compose, React frontend, Node.js/Express backend, MySQL database, or
  phpMyAdmin. Covers project setup, coding standards, and container management.
version: 1.0.0
author: Damrongdham SSK Team
tags:
  - docker
  - react
  - nodejs
  - express
  - mysql
  - fullstack
  - development
---

# Damrongdham SSK — Development Skill

## Overview

This skill provides comprehensive guidance for developing the **Damrongdham SSK** web application. The project runs entirely in Docker containers during local development, with four interconnected services: a React frontend, a Node.js/Express backend API, a MySQL 8.0 database, and phpMyAdmin for database administration.

All services communicate over a **custom Docker bridge network** (`damrongdham-network`). The frontend and backend use **bind mounts** for live code synchronization, enabling hot reloading without container rebuilds.

---

## When to Use

- Setting up, starting, stopping, or rebuilding the Docker development environment
- Writing or modifying React components in the `frontend/` directory
- Writing or modifying Express API routes/controllers in the `backend/` directory
- Creating or modifying MySQL schemas, migrations, or seed data
- Debugging container networking, environment variables, or database connections
- Adding new npm dependencies to either the frontend or backend
- Configuring Docker Compose services or Dockerfiles

## When NOT to Use

- Tasks unrelated to this project (e.g., Arduino, embedded systems, other repositories)
- Production deployment or CI/CD pipeline configuration (this skill is for local development only)
- Performance tuning of MySQL in production environments

---

## Project Architecture

### Directory Structure

```
damrongdham-ssk/
├── .agents/
│   └── skills/
│       └── damrongdham-dev/
│           └── SKILL.md              # This file
├── docker-compose.yml                # Orchestrates all 4 services
├── .env                              # Environment variables (DO NOT commit)
├── .gitignore
│
├── frontend/                         # ⚛️ React + Vite
│   ├── Dockerfile.dev                # Dev Dockerfile (node:20-alpine)
│   ├── package.json
│   ├── vite.config.js                # Vite config with proxy & polling
│   ├── index.html
│   └── src/
│       ├── main.jsx                  # React entry point
│       ├── App.jsx                   # Root component
│       ├── index.css                 # Global styles
│       ├── components/               # Reusable UI components
│       ├── pages/                    # Page-level components
│       ├── hooks/                    # Custom React hooks
│       ├── services/                 # API call functions (axios)
│       └── utils/                    # Helper/utility functions
│
├── backend/                          # 🟢 Node.js + Express
│   ├── Dockerfile.dev                # Dev Dockerfile (node:20-alpine + nodemon)
│   ├── package.json
│   └── src/
│       ├── server.js                 # Express entry point
│       ├── routes/                   # Express route handlers
│       ├── controllers/              # Business logic
│       ├── models/                   # Database models/queries
│       ├── middleware/               # Custom middleware (auth, validation, etc.)
│       ├── config/                   # App & DB configuration
│       └── utils/                    # Helper/utility functions
│
└── db/                               # 🐬 MySQL
    └── init/
        └── 01-init.sql               # Auto-executed on first container creation
```

### Service Map & Ports

| Service        | Container Name           | Image             | Host Port | Container Port | URL                           |
|----------------|--------------------------|--------------------|-----------:|---------------:|-------------------------------|
| **Frontend**   | `damrongdham-frontend`   | Custom (Vite)     |    `5173` |         `5173` | http://localhost:5173         |
| **Backend**    | `damrongdham-backend`    | Custom (Express)  |    `5000` |         `5000` | http://localhost:5000/api     |
| **MySQL**      | `damrongdham-db`         | `mysql:8.0`       |    `3307` |         `3306` | `mysql -h 127.0.0.1 -P 3307` |
| **phpMyAdmin** | `damrongdham-phpmyadmin` | `phpmyadmin:latest`|   `8081` |           `80` | http://localhost:8081         |

### Network Communication Rules

> **CRITICAL**: All inter-container communication uses the **Docker service name** as the hostname and the **internal container port** — never the host-mapped port.

- **Backend → MySQL**: Host = `db`, Port = `3306` (NOT `3307`)
- **phpMyAdmin → MySQL**: Host = `db`, Port = `3306` (NOT `3307`)
- **Frontend → Backend**: Via Vite proxy at `/api` → `http://damrongdham-backend:5000`
- **Host machine → Any service**: Use the host-mapped ports listed above

### Environment Variables

Defined in `.env` (root directory) and referenced by `docker-compose.yml`:

| Variable               | Default Value       | Used By                      |
|------------------------|---------------------|------------------------------|
| `MYSQL_ROOT_PASSWORD`  | `rootpassword123`   | MySQL, phpMyAdmin            |
| `MYSQL_DATABASE`       | `damrongdham_db`    | MySQL, Backend               |
| `MYSQL_USER`           | `damrongdham_user`  | MySQL, Backend               |
| `MYSQL_PASSWORD`       | `damrongdham_pass`  | MySQL, Backend               |
| `DB_HOST`              | `db`                | Backend (service name)       |
| `DB_PORT`              | `3306`              | Backend (internal port)      |
| `NODE_ENV`             | `development`       | Backend                      |
| `PORT`                 | `5000`              | Backend                      |

---

## Instructions

### Docker Commands

#### Start the Environment

```bash
# First time — build images and start all services
docker compose up --build

# Start in detached (background) mode
docker compose up -d --build

# Start a specific service only
docker compose up -d --build backend
```

#### Stop the Environment

```bash
# Stop all containers (preserve data volumes)
docker compose down

# Stop all containers AND delete MySQL data volume (⚠️ DESTRUCTIVE)
docker compose down -v
```

#### Rebuild After Changes

```bash
# Rebuild a single service (e.g., after modifying Dockerfile or package.json)
docker compose up --build frontend
docker compose up --build backend

# Force rebuild without Docker cache
docker compose build --no-cache && docker compose up -d
```

#### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

#### Execute Commands Inside Containers

```bash
# Open a shell in a container
docker compose exec backend sh
docker compose exec frontend sh

# Connect to MySQL CLI
docker compose exec db mysql -u root -prootpassword123

# Install a new npm package (then rebuild)
docker compose exec backend npm install <package-name>
docker compose exec frontend npm install <package-name>
```

#### Check Container Status

```bash
docker compose ps
```

### When Adding New npm Dependencies

1. Add the package via `docker compose exec <service> npm install <package>`
2. **MUST** rebuild the container: `docker compose up --build <service>`
3. Reason: `node_modules` lives in an anonymous Docker volume to prevent host overwrites

---

## Coding Guidelines

### React (Frontend)

#### Component Structure
- Use **functional components** with hooks exclusively (no class components)
- One component per file; filename matches component name in PascalCase (e.g., `UserCard.jsx`)
- Organize by feature: `components/`, `pages/`, `hooks/`, `services/`, `utils/`

#### State Management
- Use `useState` and `useReducer` for local state
- Use `useContext` for shared state across a few components
- Consider a state management library (e.g., Zustand) only if Context becomes unwieldy

#### API Calls
- Centralize API calls in `src/services/` using **Axios**
- Always use the `/api` prefix so Vite's proxy routes requests to the backend
- Example:
  ```javascript
  // src/services/userService.js
  import axios from 'axios';

  export const getUsers = () => axios.get('/api/users');
  export const createUser = (data) => axios.post('/api/users', data);
  ```

#### Styling
- Use CSS Modules or a single global CSS file (`index.css`)
- Follow a dark theme with modern design (gradients, glassmorphism, micro-animations)
- Use Thai-friendly fonts: `'Sarabun', 'Inter', system-ui, sans-serif`

#### Error Handling
- Wrap API calls in try/catch blocks
- Display user-friendly error messages in Thai
- Use loading states (skeleton screens or spinners) during async operations

### Node.js + Express (Backend)

#### Project Structure
- Entry point: `src/server.js`
- Separate concerns: `routes/` → `controllers/` → `models/`
- Use `src/config/` for database and app configuration

#### Route Conventions
- All API routes MUST be prefixed with `/api`
- Use RESTful naming: `GET /api/users`, `POST /api/users`, `GET /api/users/:id`
- Group routes by resource in separate files under `src/routes/`

#### Database Access
- Use `mysql2/promise` with a **connection pool** (already configured in `server.js`)
- Use parameterized queries to prevent SQL injection — **NEVER** concatenate user input
- Example:
  ```javascript
  // src/models/userModel.js
  const pool = require('../config/db');

  exports.findAll = async () => {
    const [rows] = await pool.query('SELECT * FROM users WHERE is_active = ?', [true]);
    return rows;
  };
  ```

#### Error Handling
- Use Express error-handling middleware (4 arguments: `err, req, res, next`)
- Return consistent JSON error responses:
  ```json
  { "success": false, "message": "Error description", "error": "details" }
  ```
- Log errors to console with timestamps

#### Security Basics
- Enable CORS via the `cors` package (already configured)
- Validate and sanitize all user inputs
- Never expose database credentials or stack traces in API responses

### MySQL

#### Naming Conventions
- Tables: `snake_case`, plural (e.g., `users`, `student_grades`)
- Columns: `snake_case` (e.g., `full_name`, `created_at`)
- Always include `id` (AUTO_INCREMENT PRIMARY KEY), `created_at`, and `updated_at`

#### Character Set
- Use `utf8mb4` charset with `utf8mb4_unicode_ci` collation for full Thai language support

#### Migrations
- Place SQL scripts in `db/init/` with numbered prefixes: `01-init.sql`, `02-add-tables.sql`
- These scripts run automatically on first MySQL container creation only

---

## Output Format

When generating code for this project:

1. **Frontend code** → Place in `frontend/src/` following the component structure above
2. **Backend code** → Place in `backend/src/` following the route/controller/model pattern
3. **SQL scripts** → Place in `db/init/` with sequential numbering
4. **Docker changes** → Update `docker-compose.yml` at project root
5. Always include relevant comments in Thai or English
6. After creating new files, suggest the appropriate Docker command if a rebuild is needed

---

## Examples

### Example: Adding a New API Endpoint

**User asks:** "เพิ่ม API สำหรับดึงข้อมูลนักเรียนทั้งหมด"

**Steps:**
1. Create `backend/src/models/studentModel.js` — database queries
2. Create `backend/src/controllers/studentController.js` — business logic
3. Create `backend/src/routes/studentRoutes.js` — route definitions
4. Register routes in `backend/src/server.js`
5. Create `frontend/src/services/studentService.js` — API calls
6. No Docker rebuild needed (nodemon auto-reloads backend, Vite auto-reloads frontend)

### Example: Adding a New Database Table

**User asks:** "เพิ่มตาราง courses ในฐานข้อมูล"

**Steps:**
1. Create `db/init/02-courses.sql` with CREATE TABLE statement
2. Since init scripts only run on first creation, either:
   - Run the SQL manually: `docker compose exec db mysql -u root -p < db/init/02-courses.sql`
   - Or reset the database: `docker compose down -v && docker compose up --build`
