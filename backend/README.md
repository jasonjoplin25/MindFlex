# MindFlex Backend

A Flask-based REST API for the MindFlex cognitive training application.

## Features

- **PostgreSQL Database**: Full relational database with proper schema
- **JWT Authentication**: Secure token-based authentication
- **RESTful API**: Clean, well-documented API endpoints
- **Game Management**: Complete game session tracking and scoring
- **Achievement System**: Unlock achievements based on performance
- **User Profiles**: Separate patient and caregiver profiles
- **Statistics**: Detailed game performance analytics

## Requirements

- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)

## Quick Setup

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Run setup script:**
   ```bash
   python setup.py
   ```

3. **Create PostgreSQL database:**
   ```bash
   createdb mindflex
   ```

4. **Initialize database:**
   ```bash
   python manage.py init_db
   python manage.py seed_db
   ```

5. **Create admin user:**
   ```bash
   python manage.py create_admin
   ```

6. **Start the server:**
   ```bash
   python app.py
   ```

## Manual Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and update with your settings:

```bash
cp .env.example .env
```

Required environment variables:
- `DB_HOST`: PostgreSQL host (default: localhost)
- `DB_PORT`: PostgreSQL port (default: 5432) 
- `DB_NAME`: Database name (default: mindflex)
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `SECRET_KEY`: Flask secret key
- `JWT_SECRET_KEY`: JWT signing key

### 3. Database Setup

Create PostgreSQL database:
```bash
createdb mindflex
```

Initialize tables and seed data:
```bash
python manage.py init_db
python manage.py seed_db
```

### 4. Create Admin User

```bash
python manage.py create_admin
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Games
- `GET /api/games/` - Get all games
- `GET /api/games/{id}` - Get specific game
- `POST /api/games/sessions/start` - Start game session
- `PUT /api/games/sessions/{id}` - Update game session
- `POST /api/games/sessions/{id}/complete` - Complete session
- `GET /api/games/history` - Get user's game history
- `GET /api/games/leaderboard` - Get leaderboards
- `GET /api/games/stats` - Get user statistics

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me/patient-profile` - Update patient profile
- `PUT /api/users/me/caregiver-profile` - Update caregiver profile
- `GET /api/users/me/preferences` - Get user preferences
- `PUT /api/users/me/preferences` - Update preferences

### Achievements
- `GET /api/achievements/` - Get all achievements
- `GET /api/achievements/user` - Get user achievements
- `GET /api/achievements/user/stats` - Get achievement stats
- `GET /api/achievements/leaderboard` - Achievement leaderboard

## Database Management

### Available Commands

```bash
# Initialize database (create tables)
python manage.py init_db

# Drop all tables (WARNING: deletes all data)
python manage.py drop_db

# Reset database (drop and recreate)
python manage.py reset_db

# Seed database with initial data
python manage.py seed_db

# Create admin user
python manage.py create_admin

# List all users
python manage.py list_users
```

### Database Schema

The database includes these main tables:
- `users` - User accounts and authentication
- `patients` - Patient-specific data
- `caregivers` - Caregiver-specific data
- `games` - Available cognitive games
- `game_sessions` - Individual game play sessions
- `achievements` - Achievement definitions
- `user_achievements` - User's earned achievements
- `user_sessions` - Authentication sessions

## Development

### Running in Development Mode

```bash
export FLASK_ENV=development
python app.py
```

The server will run on `http://localhost:5000` with auto-reload enabled.

### Testing

Run tests with pytest:
```bash
pytest
```

### Code Structure

```
backend/
├── app/
│   ├── models/          # Database models
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   ├── database.py      # Database configuration
│   └── seeds.py         # Database seed data
├── config.py            # Application configuration
├── manage.py            # Database management CLI
├── app.py              # Application entry point
└── requirements.txt     # Python dependencies
```

## Production Deployment

1. **Set environment to production:**
   ```bash
   export FLASK_ENV=production
   ```

2. **Use production WSGI server:**
   ```bash
   gunicorn app:app
   ```

3. **Configure database connection pooling**
4. **Set up proper logging**
5. **Configure reverse proxy (nginx)**

## Troubleshooting

### Database Connection Issues

1. Check PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Verify database exists:
   ```bash
   psql -l | grep mindflex
   ```

3. Test connection:
   ```bash
   psql -h localhost -U postgres -d mindflex
   ```

### Import Errors

If you get import errors, make sure you're running from the backend directory and have installed all dependencies:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Port Already in Use

If port 5000 is busy, set a different port:
```bash
export PORT=8000
python app.py
```