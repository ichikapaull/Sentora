#!/usr/bin/env python3
"""
Sentora Central Server
---------------------
Receives metrics from monitoring agents, stores them in MongoDB,
and triggers alerts when thresholds are exceeded.
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from fastapi import FastAPI, HTTPException, Depends, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from celery import Celery
import redis
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Sentora Central Server",
    description="Central server for Sentora monitoring system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("sentora-server")

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "sentora")
mongo_client = MongoClient(MONGO_URI)
db = mongo_client[MONGO_DB]
metrics_collection = db["metrics"]
alerts_collection = db["alerts"]
agents_collection = db["agents"]

# Redis and Celery configuration
REDIS_URI = os.getenv("REDIS_URI", "redis://localhost:6379/0")
celery_app = Celery("sentora", broker=REDIS_URI, backend=REDIS_URI)
redis_client = redis.Redis.from_url(REDIS_URI)

# Alert configuration
ALERT_EMAIL_ENABLED = os.getenv("ALERT_EMAIL_ENABLED", "false").lower() == "true"
ALERT_EMAIL_FROM = os.getenv("ALERT_EMAIL_FROM", "alerts@sentora.local")
ALERT_EMAIL_TO = os.getenv("ALERT_EMAIL_TO", "admin@example.com")
ALERT_EMAIL_SMTP_SERVER = os.getenv("ALERT_EMAIL_SMTP_SERVER", "localhost")
ALERT_EMAIL_SMTP_PORT = int(os.getenv("ALERT_EMAIL_SMTP_PORT", "25"))
ALERT_EMAIL_USERNAME = os.getenv("ALERT_EMAIL_USERNAME", "")
ALERT_EMAIL_PASSWORD = os.getenv("ALERT_EMAIL_PASSWORD", "")

ALERT_TELEGRAM_ENABLED = os.getenv("ALERT_TELEGRAM_ENABLED", "false").lower() == "true"
ALERT_TELEGRAM_BOT_TOKEN = os.getenv("ALERT_TELEGRAM_BOT_TOKEN", "")
ALERT_TELEGRAM_CHAT_ID = os.getenv("ALERT_TELEGRAM_CHAT_ID", "")

ALERT_DISCORD_ENABLED = os.getenv("ALERT_DISCORD_ENABLED", "false").lower() == "true"
ALERT_DISCORD_WEBHOOK_URL = os.getenv("ALERT_DISCORD_WEBHOOK_URL", "")

# API key authentication
API_KEYS = os.getenv("API_KEYS", "your_api_key_here").split(",")

# Models
class NetworkMetrics(BaseModel):
    in_traffic: Optional[float] = None
    out_traffic: Optional[float] = None

class ServiceStatus(BaseModel):
    name: str
    status: str

class SSHBruteForce(BaseModel):
    failed_attempts: int
    threshold_exceeded: bool

class MetricsData(BaseModel):
    cpu_usage: Optional[float] = None
    ram_usage: Optional[float] = None
    disk_usage: Optional[Dict[str, float]] = None
    network: Optional[Dict[str, Dict[str, float]]] = None
    services: Optional[Dict[str, str]] = None
    ssh_brute_force: Optional[Dict[str, Any]] = None
    timestamp: str
    agent_name: str
    hostname: str

class AlertConfig(BaseModel):
    cpu_threshold: float = 80.0
    ram_threshold: float = 85.0
    disk_threshold: float = 90.0
    service_alerts: bool = True
    ssh_brute_force_alerts: bool = True

class AlertResponse(BaseModel):
    id: str
    agent_name: str
    alert_type: str
    message: str
    timestamp: str
    acknowledged: bool = False

# Helper functions
def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key not in API_KEYS:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

def send_email_alert(subject: str, message: str):
    """Send an email alert."""
    if not ALERT_EMAIL_ENABLED:
        logger.info("Email alerts are disabled")
        return False
    
    try:
        msg = MIMEMultipart()
        msg['From'] = ALERT_EMAIL_FROM
        msg['To'] = ALERT_EMAIL_TO
        msg['Subject'] = subject
        
        msg.attach(MIMEText(message, 'plain'))
        
        server = smtplib.SMTP(ALERT_EMAIL_SMTP_SERVER, ALERT_EMAIL_SMTP_PORT)
        if ALERT_EMAIL_USERNAME and ALERT_EMAIL_PASSWORD:
            server.starttls()
            server.login(ALERT_EMAIL_USERNAME, ALERT_EMAIL_PASSWORD)
        
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email alert sent: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email alert: {e}")
        return False

def send_telegram_alert(message: str):
    """Send a Telegram alert."""
    if not ALERT_TELEGRAM_ENABLED:
        logger.info("Telegram alerts are disabled")
        return False
    
    try:
        url = f"https://api.telegram.org/bot{ALERT_TELEGRAM_BOT_TOKEN}/sendMessage"
        data = {
            "chat_id": ALERT_TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "Markdown"
        }
        
        response = requests.post(url, data=data)
        if response.status_code == 200:
            logger.info("Telegram alert sent")
            return True
        else:
            logger.error(f"Failed to send Telegram alert: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Failed to send Telegram alert: {e}")
        return False

def send_discord_alert(message: str):
    """Send a Discord alert."""
    if not ALERT_DISCORD_ENABLED:
        logger.info("Discord alerts are disabled")
        return False
    
    try:
        data = {
            "content": message
        }
        
        response = requests.post(ALERT_DISCORD_WEBHOOK_URL, json=data)
        if response.status_code == 204:
            logger.info("Discord alert sent")
            return True
        else:
            logger.error(f"Failed to send Discord alert: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Failed to send Discord alert: {e}")
        return False

def send_alert(alert_type: str, agent_name: str, hostname: str, message: str):
    """Send an alert through all configured channels."""
    timestamp = datetime.now().isoformat()
    
    # Create alert record
    alert_id = alerts_collection.insert_one({
        "agent_name": agent_name,
        "hostname": hostname,
        "alert_type": alert_type,
        "message": message,
        "timestamp": timestamp,
        "acknowledged": False
    }).inserted_id
    
    # Format alert message
    alert_message = f"""
