#!/usr/bin/env python3
"""
Database management script for MindFlex
Usage: python manage.py [command]
"""

import os
import sys
import click
from flask.cli import with_appcontext
import sys
sys.path.append('.')
import app as app_module
create_app = app_module.create_app
from app.database import db
from app.models import *

app = create_app()

@click.group()
def cli():
    """MindFlex database management commands."""
    pass

@cli.command()
@with_appcontext
def init_db():
    """Initialize the database."""
    click.echo('Creating database tables...')
    db.create_all()
    click.echo('Database tables created successfully!')

@cli.command()
@with_appcontext
def drop_db():
    """Drop all database tables."""
    if click.confirm('Are you sure you want to drop all tables? This will delete all data!'):
        db.drop_all()
        click.echo('All tables dropped!')

@cli.command()
@with_appcontext
def reset_db():
    """Drop and recreate all database tables."""
    if click.confirm('Are you sure you want to reset the database? This will delete all data!'):
        click.echo('Dropping tables...')
        db.drop_all()
        click.echo('Creating tables...')
        db.create_all()
        click.echo('Database reset complete!')

@cli.command()
@with_appcontext
def seed_db():
    """Seed the database with initial data."""
    click.echo('Seeding database with initial data...')
    
    # Import seed data functions
    from app.seeds import seed_games, seed_achievements
    
    try:
        seed_games()
        seed_achievements()
        db.session.commit()
        click.echo('Database seeded successfully!')
    except Exception as e:
        db.session.rollback()
        click.echo(f'Error seeding database: {e}', err=True)
        sys.exit(1)

@cli.command()
@click.option('--email', prompt='Email', help='Admin email address')
@click.option('--password', prompt='Password', hide_input=True, help='Admin password')
@click.option('--first-name', prompt='First Name', help='Admin first name')
@click.option('--last-name', prompt='Last Name', help='Admin last name')
@with_appcontext
def create_admin(email, password, first_name, last_name):
    """Create an admin user."""
    from app.models.user import User
    
    # Check if user already exists
    if User.find_by_email(email):
        click.echo(f'User with email {email} already exists!', err=True)
        return
    
    try:
        admin_user = User(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            user_type='admin',
            email_verified=True
        )
        db.session.add(admin_user)
        db.session.commit()
        click.echo(f'Admin user {email} created successfully!')
    except Exception as e:
        db.session.rollback()
        click.echo(f'Error creating admin user: {e}', err=True)

@cli.command()
@with_appcontext
def list_users():
    """List all users in the database."""
    from app.models.user import User
    
    users = User.query.all()
    if not users:
        click.echo('No users found.')
        return
    
    click.echo('Users:')
    for user in users:
        click.echo(f'  {user.email} ({user.user_type}) - {user.full_name}')

if __name__ == '__main__':
    with app.app_context():
        cli()