#!/usr/bin/env python3
"""
Sentora Server Startup Script
----------------------------
Starts the Sentora central server with Celery workers.
"""

import os
import subprocess
import sys
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def start_server():
    """Start the FastAPI server using uvicorn."""
    print("Starting Sentora Central Server...")
    server_process = subprocess.Popen(
        ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    return server_process

def start_celery_worker():
    """Start a Celery worker."""
    print("Starting Celery worker...")
    worker_process = subprocess.Popen(
        ["celery", "-A", "server", "worker", "--loglevel=info"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    return worker_process

def start_celery_beat():
    """Start Celery beat for scheduled tasks."""
    print("Starting Celery beat...")
    beat_process = subprocess.Popen(
        ["celery", "-A", "server", "beat", "--loglevel=info"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    return beat_process

def main():
    """Main entry point for the startup script."""
    try:
        # Start all components
        server_process = start_server()
        time.sleep(2)  # Give the server time to start
        worker_process = start_celery_worker()
        beat_process = start_celery_beat()
        
        print("\nSentora Central Server is running!")
        print("API server: http://localhost:8000")
        print("\nPress Ctrl+C to stop all services...")
        
        # Wait for keyboard interrupt
        server_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down Sentora Central Server...")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Clean up processes
        for process in [server_process, worker_process, beat_process]:
            if process and process.poll() is None:
                process.terminate()
                process.wait()
        
        print("Sentora Central Server stopped")

if __name__ == "__main__":
    main()