ALERT: {alert_type}
Agent: {agent_name} ({hostname})
Time: {timestamp}
Message: {message}
    """
    
    # Send through all enabled channels
    if ALERT_EMAIL_ENABLED:
        send_email_alert(f"Sentora Alert: {alert_type} on {hostname}", alert_message)
    
    if ALERT_TELEGRAM_ENABLED:
        send_telegram_alert(alert_message)
    
    if ALERT_DISCORD_ENABLED:
        send_discord_alert(alert_message)
    
    return str(alert_id)

def check_thresholds(metrics: MetricsData):
    """Check if any metrics exceed thresholds and send alerts if needed."""
    agent_name = metrics.agent_name
    hostname = metrics.hostname
    alerts_sent = []
    
    # Get agent-specific alert configuration
    agent_config = agents_collection.find_one({"name": agent_name})
    if agent_config and "alert_config" in agent_config:
        alert_config = AlertConfig(**agent_config["alert_config"])
    else:
        # Use default alert configuration
        alert_config = AlertConfig()
    
    # Check CPU usage
    if metrics.cpu_usage is not None and metrics.cpu_usage > alert_config.cpu_threshold:
        message = f"CPU usage is {metrics.cpu_usage}%, which exceeds the threshold of {alert_config.cpu_threshold}%"
        alert_id = send_alert("CPU_HIGH", agent_name, hostname, message)
        alerts_sent.append({"type": "CPU_HIGH", "id": alert_id})
    
    # Check RAM usage
    if metrics.ram_usage is not None and metrics.ram_usage > alert_config.ram_threshold:
        message = f"RAM usage is {metrics.ram_usage}%, which exceeds the threshold of {alert_config.ram_threshold}%"
        alert_id = send_alert("RAM_HIGH", agent_name, hostname, message)
        alerts_sent.append({"type": "RAM_HIGH", "id": alert_id})
    
    # Check disk usage
    if metrics.disk_usage is not None:
        for path, usage in metrics.disk_usage.items():
            if usage > alert_config.disk_threshold:
                message = f"Disk usage for {path} is {usage}%, which exceeds the threshold of {alert_config.disk_threshold}%"
                alert_id = send_alert("DISK_HIGH", agent_name, hostname, message)
                alerts_sent.append({"type": "DISK_HIGH", "id": alert_id, "path": path})
    
    # Check service status
    if alert_config.service_alerts and metrics.services is not None:
        for service, status in metrics.services.items():
            if status != "active":
                message = f"Service {service} is {status}"
                alert_id = send_alert("SERVICE_DOWN", agent_name, hostname, message)
                alerts_sent.append({"type": "SERVICE_DOWN", "id": alert_id, "service": service})
    
    # Check SSH brute force
    if alert_config.ssh_brute_force_alerts and metrics.ssh_brute_force is not None:
        if metrics.ssh_brute_force.get("threshold_exceeded", False):
            failed_attempts = metrics.ssh_brute_force.get("failed_attempts", 0)
            message = f"SSH brute force attack detected with {failed_attempts} failed login attempts"
            alert_id = send_alert("SSH_BRUTE_FORCE", agent_name, hostname, message)
            alerts_sent.append({"type": "SSH_BRUTE_FORCE", "id": alert_id})
    
    return alerts_sent

# API endpoints
@app.post("/data", status_code=200)
async def receive_metrics(
    metrics: MetricsData,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key)
):
    """Receive metrics from a monitoring agent."""
    logger.info(f"Received metrics from {metrics.agent_name} ({metrics.hostname})")
    
    # Convert to dict for MongoDB storage
    metrics_dict = metrics.dict()
    
    # Store in MongoDB
    metrics_collection.insert_one(metrics_dict)
    
    # Register or update agent
    agents_collection.update_one(
        {"name": metrics.agent_name},
        {"$set": {
            "name": metrics.agent_name,
            "hostname": metrics.hostname,
            "last_seen": datetime.now().isoformat()
        }},
        upsert=True
    )
    
    # Check thresholds in background
    background_tasks.add_task(check_thresholds, metrics)
    
    return {"status": "success", "message": "Metrics received"}

@app.get("/agents", status_code=200)
async def get_agents(api_key: str = Depends(verify_api_key)):
    """Get a list of all registered agents."""
    agents = list(agents_collection.find({}, {"_id": 0}))
    return {"agents": agents}

@app.get("/history/{agent_name}", status_code=200)
async def get_agent_history(
    agent_name: str,
    hours: int = 24,
    api_key: str = Depends(verify_api_key)
):
    """Get historical metrics for a specific agent."""
    # Calculate time range
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=hours)
    
    # Query MongoDB
    metrics = list(metrics_collection.find({
        "agent_name": agent_name,
        "timestamp": {"$gte": start_time.isoformat(), "$lte": end_time.isoformat()}
    }, {"_id": 0}).sort("timestamp", -1))
    
    return {"agent": agent_name, "metrics": metrics}

@app.get("/alerts", status_code=200)
async def get_alerts(
    acknowledged: bool = None,
    hours: int = 24,
    api_key: str = Depends(verify_api_key)
):
    """Get alerts, optionally filtered by acknowledgement status."""
    # Calculate time range
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=hours)
    
    # Build query
    query = {
        "timestamp": {"$gte": start_time.isoformat(), "$lte": end_time.isoformat()}
    }
    
    if acknowledged is not None:
        query["acknowledged"] = acknowledged
    
    # Query MongoDB
    alerts = list(alerts_collection.find(query, {"_id": 0}).sort("timestamp", -1))
    
    return {"alerts": alerts}

@app.post("/alerts/{alert_id}/acknowledge", status_code=200)
async def acknowledge_alert(
    alert_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Acknowledge an alert."""
    result = alerts_collection.update_one(
        {"_id": alert_id},
        {"$set": {"acknowledged": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"status": "success", "message": "Alert acknowledged"}

@app.post("/agent/{agent_name}/config", status_code=200)
async def update_agent_config(
    agent_name: str,
    config: AlertConfig,
    api_key: str = Depends(verify_api_key)
):
    """Update alert configuration for a specific agent."""
    result = agents_collection.update_one(
        {"name": agent_name},
        {"$set": {"alert_config": config.dict()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return {"status": "success", "message": "Agent configuration updated"}

# Celery tasks
@celery_app.task
def check_agent_status():
    """Check if any agents have stopped reporting."""
    threshold = datetime.now() - timedelta(minutes=10)
    
    # Find agents that haven't reported in the last 10 minutes
    inactive_agents = list(agents_collection.find({
        "last_seen": {"$lt": threshold.isoformat()}
    }))
    
    for agent in inactive_agents:
        # Check if we've already alerted for this agent
        alert_key = f"agent_inactive:{agent['name']}"
        if not redis_client.get(alert_key):
            # Send alert
            message = f"Agent has not reported in over 10 minutes"
            send_alert("AGENT_INACTIVE", agent["name"], agent["hostname"], message)
            
            # Set a flag in Redis to avoid duplicate alerts
            redis_client.set(alert_key, "1", ex=3600)  # Expire after 1 hour

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize the server on startup."""
    logger.info("Sentora Central Server starting up")
    
    # Create indexes
    metrics_collection.create_index([("agent_name", 1), ("timestamp", -1)])
    alerts_collection.create_index([("agent_name", 1), ("timestamp", -1)])
    alerts_collection.create_index([("acknowledged", 1)])
    
    # Set up periodic tasks
    celery_app.conf.beat_schedule = {
        'check-agent-status': {
            'task': 'server:check_agent_status',
            'schedule': 300.0,  # Every 5 minutes
        },
    }
    
    logger.info("Sentora Central Server started successfully")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    logger.info("Sentora Central Server shutting down")
    mongo_client.close()
    redis_client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
