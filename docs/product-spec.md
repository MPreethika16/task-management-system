# Task Tracker — Product & Engineering Spec

## Overview

Build a task management web application where users can create and manage their own tasks, track progress, and get a quick view of how much work they have completed.

The application will be built with React, Node.js/Express, and MongoDB.

The focus for the first version is a reliable end-to-end experience: authentication, task management, search/filtering, and basic analytics. Enhancements such as dark mode and additional UI polish come after the core flow is stable.

## User Flow

A new user should be able to:

1. Create an account and log in.
2. Land on their task dashboard.
3. Create a task with a title, description, status, priority, and due date.
4. View and manage only their own tasks.
5. Search or filter the task list when it grows.
6. Update the status of a task as work progresses.
7. See a quick summary of overall task progress.

## Core Requirements

### Authentication

Users can sign up and log in using email and password.

Authentication will use JWT. Passwords will be hashed before storage, and protected API routes will require a valid token.

Basic validation will cover required fields, email format, and password requirements.

### Task Management

An authenticated user can:

* Create a task
* View their tasks
* Edit a task
* Delete a task
* Mark/update a task as completed

Each task contains:

* Title
* Description
* Status: `Todo`, `In Progress`, or `Done`
* Priority: `Low`, `Medium`, or `High`
* Due date

Every task belongs to the user who created it. Task queries and mutations must always be scoped to the authenticated user so one user cannot access another user's tasks.

### Search and Filters

The task list supports:

* Search by title
* Filter by status
* Filter by priority
* Sorting by due date or priority
* Pagination

Search and filters should work together rather than behaving as separate modes.

### Analytics

The dashboard shows:

* Total tasks
* Completed tasks
* Pending tasks
* Completion percentage

For this project, a task is considered completed when its status is `Done`. `Todo` and `In Progress` tasks are considered pending.

If there are no tasks, completion percentage is `0%`.

The analytics will be calculated on the backend so the result represents all of the user's tasks rather than only the currently paginated page.

## UI

Keep the UI simple and task-focused.

Main views:

* Login
* Signup
* Dashboard
* Create/Edit Task

The dashboard contains:

* Analytics summary
* Search and filters
* Task list
* Pagination
* Create task action

The UI should handle loading, empty, success, and error states instead of assuming every request succeeds.

The application should work well on both desktop and mobile.

Dark mode is an enhancement and will be implemented only after the core workflow is complete.

## Technical Approach

### Frontend

* React + Vite
* React Router
* Axios/Fetch for API communication
* Lightweight application state; avoid introducing a large state-management library unless needed

### Backend

* Node.js
* Express
* JWT authentication
* REST APIs
* Centralized error handling

### Database

* MongoDB with Mongoose

Primary models:

```text
User
- _id
- email
- password
- timestamps
```

```text
Task
- _id
- user
- title
- description
- status
- priority
- dueDate
- timestamps
```

## API Outline

Authentication:

```text
POST /api/auth/register
POST /api/auth/login
```

Tasks:

```text
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/status
```

Analytics:

```text
GET /api/tasks/stats
```

Task listing will accept query parameters for pagination, search, filtering, and sorting.

Example:

```text
GET /api/tasks?page=1&limit=10&status=Todo&priority=High&search=assignment&sort=dueDate
```

The backend determines the user from the verified JWT. A user ID supplied by the client will never be used to decide task ownership.

## Engineering Considerations

### Authorization

Authentication alone is not enough. Every task read/update/delete operation must verify ownership through the authenticated user.

### Error Handling

Use centralized Express error handling and return consistent API responses for validation errors, authentication failures, missing resources, and unexpected server errors.

### Database Queries

Task queries will always be scoped by user.

Indexes will be added based on the actual query patterns used by the task list and analytics endpoints rather than indexing every field independently.

### Configuration

Secrets such as the MongoDB URI and JWT secret will live in environment variables.

A `.env.example` will document required configuration, while actual `.env` files will remain excluded from Git.

## Scope

### Must Have

* Signup/login
* JWT authentication
* User-specific task CRUD
* Task status updates
* Search by title
* Status and priority filters
* Analytics
* Responsive task dashboard
* Validation and error handling

### Should Have

* Pagination
* Due-date/priority sorting
* Database indexes
* Dark mode

### Not in This Version

* Shared tasks
* Teams/workspaces
* Comments
* Attachments
* Notifications
* Real-time collaboration

These features are intentionally excluded because they are outside the assignment's required scope.

## Definition of Done

The project is ready for submission when:

* [x] Signup and login work end to end
* [x] Protected APIs reject unauthenticated requests
* [x] Passwords are stored securely
* [x] Users can create, view, edit, complete, and delete tasks
* [x] Users cannot access another user's tasks
* [x] Search, status filtering, and priority filtering work
* [x] Pagination and required sorting work
* [x] Analytics show total, completed, pending, and completion percentage
* [x] Empty, loading, validation, and API error states are handled
* [x] The application is usable on desktop and mobile
* [x] No secrets are committed to Git
* [x] README explains setup, API endpoints, and important design decisions
* [ ] Frontend and backend are available in the public repository
* [ ] A final end-to-end smoke test has been completed before submission
