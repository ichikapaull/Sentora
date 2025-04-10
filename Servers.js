import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaServer, FaCircle, FaExclamationTriangle } from 'react-icons/fa';

const Servers = () => {
  const [loading, setLoading] = useState(true);
  const [servers, setServers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/agents');
        setServers(response.data.agents || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching servers:', err);
        setError('Failed to load servers. Please try again later.');
        setLoading(false);
      }
    };

    fetchServers();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchServers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to determine server status
  const getServerStatus = (server) => {
    const lastSeen = new Date(server.last_seen);
    const now = new Date();
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    
    if (diffMinutes < 5) return { status: 'online', color: 'text-green-500' };
    if (diffMinutes < 15) return { status: 'warning', color: 'text-yellow-500' };
    return { status: 'offline', color: 'text-red-500' };
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Servers</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading servers...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.length > 0 ? (
            servers.map((server) => {
              const { status, color } = getServerStatus(server);
              return (
                <Link 
                  key={server.name} 
                  to={`/servers/${server.name}`}
                  className="card hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-center mb-4">
                    <div className="rounded-full bg-blue-100 p-3 mr-4">
                      <FaServer className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{server.name}</h3>
                      <p className="text-sm text-gray-500">{server.hostname}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <FaCircle className={`h-3 w-3 ${color} mr-2`} />
                      <span className="text-sm capitalize">{status}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Last seen: {new Date(server.last_seen).toLocaleString()}
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md p-6">
              <FaExclamationTriangle className="h-12 w-12 text-yellow-500 mb-4" />
              <p className="text-gray-700 mb-2">No servers found</p>
              <p className="text-gray-500 text-sm text-center">
                Make sure your monitoring agents are running and properly configured.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Servers;
