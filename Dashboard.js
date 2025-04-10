import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { FaServer, FaMemory, FaHdd, FaNetworkWired, FaExclamationTriangle } from 'react-icons/fa';

// Register Chart.js components
Chart.register(...registerables);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalServers: 0,
    activeServers: 0,
    totalAlerts: 0,
    criticalAlerts: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch agents
        const agentsResponse = await axios.get('/agents');
        setAgents(agentsResponse.data.agents || []);
        
        // Fetch recent alerts
        const alertsResponse = await axios.get('/alerts', { params: { hours: 24 } });
        const recentAlerts = alertsResponse.data.alerts || [];
        setAlerts(recentAlerts);
        
        // Calculate stats
        const activeServers = agentsResponse.data.agents.filter(
          agent => new Date(agent.last_seen) > new Date(Date.now() - 10 * 60 * 1000)
        ).length;
        
        const criticalAlerts = recentAlerts.filter(
          alert => ['CPU_HIGH', 'RAM_HIGH', 'DISK_HIGH', 'SERVICE_DOWN'].includes(alert.alert_type)
        ).length;
        
        setStats({
          totalServers: agentsResponse.data.agents.length,
          activeServers,
          totalAlerts: recentAlerts.length,
          criticalAlerts
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sample data for the chart
  const chartData = {
    labels: ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'],
    datasets: [
      {
        label: 'CPU Usage',
        data: [25, 30, 45, 60, 75, 65, 55, 40],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.4,
      },
      {
        label: 'RAM Usage',
        data: [40, 45, 50, 55, 60, 65, 60, 55],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'System Resource Usage (24h)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Usage %'
        }
      }
    }
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <FaServer className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Servers</p>
                <p className="text-2xl font-bold">{stats.totalServers}</p>
              </div>
            </div>
            
            <div className="card flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <FaNetworkWired className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Servers</p>
                <p className="text-2xl font-bold">{stats.activeServers}</p>
              </div>
            </div>
            
            <div className="card flex items-center">
              <div className="rounded-full bg-yellow-100 p-3 mr-4">
                <FaBell className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Alerts (24h)</p>
                <p className="text-2xl font-bold">{stats.totalAlerts}</p>
              </div>
            </div>
            
            <div className="card flex items-center">
              <div className="rounded-full bg-red-100 p-3 mr-4">
                <FaExclamationTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Critical Alerts</p>
                <p className="text-2xl font-bold">{stats.criticalAlerts}</p>
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">System Overview</h2>
            <Line data={chartData} options={chartOptions} />
          </div>
          
          {/* Recent Alerts */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Recent Alerts</h2>
            {alerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Server
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {alerts.slice(0, 5).map((alert, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            alert.alert_type.includes('HIGH') || alert.alert_type === 'SERVICE_DOWN'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {alert.alert_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {alert.hostname}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {alert.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No recent alerts</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
