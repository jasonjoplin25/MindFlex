# MindFlex Backend Deployment Guide

This document provides instructions for deploying the MindFlex Flask backend to various cloud services.

## Preparing for Deployment

Before deploying, ensure:
1. All dependencies are listed in `requirements.txt`
2. Environment variables are properly set up
3. Your code is committed to GitHub

## Render Deployment (Recommended)

### Steps:

1. Create a [Render account](https://render.com/)
2. Connect your GitHub account
3. Create a new Web Service
4. Select your MindFlex repository
5. Configure:
   - **Name**: mindflex-backend
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && gunicorn wsgi:app`
   - **Root Directory**: `/` (repository root)
   - **Branch**: main (or your preferred branch)

6. Add Environment Variables:
   - Add all variables from your `.env` file
   - **IMPORTANT**: Ensure `CORS_ORIGINS` includes your GitHub Pages URL without trailing slashes:
     ```
     https://jasonjoplin.github.io,https://jasonjoplin.github.io/MindFlex,http://localhost:3000
     ```

7. Deploy your service

## Environment Variables to Set

```
FLASK_ENV=production
PORT=10000
DB_HOST=your_postgres_host
DB_PORT=5432
DB_NAME=mindflex
DB_USER=your_db_user
DB_PASSWORD=your_db_password
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret_key
CORS_ORIGINS=https://jasonjoplin.github.io,https://jasonjoplin.github.io/MindFlex,http://localhost:3000
OPENAI_API_KEY=your_openai_key (if using)
ANTHROPIC_API_KEY=your_anthropic_key (if using)
```

## Connecting Frontend to Backend

Update your frontend environment to point to your new backend:

1. Create a `.env.production` file in your frontend directory with:
```
REACT_APP_API_URL=https://your-render-app-name.onrender.com
```

2. Rebuild and redeploy your frontend

## Alternative Deployment Options

### Railway

1. Create a [Railway account](https://railway.app/)
2. Connect GitHub repository
3. Create a new project
4. Configure as a Python service
5. Set the following:
   - Root directory: `backend`
   - Start command: `gunicorn wsgi:app`
   - Add all environment variables

### PythonAnywhere

1. Create a [PythonAnywhere account](https://www.pythonanywhere.com/)
2. Create a new Web App with Flask
3. Set up a Git repository
4. Configure WSGI file
5. Set up environment variables in the WSGI configuration

### Fly.io

1. Install the [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/)
2. Authenticate with `fly auth login`
3. Initialize app with `fly launch`
4. Deploy with `fly deploy` 