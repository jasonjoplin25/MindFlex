#!/usr/bin/env python3
"""
Setup script for MindFlex backend
"""
import os
import subprocess
import sys
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 8):
        print("ERROR: Python 3.8 or higher is required!")
        sys.exit(1)
    print(f"✓ Python {sys.version.split()[0]} detected")

def check_postgresql():
    """Check if PostgreSQL is available."""
    try:
        result = subprocess.run(['psql', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✓ PostgreSQL detected: {result.stdout.strip()}")
            return True
    except FileNotFoundError:
        pass
    
    print("⚠ PostgreSQL not found or not in PATH")
    print("Please install PostgreSQL:")
    print("  - Windows: Download from https://www.postgresql.org/download/windows/")
    print("  - macOS: brew install postgresql")
    print("  - Ubuntu/Debian: sudo apt install postgresql postgresql-contrib")
    return False

def create_env_file():
    """Create .env file if it doesn't exist."""
    env_path = Path('.env')
    env_example_path = Path('.env.example')
    
    if env_path.exists():
        print("✓ .env file already exists")
        return
    
    if env_example_path.exists():
        # Copy .env.example to .env
        with open(env_example_path, 'r') as src, open(env_path, 'w') as dst:
            dst.write(src.read())
        print("✓ Created .env file from .env.example")
        print("⚠ Please update .env with your actual database credentials and API keys")
    else:
        print("⚠ .env.example file not found")

def install_dependencies():
    """Install Python dependencies."""
    print("Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✓ Dependencies installed successfully")
    except subprocess.CalledProcessError:
        print("✗ Failed to install dependencies")
        return False
    return True

def setup_database():
    """Setup database."""
    print("\nDatabase setup:")
    print("1. Make sure PostgreSQL is running")
    print("2. Create database: createdb mindflex")
    print("3. Run: python manage.py init_db")
    print("4. Seed data: python manage.py seed_db")
    print("5. Create admin: python manage.py create_admin")

def main():
    """Main setup function."""
    print("=== MindFlex Backend Setup ===\n")
    
    # Check requirements
    check_python_version()
    postgresql_available = check_postgresql()
    
    # Create .env file
    create_env_file()
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Database setup instructions
    if postgresql_available:
        setup_database()
    else:
        print("\nPlease install PostgreSQL first, then run this setup again.")
    
    print("\n=== Setup Complete ===")
    print("Next steps:")
    print("1. Update .env file with your database credentials")
    print("2. Create database: createdb mindflex")
    print("3. Initialize database: python manage.py init_db")
    print("4. Seed database: python manage.py seed_db")
    print("5. Create admin user: python manage.py create_admin")
    print("6. Start server: python app.py")

if __name__ == '__main__':
    main()