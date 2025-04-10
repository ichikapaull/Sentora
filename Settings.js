import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCog, FaBell, FaServer, FaEnvelope, FaDiscord, FaTelegram } from 'react-icons/fa';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Alert settings
  const [settings, setSettings] = useState({
    cpu_threshold: 80,
    ram_threshold: 85,
    disk_threshold: 90,
    service_alerts: true,
    ssh_brute_force_alerts: true,
    
    email_enabled: false,
    email_from: '',
    email_to: '',
    email_smtp_server: '',
    email_smtp_port: 587,
    email_username: '',
    email_password: '',
    
    telegram_enabled: false,
    telegram_bot_token: '',
    telegram_chat_id: '',
    
    discord_enabled: false,
    discord_webhook_url: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would fetch from a settings API endpoint
        // For now, we'll just simulate loading the default settings
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Please try again later.');
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? Number(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // In a real implementation, this would send to a settings API endpoint
      // For now, we'll just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Settings saved successfully');
      setSaving(false);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
              <p>{success}</p>
            </div>
          )}
          
          {/* Alert Thresholds */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaServer className="mr-2 text-primary-500" />
              Alert Thresholds
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="cpu_threshold" className="block text-sm font-medium text-gray-700 mb-1">
                  CPU Usage Threshold (%)
                </label>
                <input
                  type="number"
                  id="cpu_threshold"
                  name="cpu_threshold"
                  min="1"
                  max="100"
                  value={settings.cpu_threshold}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              
              <div>
                <label htmlFor="ram_threshold" className="block text-sm font-medium text-gray-700 mb-1">
                  RAM Usage Threshold (%)
                </label>
                <input
                  type="number"
                  id="ram_threshold"
                  name="ram_threshold"
                  min="1"
                  max="100"
                  value={settings.ram_threshold}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="disk_threshold" className="block text-sm font-medium text-gray-700 mb-1">
                Disk Usage Threshold (%)
              </label>
              <input
                type="number"
                id="disk_threshold"
                name="disk_threshold"
                min="1"
                max="100"
                value={settings.disk_threshold}
                onChange={handleChange}
                className="input"
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="service_alerts"
                  name="service_alerts"
                  checked={settings.service_alerts}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="service_alerts" className="ml-2 block text-sm text-gray-700">
                  Enable service status alerts
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ssh_brute_force_alerts"
                  name="ssh_brute_force_alerts"
                  checked={settings.ssh_brute_force_alerts}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="ssh_brute_force_alerts" className="ml-2 block text-sm text-gray-700">
                  Enable SSH brute force alerts
                </label>
              </div>
            </div>
          </div>
          
          {/* Email Notifications */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaEnvelope className="mr-2 text-primary-500" />
              Email Notifications
            </h2>
            
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="email_enabled"
                name="email_enabled"
                checked={settings.email_enabled}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="email_enabled" className="ml-2 block text-sm text-gray-700">
                Enable email notifications
              </label>
            </div>
            
            {settings.email_enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email_from" className="block text-sm font-medium text-gray-700 mb-1">
                      From Email
                    </label>
                    <input
                      type="email"
                      id="email_from"
                      name="email_from"
                      value={settings.email_from}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email_to" className="block text-sm font-medium text-gray-700 mb-1">
                      To Email
                    </label>
                    <input
                      type="email"
                      id="email_to"
                      name="email_to"
                      value={settings.email_to}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email_smtp_server" className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Server
                    </label>
                    <input
                      type="text"
                      id="email_smtp_server"
                      name="email_smtp_server"
                      value={settings.email_smtp_server}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email_smtp_port" className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      id="email_smtp_port"
                      name="email_smtp_port"
                      value={settings.email_smtp_port}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email_username" className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Username
                    </label>
                    <input
                      type="text"
                      id="email_username"
                      name="email_username"
                      value={settings.email_username}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email_password" className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Password
                    </label>
                    <input
                      type="password"
                      id="email_password"
                      name="email_password"
                      value={settings.email_password}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Telegram Notifications */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaTelegram className="mr-2 text-primary-500" />
              Telegram Notifications
            </h2>
            
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="telegram_enabled"
                name="telegram_enabled"
                checked={settings.telegram_enabled}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="telegram_enabled" className="ml-2 block text-sm text-gray-700">
                Enable Telegram notifications
              </label>
            </div>
            
            {settings.telegram_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="telegram_bot_token" className="block text-sm font-medium text-gray-700 mb-1">
                    Bot Token
                  </label>
                  <input
                    type="text"
                    id="telegram_bot_token"
                    name="telegram_bot_token"
                    value={settings.telegram_bot_token}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                
                <div>
                  <label htmlFor="telegram_chat_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Chat ID
                  </label>
                  <input
                    type="text"
                    id="telegram_chat_id"
                    name="telegram_chat_id"
                    value={settings.telegram_chat_id}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Discord Notifications */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaDiscord className="mr-2 text-primary-500" />
              Discord Notifications
            </h2>
            
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="discord_enabled"
                name="discord_enabled"
                checked={settings.discord_enabled}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="discord_enabled" className="ml-2 block text-sm text-gray-700">
                Enable Discord notifications
              </label>
            </div>
            
            {settings.discord_enabled && (
              <div>
                <label htmlFor="discord_webhook_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="text"
                  id="discord_webhook_url"
                  name="discord_webhook_url"
                  value={settings.discord_webhook_url}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Settings;
