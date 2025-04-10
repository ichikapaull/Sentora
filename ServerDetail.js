import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { FaServer, FaMemory, FaHdd, FaNetworkWired, FaArrowLeft, FaCircle } from 'react-icons/fa';

// Register Chart.js components
Chart.register(...registerables);

const ServerDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [server, setServer] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServerDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch server info
        const agentsResponse = await axios.get('/agents');
        const serverData = agentsResponse.data.agents.find(agent => agent.name === id);
        
        if (!serverData) {
          setError('Server not found');
          setLoading(false);
          return;
        }
        
        setServer(serverData);
        
        // Fetch historical metrics
        const historyResponse = await axios.get(`/history/${id}`, {
          params: { hours: 24 }
        });
        
        setMetrics(historyResponse.data.metrics || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching server details:', err);
        setError('Failed to load server details. Please try again later.');
        setLoading(false);
      }
    };

    fetchServerDetails();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchServerDetails, 30000);
    return () => clearInterval(interval);
  }, [id]);

  // Helper function to determine server status
  const getServerStatus = (server) => {
    const lastSeen = new Date(server.last_seen);
    const now = new Date();
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    
    if (diffMinutes < 5) return { status: 'online', color: 'text-green-500' };
    if (diffMinutes < 15) return { status: 'warning', color: 'text-yellow-500' };
    return { status: 'offline', color: 'text-red-500' };
  };

  // Prepare chart data
  const prepareChartData = (metricName) => {
    if (!metrics || metrics.length === 0) return null;
    
    const sortedMetrics = [...metrics].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    const labels = sortedMetrics.map(m => 
      new Date(m.timestamp).toLocaleTimeString()
    );
    
    let data;
    
    switch (metricName) {
      case 'cpu':
        data = sortedMetrics.map(m => m.cpu_usage);
        break;
      case 'ram':
        data = sortedMetrics.map(m => m.ram_usage);
        break;
      case 'disk':
        // Just get the first disk path for simplicity
        const diskPath = sortedMetrics[0].disk_usage ? Object.keys(sortedMetrics[0].disk_usage)[0] : null;
        data = diskPath ? sortedMetrics.map(m => m.disk_usage?.[diskPath] || 0) : [];
        break;
      default:
        data = [];
    }
    
    return {
      labels,
      datasets: [
        {
          label: `${metricName.toUpperCase()} Usage`,
          data,
          borderColor: metricName === 'cpu' ? 'rgb(255, 99, 132)' : 
                       metricName === 'ram' ? 'rgb(54, 162, 235)' : 
                       'rgb(75, 192, 192)',
          backgroundColor: metricName === 'cpu' ? 'rgba(255, 99, 132, 0.5)' : 
                           metricName === 'ram' ? 'rgba(54, 162, 235, 0.5)' : 
                           'rgba(75, 192, 192, 0.5)',
          tension: 0.4,
        }
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
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

  // Get the latest metrics
  const getLatestMetrics = () => {
    if (!metrics || metrics.length === 0) return null;
    
    // Sort by timestamp descending and get the first one
    return [...metrics].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
  };

  const latestMetrics = getLatestMetrics();

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Link to="/servers" className="flex items-center text-primary-600 hover:text-primary-800">
          <FaArrowLeft className="mr-2" />
          Back to Servers
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading server details...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      ) : server ? (
        <>
          {/* Server Header */}
          <div className="card mb-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-4 mr-6">
                <FaServer className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{server.name}</h1>
                <p className="text-gray-500">{server.hostname}</p>
                <div className="flex items-center mt-2">
                  {server && (
                    <>
                      <FaCircle className={`h-3 w-3 ${getServerStatus(server).color} mr-2`} />
                      <span className="text-sm capitalize">{getServerStatus(server).status}</span>
                      <span className="text-sm text-gray-500 ml-4">
                        Last seen: {new Date(server.last_seen).toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Current Metrics */}
          {latestMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card flex items-center">
                <div className="rounded-full bg-red-100 p-3 mr-4">
                  <FaServer className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">CPU Usage</p>
                  <p className="text-2xl font-bold">{latestMetrics.cpu_usage?.toFixed(1) || 'N/A'}%</p>
                </div>
              </div>
              
              <div className="card flex items-center">
                <div className="rounded-full bg-blue-100 p-3 mr-4">
                  <FaMemory className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">RAM Usage</p>
                  <p className="text-2xl font-bold">{latestMetrics.ram_usage?.toFixed(1) || 'N/A'}%</p>
                </div>
              </div>
              
              <div className="card flex items-center">
                <div className="rounded-full bg-teal-100 p-3 mr-4">
                  <FaHdd className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Disk Usage</p>
                  <p className="text-2xl font-bold">
                    {latestMetrics.disk_usage && Object.keys(latestMetrics.disk_usage).length > 0
                      ? `${latestMetrics.disk_usage[Object.keys(latestMetrics.disk_usage)[0]].toFixed(1)}%`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">CPU Usage History</h2>
              {prepareChartData('cpu') ? (
                <Line data={prepareChartData('cpu')} options={chartOptions} />
              ) : (
                <p className="text-gray-500">No CPU data available</p>
              )}
            </div>
            
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">RAM Usage History</h2>
              {prepareChartData('ram') ? (
                <Line data={prepareChartData('ram')} options={chartOptions} />
              ) : (
                <p className="text-gray-500">No RAM data available</p>
              )}
            </div>
          </div>
          
          {/* Services Status */}
          {latestMetrics && latestMetrics.services && (
            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-4">Services Status</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(latestMetrics.services).map(([service, status]) => (
                      <tr key={service}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {service}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p>Server not found</p>
        </div>
      )}
    </div>
  );
};

export default ServerDetail;
