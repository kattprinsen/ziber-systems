# Ziber Systems Backend

Backend API for Ziber Systems built with Node.js, Express, and TypeScript.

## Features

- ✅ TypeScript with strict typing
- ✅ Express.js with best practices
- ✅ Error handling middleware
- ✅ Request logging
- ✅ CORS and security headers (Helmet)
- ✅ User management API
- ✅ Query filtering and search

## Getting Started

### Installation

```bash
cd backend
npm install
```

### Development

```bash
npm run dev
```

Server runs on `http://localhost:3001`

### Build

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- **GET** `/api/health` - Server health check

### Users
- **GET** `/api/users` - Get all users
  - Query params:
    - `department` - Filter by department
    - `status` - Filter by status (active, inactive, on-leave)
    - `search` - Search by name, email, role, or department
- **GET** `/api/users/:id` - Get user by ID

## Project Structure

```
backend/
├── src/
│   ├── controllers/      # Route controllers
│   ├── data/            # JSON data files
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   └── server.ts        # Express app setup
├── dist/                # Compiled JavaScript
├── package.json
└── tsconfig.json
```

## Environment Variables

Create a `.env` file:

```env
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```
