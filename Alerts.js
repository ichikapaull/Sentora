import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBell, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const Alerts = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(24);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/alerts', {
          params: { hours: timeRange }
        });
        setAlerts(response.data.alerts || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError('Failed to load alerts. Please try again later.');
        setLoading(false);
      }
    };

    fetchAlerts();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const handleAcknowledge = async (alertId) => {
    try {
      await axios.post(`/alerts/${alertId}/acknowledge`);
      // Update the local state to reflect the change
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      setError('Failed to acknowledge alert. Please try again.');
    }
  };

  // Helper function to get alert type styling
  const getAlertTypeStyle = (alertType) => {
    switch (alertType) {
      case 'CPU_HIGH':
        return 'bg-red-100 text-red-800';
      case 'RAM_HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'DISK_HIGH':
        return 'bg-yellow-100 text-yellow-800';
      case 'SERVICE_DOWN':
        return 'bg-purple-100 text-purple-800';
      case 'SSH_BRUTE_FORCE':
        return 'bg-red-100 text-red-800';
      case 'AGENT_INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Alerts</h1>
      
      {/* Time range selector */}
      <div className="mb-6">
        <label htmlFor="time-range" className="block text-sm font-medium text-gray-700 mb-2">
          Time Range
        </label>
        <select
          id="time-range"
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="input"
        >
          <option value={6}>Last 6 hours</option>
          <option value={12}>Last 12 hours</option>
          <option value={24}>Last 24 hours</option>
          <option value={48}>Last 48 hours</option>
          <option value={72}>Last 3 days</option>
          <option value={168}>Last 7 days</option>
        </select>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading alerts...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {alerts.length > 0 ? (
            <div className="card">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {alerts.map((alert) => (
                      <tr key={alert.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAlertTypeStyle(alert.alert_type)}`}>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            alert.acknowledged ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {alert.acknowledged ? 'Acknowledged' : 'Unacknowledged'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!alert.acknowledged && (
                            <button
                              onClick={() => handleAcknowledge(alert.id)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Acknowledge
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md p-6">
              <FaBell className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-gray-700 mb-2">No alerts found</p>
              <p className="text-gray-500 text-sm text-center">
                All systems are running normally within the selected time range.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Alerts;
