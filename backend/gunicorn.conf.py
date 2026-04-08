# Gunicorn configuration for Render deployment

import os
import multiprocessing

# Bind to the port provided by Render
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"

# Use the number of workers recommended for Render
workers = int(os.environ.get('WEB_CONCURRENCY', multiprocessing.cpu_count() * 2 + 1))

# Set timeout values
timeout = 120
keepalive = 5

# Access log settings
accesslog = '-'  # Log to stdout
errorlog = '-'   # Log errors to stdout
loglevel = 'info'

# Process naming
proc_name = 'mindflex-backend'

# Prevent server timeouts
worker_class = 'sync'
worker_connections = 1000

# Add application specific settings
forwarded_allow_ips = '*'
secure_scheme_headers = {'X-Forwarded-Proto': 'https'} 