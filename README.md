# GitHub Integration Platform

## PR 1: Project Setup & Infrastructure ✅

A full-stack application for integrating with GitHub via OAuth 2.0, syncing organizational data, and displaying it in a dynamic AG-Grid interface.

## Tech Stack

- **Backend**: Node.js v22 / Express.js (Port 3000)
- **Frontend**: Angular v19 / Angular Material (Port 4200)
- **Database**: MongoDB
- **Data Grid**: AG-Grid Community

## Project Structure

```
test/
├── backend/                    # Node.js/Express backend
│   ├── config/                # Configuration files
│   ├── controllers/           # Route controllers
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   ├── repositories/          # Data access layer
│   ├── models/                # MongoDB models
│   ├── helpers/               # Utility functions
│   ├── middleware/            # Express middleware
│   ├── utils/                 # Additional utilities
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
│
├── frontend/                  # Angular frontend
│   └── src/
│       └── app/
│           ├── core/          # Core services, guards, interceptors
│           │   ├── services/
│           │   ├── guards/
│           │   ├── interceptors/
│           │   └── models/
│           ├── shared/        # Shared components, modules
│           │   ├── components/
│           │   ├── directives/
│           │   ├── pipes/
│           │   └── material.module.ts
│           └── features/      # Feature modules
│
└── github-integration-implementation-plan.md  # Full implementation plan
```

## Features Implemented in PR 1

### Backend
- ✅ Express server with modular folder structure
- ✅ MongoDB connection with Mongoose
- ✅ Base repository pattern for data access
- ✅ Error handling middleware
- ✅ Response helper utilities
- ✅ Environment configuration
- ✅ CORS, Helmet, and security middleware
- ✅ Rate limiting setup
- ✅ Health check and API info endpoints

### Frontend
- ✅ Angular v19 project setup
- ✅ Angular Material integration
- ✅ AG-Grid integration
- ✅ Modular folder structure (core, shared, features)
- ✅ Base API service with HTTP interceptor
- ✅ Environment configuration
- ✅ Material design components
- ✅ Landing page with system status

## Prerequisites

- Node.js v22+
- MongoDB (running locally or remote connection)
- npm or yarn

## Installation

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev  # Development mode with nodemon
# or
npm start    # Production mode
```

The backend will run on `http://localhost:3000`

### Start Frontend Application

```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:4200`

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api` - API information and available endpoints

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/integrations
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
JWT_SECRET=your_jwt_secret_key_here
ENCRYPTION_KEY=your_32_character_encryption_key
FRONTEND_URL=http://localhost:4200
```

### Frontend (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  // ... other configs
};
```

## Development Scripts

### Backend
- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm test` - Run tests (to be implemented)

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run e2e` - Run end-to-end tests

## Next Steps (Future PRs)

1. **PR 2**: GitHub OAuth 2.0 Integration (Backend)
2. **PR 3**: Integration Management UI (Frontend)
3. **PR 4**: GitHub Data Sync Service (Backend)
4. **PR 5**: Data Retrieval API with Pagination & Filtering (Backend)
5. **PR 6**: AG-Grid Data Viewer (Frontend)
6. **PR 7**: Testing, Optimization & Polish

See `github-integration-implementation-plan.md` for the complete implementation roadmap.

## Architecture Highlights

- **Clean Architecture**: Separation of concerns with layered architecture
- **Repository Pattern**: Abstracted data access layer
- **Error Handling**: Centralized error handling with custom error classes
- **Security**: Helmet, CORS, rate limiting, input validation
- **Modular Design**: Feature-based module structure in Angular
- **Responsive Design**: Material Design components
- **Type Safety**: TypeScript throughout the application

## Testing

To verify the setup:

1. Start MongoDB
2. Start the backend: `cd backend && npm run dev`
3. Start the frontend: `cd frontend && npm start`
4. Navigate to `http://localhost:4200`
5. Check backend health: `curl http://localhost:3000/health`
6. Check API info: `curl http://localhost:3000/api`

## License

MIT