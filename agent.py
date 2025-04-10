#!/usr/bin/env python3
"""
Sentora Monitoring Agent
------------------------
Collects system metrics and sends them to the central server.
"""

import os
import sys
import time
import json
import logging
import socket
import datetime
import subprocess
import re
import requests
import yaml
import psutil
from pathlib import Path

class SentoraAgent:
    def __init__(self, config_path):
        """Initialize the Sentora monitoring agent with the given configuration."""
        self.config = self._load_config(config_path)
        self._setup_logging()
        self.logger.info(f"Sentora Agent '{self.config['agent']['name']}' initialized")

    def _load_config(self, config_path):
        """Load configuration from YAML file."""
        try:
            with open(config_path, 'r') as file:
                return yaml.safe_load(file)
        except Exception as e:
            print(f"Error loading configuration: {e}")
            sys.exit(1)

    def _setup_logging(self):
        """Set up logging based on configuration."""
        log_level = getattr(logging, self.config['logging']['level'])
        log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        
        # Create logger
        self.logger = logging.getLogger('sentora-agent')
        self.logger.setLevel(log_level)
        
        # Create console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(log_level)
        console_handler.setFormatter(logging.Formatter(log_format))
        self.logger.addHandler(console_handler)
        
        # Create file handler if specified
        if 'file' in self.config['logging']:
            try:
                file_handler = logging.FileHandler(self.config['logging']['file'])
                file_handler.setLevel(log_level)
                file_handler.setFormatter(logging.Formatter(log_format))
                self.logger.addHandler(file_handler)
            except Exception as e:
                self.logger.warning(f"Could not set up file logging: {e}")

    def get_cpu_usage(self):
        """Get CPU usage percentage."""
        if not self.config['monitoring']['cpu']['enabled']:
            return None
        
        try:
            return psutil.cpu_percent(interval=1)
        except Exception as e:
            self.logger.error(f"Error getting CPU usage: {e}")
            return None

    def get_ram_usage(self):
        """Get RAM usage percentage."""
        if not self.config['monitoring']['ram']['enabled']:
            return None
        
        try:
            memory = psutil.virtual_memory()
            return memory.percent
        except Exception as e:
            self.logger.error(f"Error getting RAM usage: {e}")
            return None

    def get_disk_usage(self):
        """Get disk usage for configured paths."""
        if not self.config['monitoring']['disk']['enabled']:
            return None
        
        disk_usage = {}
        try:
            for path in self.config['monitoring']['disk']['paths']:
                usage = psutil.disk_usage(path)
                disk_usage[path] = usage.percent
            return disk_usage
        except Exception as e:
            self.logger.error(f"Error getting disk usage: {e}")
            return None

    def get_network_traffic(self):
        """Get network traffic statistics."""
        if not self.config['monitoring']['network']['enabled']:
            return None
        
        try:
            network_stats = {}
            net_io = psutil.net_io_counters(pernic=True)
            
            for interface in self.config['monitoring']['network']['interfaces']:
                if interface in net_io:
                    # Store initial values
                    initial_stats = net_io[interface]
                    initial_in = initial_stats.bytes_recv
                    initial_out = initial_stats.bytes_sent
                    
                    # Wait for a short interval to calculate rate
                    time.sleep(1)
                    
                    # Get updated values
                    updated_stats = psutil.net_io_counters(pernic=True)[interface]
                    bytes_in = updated_stats.bytes_recv - initial_in
                    bytes_out = updated_stats.bytes_sent - initial_out
                    
                    # Convert to KB/s
                    network_stats[interface] = {
                        "in": bytes_in / 1024,
                        "out": bytes_out / 1024
                    }
            
            return network_stats
        except Exception as e:
            self.logger.error(f"Error getting network traffic: {e}")
            return None

    def get_service_status(self):
        """Check status of configured services."""
        if not self.config['monitoring']['services']['enabled']:
            return None
        
        service_status = {}
        try:
            for service in self.config['monitoring']['services']['list']:
                try:
                    # Use systemctl to check service status
                    result = subprocess.run(
                        ['systemctl', 'is-active', service],
                        capture_output=True,
                        text=True,
                        check=False
                    )
                    status = result.stdout.strip()
                    service_status[service] = status
                except Exception as e:
                    self.logger.error(f"Error checking service {service}: {e}")
                    service_status[service] = "unknown"
            
            return service_status
        except Exception as e:
            self.logger.error(f"Error getting service status: {e}")
            return None

    def check_ssh_brute_force(self):
        """Check for SSH brute force attempts."""
        if not self.config['monitoring']['ssh']['enabled']:
            return None
        
        try:
            log_path = self.config['monitoring']['ssh']['log_path']
            if not os.path.exists(log_path):
                self.logger.warning(f"SSH log file not found: {log_path}")
                return None
            
            # Get the last 100 lines of the log file
            result = subprocess.run(
                ['tail', '-n', '100', log_path],
                capture_output=True,
                text=True,
                check=False
            )
            
            log_content = result.stdout
            
            # Count failed login attempts
            failed_attempts = len(re.findall(r'Failed password for', log_content))
            
            return {
                "failed_attempts": failed_attempts,
                "threshold_exceeded": failed_attempts >= self.config['monitoring']['ssh']['threshold']
            }
        except Exception as e:
            self.logger.error(f"Error checking SSH brute force attempts: {e}")
            return None

    def collect_metrics(self):
        """Collect all system metrics based on configuration."""
        self.logger.info("Collecting system metrics...")
        
        metrics = {
            "cpu_usage": self.get_cpu_usage(),
            "ram_usage": self.get_ram_usage(),
            "disk_usage": self.get_disk_usage(),
            "network": self.get_network_traffic(),
            "services": self.get_service_status(),
            "ssh_brute_force": self.check_ssh_brute_force(),
            "timestamp": datetime.datetime.now().isoformat(),
            "agent_name": self.config['agent']['name'],
            "hostname": socket.gethostname()
        }
        
        self.logger.debug(f"Collected metrics: {json.dumps(metrics, indent=2)}")
        return metrics

    def send_metrics(self, metrics):
        """Send metrics to the central server."""
        server_url = self.config['server']['url']
        api_key = self.config['server']['api_key']
        
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }
        
        try:
            response = requests.post(server_url, json=metrics, headers=headers)
            if response.status_code == 200:
                self.logger.info("Metrics sent successfully")
                return True
            else:
                self.logger.error(f"Failed to send metrics: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.logger.error(f"Error sending metrics: {e}")
            return False

    def run(self):
        """Run the monitoring agent in a loop."""
        self.logger.info("Starting Sentora monitoring agent...")
        
        interval = self.config['agent']['interval']
        
        try:
            while True:
                metrics = self.collect_metrics()
                self.send_metrics(metrics)
                self.logger.info(f"Sleeping for {interval} seconds...")
                time.sleep(interval)
        except KeyboardInterrupt:
            self.logger.info("Monitoring agent stopped by user")
        except Exception as e:
            self.logger.error(f"Unexpected error: {e}")
            return 1
        
        return 0

def main():
    """Main entry point for the Sentora monitoring agent."""
    if len(sys.argv) > 1:
        config_path = sys.argv[1]
    else:
        # Default config path
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.yaml')
    
    agent = SentoraAgent(config_path)
    return agent.run()

if __name__ == "__main__":
    sys.exit(main())
