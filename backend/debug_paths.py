import sys
import os
import importlib.util

# Print the current directory
print(f"Current directory: {os.getcwd()}")

# Print Python path
print(f"Python path: {sys.path}")

# Check if app.py exists
app_path = os.path.join(os.getcwd(), 'app.py')
print(f"app.py exists: {os.path.exists(app_path)}")

# List all files in current directory
print(f"Files in current directory: {os.listdir('.')}")

# Try to see what's in the app directory
try:
    if os.path.exists('./app'):
        print(f"Files in app directory: {os.listdir('./app')}")
except Exception as e:
    print(f"Error listing app directory: {e}")

# Try to load app.py directly
try:
    spec = importlib.util.spec_from_file_location("app_module", app_path)
    if spec:
        app_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(app_module)
        print("Successfully loaded app.py")
        print(f"Contents of app_module: {dir(app_module)}")
    else:
        print("Failed to create spec for app.py")
except Exception as e:
    print(f"Error loading app.py: {e}")

# Try to import app directly
try:
    import app
    print("Successfully imported app module")
    print(f"app.__file__: {app.__file__}")
    print(f"Contents of app: {dir(app)}")
except Exception as e:
    print(f"Error importing app: {e}") 