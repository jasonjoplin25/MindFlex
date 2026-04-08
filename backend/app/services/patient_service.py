import os
import json
from datetime import datetime, timedelta
import random

# Mock user data
MOCK_USERS = [
    {
        "id": "user-1",
        "email": "patient1@example.com",
        "name": "John Doe",
        "role": "patient",
        "profile": {
            "age": 72,
            "gender": "male",
            "condition": "Mild Cognitive Impairment",
            "diagnosis_date": "2022-10-15",
            "emergency_contact": {
                "name": "Jane Doe",
                "relationship": "Daughter",
                "phone": "555-123-4567"
            }
        },
        "preferences": {
            "theme": "light",
            "notifications": True,
            "sound_volume": 80,
            "favorite_games": ["memory", "stroop"],
            "favorite_sounds": ["nature", "binaural"]
        },
        "created_at": "2023-01-15T10:30:00Z"
    },
    {
        "id": "user-2",
        "email": "patient2@example.com",
        "name": "Jane Smith",
        "role": "patient",
        "profile": {
            "age": 68,
            "gender": "female",
            "condition": "Early Alzheimer's",
            "diagnosis_date": "2022-08-20",
            "emergency_contact": {
                "name": "Robert Smith",
                "relationship": "Son",
                "phone": "555-987-6543"
            }
        },
        "preferences": {
            "theme": "dark",
            "notifications": True,
            "sound_volume": 70,
            "favorite_games": ["sequence", "memory"],
            "favorite_sounds": ["432hz", "nature"]
        },
        "created_at": "2023-02-10T14:45:00Z"
    }
]

# Mock daily logs
MOCK_DAILY_LOGS = [
    {
        "id": "log-1",
        "user_id": "user-1",
        "date": "2023-05-01",
        "mood": "good",
        "sleep_quality": "good",
        "sleep_hours": 7.5,
        "medication_adherence": True,
        "physical_activity": "moderate",
        "notes": "Had a good day, went for a walk in the park",
        "created_at": "2023-05-01T20:30:00Z"
    },
    {
        "id": "log-2",
        "user_id": "user-1",
        "date": "2023-05-02",
        "mood": "fair",
        "sleep_quality": "fair",
        "sleep_hours": 6.5,
        "medication_adherence": True,
        "physical_activity": "light",
        "notes": "Felt a bit tired today, but managed to do some light exercises",
        "created_at": "2023-05-02T21:15:00Z"
    },
    {
        "id": "log-3",
        "user_id": "user-2",
        "date": "2023-05-01",
        "mood": "good",
        "sleep_quality": "good",
        "sleep_hours": 8,
        "medication_adherence": True,
        "physical_activity": "moderate",
        "notes": "Visited with family, felt energetic",
        "created_at": "2023-05-01T19:45:00Z"
    }
]

# Mock reminders
MOCK_REMINDERS = [
    {
        "id": "reminder-1",
        "user_id": "user-1",
        "title": "Take Morning Medication",
        "description": "Donepezil 5mg with breakfast",
        "time": "08:00",
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        "active": True,
        "created_at": "2023-01-20T09:00:00Z"
    },
    {
        "id": "reminder-2",
        "user_id": "user-1",
        "title": "Memory Exercise",
        "description": "Complete daily memory game",
        "time": "10:00",
        "days": ["monday", "wednesday", "friday"],
        "active": True,
        "created_at": "2023-01-25T14:30:00Z"
    },
    {
        "id": "reminder-3",
        "user_id": "user-2",
        "title": "Take Memantine",
        "description": "10mg with breakfast",
        "time": "08:00",
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        "active": True,
        "created_at": "2023-02-15T08:45:00Z"
    }
]

# Mock goals
MOCK_GOALS = [
    {
        "id": "goal-1",
        "user_id": "user-1",
        "title": "Complete Memory Games",
        "description": "Play memory games for 15 minutes daily",
        "category": "cognitive",
        "target_value": 7,
        "current_value": 4,
        "unit": "days per week",
        "start_date": "2023-04-01",
        "end_date": "2023-06-30",
        "status": "in_progress",
        "created_at": "2023-04-01T10:00:00Z"
    },
    {
        "id": "goal-2",
        "user_id": "user-1",
        "title": "Daily Walks",
        "description": "Take a 20-minute walk each day",
        "category": "physical",
        "target_value": 7,
        "current_value": 5,
        "unit": "days per week",
        "start_date": "2023-04-01",
        "end_date": "2023-06-30",
        "status": "in_progress",
        "created_at": "2023-04-01T10:15:00Z"
    },
    {
        "id": "goal-3",
        "user_id": "user-2",
        "title": "Sound Therapy Sessions",
        "description": "Listen to sound therapy for 15 minutes daily",
        "category": "wellness",
        "target_value": 7,
        "current_value": 6,
        "unit": "days per week",
        "start_date": "2023-04-15",
        "end_date": "2023-07-15",
        "status": "in_progress",
        "created_at": "2023-04-15T09:30:00Z"
    }
]

def get_user_profile(user_id):
    """Get a user's profile information."""
    for user in MOCK_USERS:
        if user["id"] == user_id:
            return user
    return None

def update_user_profile(user_id, data):
    """Update a user's profile information."""
    user = get_user_profile(user_id)
    if not user:
        return {"error": "User not found"}
    
    # Update profile fields
    if "profile" in data:
        for key, value in data["profile"].items():
            user["profile"][key] = value
    
    # Update preferences
    if "preferences" in data:
        for key, value in data["preferences"].items():
            user["preferences"][key] = value
    
    # Update basic user info
    for key, value in data.items():
        if key not in ["profile", "preferences", "id", "created_at", "role"]:
            user[key] = value
    
    return user

