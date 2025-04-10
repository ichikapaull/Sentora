# Sentora - Linux Server Monitoring and Auto Alert System

![Sentora Logo](https://via.placeholder.com/150x150.png?text=Sentora)

## Overview

Sentora is an open-source Linux server monitoring and auto alert system that tracks hardware and service statuses in real-time and sends automatic alerts when predefined thresholds are exceeded. The system consists of three main components:

1. **Monitoring Agent (Client-Side)**: A lightweight Python application that collects system metrics and sends them to the central server.
2. **Central Server (Backend)**: A FastAPI server that receives, stores, and processes metrics, and sends alerts when thresholds are exceeded.
3. **Web Dashboard**: A React-based dashboard for visualizing metrics, server status, and alerts.

## Features

- **Real-time Monitoring**: Track CPU, RAM, disk usage, network traffic, service status, and SSH brute force attempts.
- **Customizable Thresholds**: Set custom alert thresholds for each metric.
- **Multiple Alert Channels**: Receive alerts via Email, Telegram, or Discord.
- **Responsive Dashboard**: View server status and metrics in real-time with interactive charts.
- **Containerized Deployment**: Easy deployment with Docker and docker-compose.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Monitoring │     │   Central   │     │     Web     │
│    Agent    │────▶│    Server   │◀────│  Dashboard  │
└─────────────┘     └─────────────┘     └─────────────┘
                          │  ▲
                          │  │
                          ▼  │
                    ┌─────────────┐
                    │  MongoDB &  │
                    │    Redis    │
                    └─────────────┘
```

## Installation

### Prerequisites

- Docker and Docker Compose
- Git

### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sentora.git
   cd sentora
   ```

2. Configure environment variables:
   ```bash
   # Copy example environment files
   cp server/.env.example server/.env
   cp dashboard/.env.example dashboard/.env
   cp agent/config.yaml agent/config.local.yaml
   
   # Edit the files with your configuration
   nano server/.env
   nano dashboard/.env
   nano agent/config.local.yaml
   ```

3. Start the system:
   ```bash
   docker-compose up -d
   ```

4. Access the dashboard:
   - Open your browser and navigate to `http://localhost:3000`
   - Log in using the API key configured in the server's `.env` file

## Component Details

### Monitoring Agent

The monitoring agent is a Python application that collects system metrics and sends them to the central server. It uses `psutil` to gather system information and sends it as JSON via HTTP.

#### Configuration

The agent is configured using a YAML file (`config.yaml`). Here's an example configuration:

```yaml
# Agent identification
agent:
  name: "server1"  # Unique name for this server
  interval: 60     # Data collection interval in seconds

# Central server connection
server:
  url: "http://localhost:8000/data"  # API endpoint for data submission
  api_key: "your_api_key_here"       # Authentication key

# Monitoring configuration
monitoring:
  # CPU monitoring
  cpu:
    enabled: true
    threshold: 80  # Alert when CPU usage exceeds this percentage

  # RAM monitoring
  ram:
    enabled: true
    threshold: 85  # Alert when RAM usage exceeds this percentage

  # Disk monitoring
  disk:
    enabled: true
    paths:
      - "/"        # Monitor root partition
      - "/home"    # Monitor home partition (if separate)
    threshold: 90  # Alert when disk usage exceeds this percentage

  # Network monitoring
  network:
    enabled: true
    interfaces:
      - "eth0"     # Network interface to monitor
    threshold:
      in: 100000   # Incoming traffic threshold in KB/s
      out: 100000  # Outgoing traffic threshold in KB/s

  # Service monitoring
  services:
    enabled: true
    list:
      - "nginx"
      - "postgresql"
      - "mongodb"
      - "redis"

  # SSH brute force detection
  ssh:
    enabled: true
    log_path: "/var/log/auth.log"
    threshold: 5   # Number of failed attempts to trigger alert
```

#### Deployment

To deploy the agent on a server:

1. Install Docker on the server
2. Create a configuration file
3. Run the agent container:
   ```bash
   docker run -d \
     --name sentora-agent \
     -v /var/log:/var/log:ro \
     -v /path/to/config.yaml:/app/config.yaml \
     sentora/agent
   ```

### Central Server

The central server is a FastAPI application that receives metrics from agents, stores them in MongoDB, and sends alerts when thresholds are exceeded. It uses Celery with Redis for background tasks.

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/data` | POST | Receive metrics from agents |
| `/agents` | GET | Get a list of all registered agents |
| `/history/{agent_name}` | GET | Get historical metrics for a specific agent |
| `/alerts` | GET | Get alerts, optionally filtered by acknowledgement status |
| `/alerts/{alert_id}/acknowledge` | POST | Acknowledge an alert |
| `/agent/{agent_name}/config` | POST | Update alert configuration for a specific agent |

#### Alert Channels

The server supports the following alert channels:

- **Email**: Send alerts via SMTP
- **Telegram**: Send alerts via Telegram Bot API
- **Discord**: Send alerts via Discord Webhooks

#### Configuration

The server is configured using environment variables. Here's an example configuration:

```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017
MONGO_DB=sentora

# Redis Configuration
REDIS_URI=redis://localhost:6379/0

# API Security
API_KEYS=your_api_key_here,another_api_key

# Email Alert Configuration
ALERT_EMAIL_ENABLED=false
ALERT_EMAIL_FROM=alerts@sentora.local
ALERT_EMAIL_TO=admin@example.com
ALERT_EMAIL_SMTP_SERVER=smtp.example.com
ALERT_EMAIL_SMTP_PORT=587
ALERT_EMAIL_USERNAME=username
ALERT_EMAIL_PASSWORD=password

# Telegram Alert Configuration
ALERT_TELEGRAM_ENABLED=false
ALERT_TELEGRAM_BOT_TOKEN=your_bot_token
ALERT_TELEGRAM_CHAT_ID=your_chat_id

# Discord Alert Configuration
ALERT_DISCORD_ENABLED=false
ALERT_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_url
```

### Web Dashboard

The web dashboard is a React application that provides a user interface for viewing server status, metrics, and alerts. It uses Chart.js for visualizing metrics and Tailwind CSS for styling.

#### Features

- **Authentication**: Secure access with API key authentication
- **Real-time Dashboard**: View system metrics in real-time
- **Server Management**: View and manage monitored servers
- **Alert Management**: View and acknowledge alerts
- **Settings**: Configure alert thresholds and notification channels

#### Configuration

The dashboard is configured using environment variables. Here's an example configuration:

```env
REACT_APP_API_URL=http://localhost:8000
```

## Docker Deployment

The system is containerized using Docker and can be deployed using Docker Compose. The `docker-compose.yml` file includes the following services:

- **mongodb**: MongoDB database for storing metrics and alerts
- **redis**: Redis for Celery task queue
- **server**: Central server API
- **worker**: Celery worker for processing background tasks
- **beat**: Celery beat for scheduled tasks
- **dashboard**: Web dashboard
- **agent**: Example monitoring agent (can be deployed separately on monitored servers)

## Development

### Prerequisites

- Python 3.10+
- Node.js 20+
- MongoDB
- Redis

### Setting Up Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sentora.git
   cd sentora
   ```

2. Set up Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r agent/requirements.txt
   pip install -r server/requirements.txt
   ```

4. Install Node.js dependencies:
   ```bash
   cd dashboard
   npm install
   ```

5. Start MongoDB and Redis:
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo
   docker run -d -p 6379:6379 --name redis redis
   ```

6. Start the server:
   ```bash
   cd server
   python server.py
   ```

7. Start the dashboard:
   ```bash
   cd dashboard
   npm start
   ```

8. Start the agent:
   ```bash
   cd agent
   python agent.py
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [Chart.js](https://www.chartjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [psutil](https://github.com/giampaolo/psutil)
