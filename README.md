# Task Management System

## Project Overview
A full-stack task management web application where users can create and manage their tasks, track progress, and view analytics. The application provides user authentication, robust task filtering and sorting, and a responsive interface designed for both desktop and mobile use.

## Features
- **User Authentication**: Secure signup and login using JWT and bcrypt.
- **Task Management**: Create, read, update, and delete (CRUD) tasks.
- **Data Isolation**: Tasks are securely scoped to the authenticated user.
- **Search & Filters**: Search tasks by title, and filter by status or priority.
- **Sorting**: Sort tasks by due date or priority.
- **Pagination**: Server-side pagination for efficient data loading.
- **Analytics**: Dashboard cards showing total, completed, pending tasks, and completion percentage.
- **Responsive UI**: Accessible and usable across desktop and mobile devices.
- **Reliable Backend**: Comprehensive integration tests running against an in-memory MongoDB.

## Tech Stack
**Frontend:**
- React
- TypeScript
- Vite
- React Router
- Axios
- Vanilla CSS

**Backend:**
- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- JWT
- bcrypt

**Testing:**
- Jest
- Supertest
- mongodb-memory-server

## Project Structure
```text
frontend/   # React SPA and UI components
backend/    # Express API, MongoDB models, and tests
docs/       # Project documentation and specifications
```

## Local Setup

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

## Environment Variables
Create a `.env` file in both `frontend` and `backend` directories using their respective `.env.example` templates. 

**Backend (`backend/.env`):**
```text
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```text
VITE_API_URL=http://localhost:5000
```
*Note: Do not commit actual `.env` files to source control.*

## API Endpoints

**Authentication:**
- `POST /api/auth/register` - Create an account
- `POST /api/auth/login` - Authenticate and receive a token
- `GET /api/auth/me` - Retrieve the current user's profile

**Tasks:**
- `POST /api/tasks` - Create a new task
- `GET /api/tasks` - List tasks with support for query parameters
- `GET /api/tasks/stats` - Get user task analytics
- `GET /api/tasks/:id` - Retrieve a single task
- `PUT /api/tasks/:id` - Update a task
- `PATCH /api/tasks/:id/status` - Update only the task's status
- `DELETE /api/tasks/:id` - Delete a task

**Supported `GET /api/tasks` Query Parameters:**
- `search` (string) - Partial title match
- `status` (Todo | In Progress | Done)
- `priority` (Low | Medium | High)
- `page` (number)
- `limit` (number)
- `sort` (dueDate | priority | createdAt)
- `order` (asc | desc)

## Testing
The backend includes a comprehensive suite of integration tests that run against an isolated in-memory MongoDB instance.
```bash
cd backend
npm run build
npm test
```

## Design Decisions
1. **JWT Authentication**: Selected for stateless, scalable user sessions.
2. **Task Ownership**: Implemented at the API layer. The backend relies solely on the verified JWT to determine the user identity, ignoring any client-provided user IDs.
3. **Server-Side Operations**: Search, filtering, sorting, and pagination are handled by the database to ensure performance as task lists grow.
4. **Backend Analytics**: Computed via MongoDB aggregation rather than calculating from paginated frontend data, ensuring accurate totals.
5. **In-Memory Testing**: Using `mongodb-memory-server` ensures tests run reliably in CI and do not pollute the developer's local or cloud database.
6. **Database Indexes**: Practical compound indexes (`{ user: 1, createdAt: -1 }`, etc.) optimize the most common user-scoped queries.

## Deployment
- **Frontend**: https://task-management-system-phi-gilt.vercel.app/
- **Backend**:  https://task-management-api-x9wd.onrender.com
- **GitHub**: https://github.com/MPreethika16/task-management-system/
