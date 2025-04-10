# Sentora - Linux Server Monitoring and Auto Alert System

## Todo List

### Environment Setup
- [x] Create project directory structure
- [x] Set up Python virtual environment
- [x] Install required Python packages
- [x] Set up MongoDB (via Docker)
- [x] Set up Redis for Celery (via Docker)

### Monitoring Agent (Client-Side)
- [x] Create agent configuration with YAML
- [x] Implement CPU usage monitoring
- [x] Implement RAM usage monitoring
- [x] Implement disk usage monitoring
- [x] Implement network traffic monitoring
- [x] Implement service status checking
- [x] Implement SSH brute force detection
- [x] Create JSON output format
- [x] Implement API communication with central server

### Central Server (Backend)
- [x] Set up FastAPI/Flask framework
- [x] Implement MongoDB connection
- [x] Create data ingestion API endpoint
- [x] Implement data storage logic
- [x] Set up Celery with Redis for periodic checks
- [x] Implement threshold checking logic
- [x] Create history API endpoint

### Alert System
- [x] Implement email alert functionality
- [x] Implement Telegram Bot integration
- [x] Implement Discord Webhook integration
- [x] Create alert configuration system

### Web Dashboard (Optional)
- [x] Set up basic React/Next.js project
- [x] Implement authentication (JWT)
- [x] Create real-time dashboard with graphs
- [x] Implement alert logs view
- [x] Create service status display

### Docker Containerization
- [x] Create Dockerfile for monitoring agent
- [x] Create Dockerfile for central server
- [x] Create Dockerfile for web dashboard
- [x] Create docker-compose.yml for easy deployment
- [x] Add .env.example files for configuration

### Documentation
- [x] Create comprehensive README.md
- [x] Document API endpoints
- [x] Document setup instructions
- [x] Document alert configuration
- [x] Add deployment guide

### Testing
- [ ] Test monitoring agent on multiple servers
- [ ] Test central server with multiple agents
- [ ] Test alert system functionality
- [ ] Verify dashboard functionality
- [ ] Test complete system integration
