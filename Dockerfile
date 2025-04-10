FROM python:3.10-slim

WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY agent/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code
COPY agent/agent.py .
COPY agent/config.yaml .

# Create directory for logs
RUN mkdir -p /var/log/sentora

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run the agent
CMD ["python", "agent.py"]
