#!/usr/bin/env python3
"""
Database migration script to add schedule_items table
"""

import os
import sys
from flask import Flask
from dotenv import load_dotenv

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Import configuration and app components
from config import config
from app.database import db, init_db
from sqlalchemy import text

def create_schedule_items_table():
    """Create schedule_items table."""
    print("Creating schedule_items table...")
    
    # Create Flask app
    app = Flask(__name__)
    
    # Configure app
    app.config.from_object(config['development'])
    
    # Initialize database
    init_db(app)
    
    with app.app_context():
        try:
            # Check if table already exists
            result = db.session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name = 'schedule_items';"))
            if result.fetchone():
                print("✓ Schedule_items table already exists")
                return True
            
            # Create the table
            create_table_sql = """
            CREATE TABLE schedule_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                emoji VARCHAR(10) NOT NULL DEFAULT '📝',
                text TEXT NOT NULL,
                time VARCHAR(20) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """
            
            db.session.execute(text(create_table_sql))
            
            # Create index on user_id for better performance
            index_sql = "CREATE INDEX idx_schedule_items_user_id ON schedule_items(user_id);"
            db.session.execute(text(index_sql))
            
            # Create index on order_index for sorting
            order_index_sql = "CREATE INDEX idx_schedule_items_order ON schedule_items(user_id, order_index);"
            db.session.execute(text(order_index_sql))
            
            db.session.commit()
            print("✓ Schedule_items table created successfully!")
            
        except Exception as e:
            print(f"✗ Error creating schedule_items table: {e}")
            db.session.rollback()
            return False
    
    return True

if __name__ == '__main__':
    success = create_schedule_items_table()
    sys.exit(0 if success else 1)