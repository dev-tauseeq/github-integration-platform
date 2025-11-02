# GitHub Integration Platform

A full-stack application for integrating with GitHub via OAuth 2.0, syncing organizational data, and displaying it in a dynamic AG-Grid interface.

## Tech Stack

- **Backend**: Node.js v22 / Express.js (Port 3000)
- **Frontend**: Angular v19 / Angular Material (Port 4200)
- **Database**: MongoDB
- **Data Grid**: AG-Grid Community

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