def get_daily_logs(user_id, start_date=None, end_date=None, limit=30):
    """Get a user's daily logs within a date range."""
    logs = [log for log in MOCK_DAILY_LOGS if log["user_id"] == user_id]
    
    if start_date:
        logs = [log for log in logs if log["date"] >= start_date]
    
    if end_date:
        logs = [log for log in logs if log["date"] <= end_date]
    
    # Sort by date descending
    logs.sort(key=lambda x: x["date"], reverse=True)
    
    return logs[:limit]

def add_daily_log(user_id, date, mood, sleep_quality, sleep_hours, medication_adherence, physical_activity, notes=None):
    """Add a new daily log entry."""
    log = {
        "id": f"log-{len(MOCK_DAILY_LOGS) + 1}",
        "user_id": user_id,
        "date": date,
        "mood": mood,
        "sleep_quality": sleep_quality,
        "sleep_hours": sleep_hours,
        "medication_adherence": medication_adherence,
        "physical_activity": physical_activity,
        "notes": notes,
        "created_at": datetime.now().isoformat()
    }
    
    MOCK_DAILY_LOGS.append(log)
    return log

def update_daily_log(log_id, data):
    """Update a daily log entry."""
    for i, log in enumerate(MOCK_DAILY_LOGS):
        if log["id"] == log_id:
            # Update fields
            for key, value in data.items():
                if key in log and key != "id" and key != "created_at" and key != "user_id":
                    log[key] = value
            return log
    
    return {"error": "Log not found"}

def get_reminders(user_id):
    """Get all reminders for a user."""
    return [reminder for reminder in MOCK_REMINDERS if reminder["user_id"] == user_id]

def add_reminder(user_id, title, description, time, days, active=True):
    """Add a new reminder."""
    reminder = {
        "id": f"reminder-{len(MOCK_REMINDERS) + 1}",
        "user_id": user_id,
        "title": title,
        "description": description,
        "time": time,
        "days": days,
        "active": active,
        "created_at": datetime.now().isoformat()
    }
    
    MOCK_REMINDERS.append(reminder)
    return reminder

def update_reminder(reminder_id, data):
    """Update a reminder."""
    for i, reminder in enumerate(MOCK_REMINDERS):
        if reminder["id"] == reminder_id:
            # Update fields
            for key, value in data.items():
                if key in reminder and key != "id" and key != "created_at" and key != "user_id":
                    reminder[key] = value
            return reminder
    
    return {"error": "Reminder not found"}

def delete_reminder(reminder_id):
    """Delete a reminder."""
    for i, reminder in enumerate(MOCK_REMINDERS):
        if reminder["id"] == reminder_id:
            del MOCK_REMINDERS[i]
            return {"success": True}
    
    return {"error": "Reminder not found"}

def get_goals(user_id):
    """Get all goals for a user."""
    return [goal for goal in MOCK_GOALS if goal["user_id"] == user_id]

def add_goal(user_id, title, description, category, target_value, unit, start_date, end_date):
    """Add a new goal."""
    goal = {
        "id": f"goal-{len(MOCK_GOALS) + 1}",
        "user_id": user_id,
        "title": title,
        "description": description,
        "category": category,
        "target_value": target_value,
        "current_value": 0,
        "unit": unit,
        "start_date": start_date,
        "end_date": end_date,
        "status": "in_progress",
        "created_at": datetime.now().isoformat()
    }
    
    MOCK_GOALS.append(goal)
    return goal

def update_goal(goal_id, data):
    """Update a goal."""
    for i, goal in enumerate(MOCK_GOALS):
        if goal["id"] == goal_id:
            # Update fields
            for key, value in data.items():
                if key in goal and key != "id" and key != "created_at" and key != "user_id":
                    goal[key] = value
            
            # Check if goal is completed
            if "current_value" in data and "target_value" in goal:
                if data["current_value"] >= goal["target_value"]:
                    goal["status"] = "completed"
            
            return goal
    
    return {"error": "Goal not found"}

def delete_goal(goal_id):
    """Delete a goal."""
    for i, goal in enumerate(MOCK_GOALS):
        if goal["id"] == goal_id:
            del MOCK_GOALS[i]
            return {"success": True}
    
    return {"error": "Goal not found"}

def get_dashboard_data(user_id):
    """Get dashboard data for a patient."""
    user = get_user_profile(user_id)
    if not user:
        return {"error": "User not found"}
    
    # Get recent logs
    logs = get_daily_logs(user_id, limit=7)
    
    # Get active reminders
    reminders = [r for r in get_reminders(user_id) if r["active"]]
    
    # Get in-progress goals
    goals = [g for g in get_goals(user_id) if g["status"] == "in_progress"]
    
    # Calculate wellness metrics
    mood_data = [log["mood"] for log in logs]
    sleep_data = [log["sleep_hours"] for log in logs]
    medication_adherence = sum(1 for log in logs if log["medication_adherence"]) / len(logs) if logs else 0
    
    wellness_metrics = {
        "average_mood": calculate_average_mood(mood_data) if mood_data else None,
        "average_sleep": sum(sleep_data) / len(sleep_data) if sleep_data else None,
        "medication_adherence": medication_adherence * 100 if logs else None
    }
    
    return {
        "user": user,
        "recent_logs": logs,
        "active_reminders": reminders,
        "in_progress_goals": goals,
        "wellness_metrics": wellness_metrics
    }

def calculate_average_mood(mood_data):
    """Calculate average mood from text values."""
    mood_values = {
        "excellent": 5,
        "good": 4,
        "fair": 3,
        "poor": 2,
        "very_poor": 1
    }
    
    total = sum(mood_values.get(mood, 0) for mood in mood_data)
    return total / len(mood_data) if mood_data else 0 