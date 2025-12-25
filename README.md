# Task Manager API 🚀

A RESTful API for managing tasks, teams, and users in a collaborative environment. It provides secure authentication, role-based access control, and a scalable architecture focused on maintainability, validation, and automated testing.

<br>

## Features ✨

- User authentication with JWT

- Team and team member management

- Task creation, update, listing, and deletion

- Role-based authorization

- Secure password hashing

- Request validation

- Automated tests

- Production-ready build

<br>

## Project Structure 🗂️

- **`src/`** – Application source code
  - **`controllers/`** – Handle HTTP requests and responses
  - **`database/`** – Database connection and configuration
  - **`middlewares/`** – Authentication and authorization middlewares
  - **`routes/`** – API route definitions
    - `tasks-routes.ts`
    - `teams-routes.ts`
    - `team-members-routes.ts`
    - `users-routes.ts`
    - `sessions-routes.ts`
    - `index.ts`
  - **`tests/`** – Automated tests and helpers
  - **`utils/`** – Shared utility functions
  - **`types/`** – TypeScript type definitions
  - `env.ts` – Environment variables configuration
  - `server.ts` – Application entry point

- **`prisma/`** – Database schema and migrations
  - `schema.prisma`

- **`build/`** – Compiled files for production

- `package.json` – Project dependencies and scripts  
- `tsconfig.json` – TypeScript configuration  
- `README.md` – Project documentation

<br>

## Technologies Used 🛠️

- Node.js

- TypeScript

- Express

- Prisma ORM

- JWT (JSON Web Token)

- Bcrypt

- Zod

- Jest & Supertest

- TSUP

<br>

## API Endpoints 🌐

### Authentication 
| Method | Endpoint     | Description |
|--------|--------------|-------------|
| POST   | `/sessions`  | Authenticate user and return a JWT token |

### Users 
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/users` | Create a new user |
| GET    | `/users` | List users |

### Tasks 
| Method | Endpoint         | Description |
|--------|------------------|-------------|
| POST   | `/tasks`         | Create a new task |
| GET    | `/tasks`         | List tasks |
| PUT    | `/tasks/:id`     | Update a task |
| DELETE | `/tasks/:id`     | Delete a task |

### Teams 
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/teams` | Create a team |
| GET    | `/teams` | List teams |

### Team Members 
| Method | Endpoint              | Description |
|--------|-----------------------|-------------|
| POST   | `/team-members`       | Add a user to a team |
| DELETE | `/team-members/:id`   | Remove a user from a team |

<br>

> Most endpoints require authentication via  
> **Authorization:** `Bearer <token>`

<br>

## Running Locally 🚀

### Prerequisites
1. Node.js (v18+) – to run the application.
2. npm or yarn – to install dependencies.
3. Docker – to run PostgreSQL without installing it locally.

### Steps

1. Clone the repository:
```bash
git clone https://github.com/eduardapontel/task-manager.git
cd task-manager
```

2. Install dependencies:
```bash
npm install
```
- Create a .env file based on .env.example.

3. Start the database:
```bash
docker-compose up -d
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the application:
```bash
npm run dev
```

The server will be available at [http://localhost:3333](http://localhost:3333)

<br>

## Running Tests 🧪

```bash
npm run test:dev
```

<br>

## 🤝 Contributing 

Feel free to contribute to this project by submitting issues or pull requests. Your feedback and suggestions are always welcome!

