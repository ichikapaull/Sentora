#!/usr/bin/env python3
"""
Sentora Monitoring Agent - Test Script
-------------------------------------
Tests the monitoring agent functionality without sending data to the server.
"""

import json
import os
import sys
from agent import SentoraAgent

def main():
    """Test the monitoring agent functionality."""
    print("Sentora Monitoring Agent - Test Mode")
    print("====================================")
    
    # Get the config path
    if len(sys.argv) > 1:
        config_path = sys.argv[1]
    else:
        # Default config path
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.yaml')
    
    print(f"Using configuration file: {config_path}")
    
    # Initialize the agent
    agent = SentoraAgent(config_path)
    
    # Collect metrics
    print("\nCollecting system metrics...")
    metrics = agent.collect_metrics()
    
    # Print metrics in a formatted way
    print("\nSystem Metrics:")
    print("==============")
    
    if metrics['cpu_usage'] is not None:
        print(f"CPU Usage: {metrics['cpu_usage']}%")
    
    if metrics['ram_usage'] is not None:
        print(f"RAM Usage: {metrics['ram_usage']}%")
    
    if metrics['disk_usage'] is not None:
        print("Disk Usage:")
        for path, usage in metrics['disk_usage'].items():
            print(f"  {path}: {usage}%")
    
    if metrics['network'] is not None:
        print("Network Traffic:")
        for interface, stats in metrics['network'].items():
            print(f"  {interface}: {stats['in']:.2f} KB/s in, {stats['out']:.2f} KB/s out")
    
    if metrics['services'] is not None:
        print("Service Status:")
        for service, status in metrics['services'].items():
            print(f"  {service}: {status}")
    
    if metrics['ssh_brute_force'] is not None:
        print("SSH Brute Force Detection:")
        print(f"  Failed attempts: {metrics['ssh_brute_force']['failed_attempts']}")
        print(f"  Threshold exceeded: {metrics['ssh_brute_force']['threshold_exceeded']}")
    
    print(f"\nTimestamp: {metrics['timestamp']}")
    print(f"Agent Name: {metrics['agent_name']}")
    print(f"Hostname: {metrics['hostname']}")
    
    # Save metrics to a JSON file for inspection
    output_file = "test_metrics.json"
    with open(output_file, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"\nMetrics saved to {output_file}")
    print("\nTest completed successfully")

if __name__ == "__main__":
    main()
