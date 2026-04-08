# MindFlex Setup Guide

Complete setup instructions for the refactored MindFlex application with PostgreSQL backend and React frontend.

## Overview

MindFlex has been completely refactored with:
- ✅ **PostgreSQL Database**
- ✅ **Flask REST API** with JWT authentication
- ✅ **Real Game Sessions** with proper scoring and tracking
- ✅ **Achievement System** with automatic awarding
- ✅ **User Management** with patient/caregiver profiles
- ✅ **React Frontend** updated to use new API

## Prerequisites

Before starting, ensure you have:

1. **Python 3.8+** - Backend runtime
2. **Node.js 16+** - Frontend runtime  
3. **PostgreSQL 12+** - Database server
4. **Git** - Version control

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd MindFlex
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Create PostgreSQL database
createdb mindflex

# Initialize database
python manage.py init_db
python manage.py seed_db

# Create admin user
python manage.py create_admin

# Start backend server
python app.py
```

Backend will run on http://localhost:5000

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "REACT_APP_API_URL=http://localhost:5000" > .env

# Start frontend
npm start
```

Frontend will run on http://localhost:3000

## Detailed Setup Instructions

### Backend Configuration

#### 1. Environment Variables
Create `/backend/.env` with:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mindflex
DB_USER=postgres
DB_PASSWORD=your_password

# Application Security
SECRET_KEY=your-secure-secret-key
JWT_SECRET_KEY=your-jwt-secret-key

# CORS Configuration
CORS_ORIGINS=http://localhost:3000

# LLM API Keys (Optional)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Development Settings
FLASK_ENV=development
DEBUG=true
```

#### 2. Database Management Commands

```bash
# Initialize database (create all tables)
python manage.py init_db

# Seed with sample games and achievements
python manage.py seed_db

# Create admin user
python manage.py create_admin

# Reset database (WARNING: deletes all data)
python manage.py reset_db

# List all users
python manage.py list_users

# Drop all tables (WARNING: deletes all data)
python manage.py drop_db
```

### Frontend Configuration

#### 1. Environment Variables
Create `/frontend/.env` with:

```bash
REACT_APP_API_URL=http://localhost:5000
```

#### 2. Package Installation

The frontend uses:
- `axios` for API calls
- `js-cookie` for token management
- `@tanstack/react-query` for API state management (optional)

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Game Endpoints

- `GET /api/games/` - Get all games
- `GET /api/games/{id}` - Get specific game
- `POST /api/games/sessions/start` - Start game session
- `PUT /api/games/sessions/{id}` - Update session progress
- `POST /api/games/sessions/{id}/complete` - Complete session
- `GET /api/games/history` - Get user's game history
- `GET /api/games/leaderboard` - Get leaderboards
- `GET /api/games/stats` - Get user statistics

### Achievement Endpoints

- `GET /api/achievements/` - Get all achievements
- `GET /api/achievements/user` - Get user's achievements
- `GET /api/achievements/user/stats` - Get achievement statistics
- `GET /api/achievements/leaderboard` - Achievement leaderboard

## Database Schema

The PostgreSQL database includes:

### Core Tables
- `users` - User authentication and profiles
- `patients` - Patient-specific data and preferences
- `caregivers` - Caregiver profiles and credentials
- `games` - Available cognitive games
- `game_sessions` - Individual game play sessions
- `achievements` - Achievement definitions
- `user_achievements` - User's earned achievements
- `user_sessions` - Authentication session management

### Key Features
- **UUID Primary Keys** for better security
- **JSONB Fields** for flexible configuration storage
- **Proper Indexes** for optimal query performance
- **Foreign Key Constraints** for data integrity
- **Timestamp Tracking** for audit trails

## Frontend Architecture

### Updated Components
- **AuthContext** - JWT-based authentication
- **Game Services** - Real API calls with session management
- **Achievement System** - Server-side achievement checking
- **User Management** - Complete profile management

### Game Session Flow
1. User selects game and difficulty
2. `GameSessionManager.startSession()` creates session
3. Game tracks progress with `updateSession()`
4. Game completion calls `completeSession()` 
5. Server automatically checks and awards achievements

## Development Workflow

### Backend Development
```bash
cd backend
source venv/bin/activate

# Run in development mode
FLASK_ENV=development python app.py

# Run tests
pytest

# Reset database for testing
python manage.py reset_db
python manage.py seed_db
```

### Frontend Development
```bash
cd frontend

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## Production Deployment

### Backend Deployment
1. Set `FLASK_ENV=production`
2. Use production database
3. Set secure secret keys
4. Use WSGI server (gunicorn)
5. Configure reverse proxy (nginx)

### Frontend Deployment
1. Update `REACT_APP_API_URL` to production API
2. Run `npm run build`
3. Serve static files from `build/` directory
4. Configure routing for SPA

## Troubleshooting

### Common Backend Issues

**Database Connection Errors:**
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -l | grep mindflex`

**Import Errors:**
- Ensure virtual environment is activated
- Install dependencies: `pip install -r requirements.txt`
- Run from backend directory

**Token Issues:**
- Check JWT secret key configuration
- Clear browser localStorage/cookies
- Verify token expiration settings

### Common Frontend Issues

**API Connection Errors:**
- Ensure backend is running on correct port
- Check CORS configuration
- Verify `REACT_APP_API_URL` in `.env`

**Authentication Issues:**
- Clear browser storage
- Check network tab for API errors
- Verify token is being sent in headers

**Build Errors:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for dependency conflicts
- Update Node.js version if needed

## Testing

### Backend Testing
```bash
cd backend
pytest tests/
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Integration Testing
1. Start backend server
2. Run frontend tests with API calls
3. Test complete user workflows

## Next Steps

With the refactoring complete, you can now:

1. **Implement Real Game Mechanics** - Make games actually playable
2. **Add Error Boundaries** - Proper error handling throughout
3. **Enhance UI/UX** - Polish the interface
4. **Add More Games** - Expand the cognitive training library
5. **Implement Caregiver Features** - Patient management dashboard
6. **Add Therapy Features** - Sound therapy and meditation
7. **Mobile Responsiveness** - Ensure works on all devices
8. **Performance Optimization** - Optimize API calls and rendering

## Support

For issues or questions:
1. Check this setup guide
2. Review API documentation
3. Check backend logs for errors
4. Review frontend console for client errors
5. Test with fresh database reset