import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { gameApi } from '../services/apiService';

function ApiDebugger() {
  const [apiUrl, setApiUrl] = useState('');
  const [healthStatus, setHealthStatus] = useState({ loading: false, result: null });
  const [gamesStatus, setGamesStatus] = useState({ loading: false, result: null });
  const [customEndpoint, setCustomEndpoint] = useState('/health');
  const [customStatus, setCustomStatus] = useState({ loading: false, result: null });
  const [networkInfo, setNetworkInfo] = useState({});

  useEffect(() => {
    // Get the API URL from environment
    setApiUrl(process.env.REACT_APP_API_URL || 'Not set (using fallback)');
    
    // Get network information
    setNetworkInfo({
      online: navigator.onLine,
      userAgent: navigator.userAgent,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      pathname: window.location.pathname
    });
  }, []);

  const testHealthEndpoint = async () => {
    setHealthStatus({ loading: true, result: null });
    try {
      const response = await axios.get(`${apiUrl}/health`);
      setHealthStatus({
        loading: false,
        result: {
          success: true,
          status: response.status,
          data: response.data
        }
      });
    } catch (error) {
      console.error('Health API Error:', error);
      setHealthStatus({
        loading: false,
        result: {
          success: false,
          error: error.message,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data
          } : null
        }
      });
    }
  };

  const testGamesEndpoint = async () => {
    setGamesStatus({ loading: true, result: null });
    try {
      const response = await gameApi.getGames();
      setGamesStatus({
        loading: false,
        result: {
          success: true,
          data: response
        }
      });
    } catch (error) {
      console.error('Games API Error:', error);
      setGamesStatus({
        loading: false,
        result: {
          success: false,
          error: error.message,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data
          } : null
        }
      });
    }
  };

  const testCustomEndpoint = async () => {
    setCustomStatus({ loading: true, result: null });
    try {
      const endpoint = customEndpoint.startsWith('/') ? customEndpoint : `/${customEndpoint}`;
      const response = await axios.get(`${apiUrl}${endpoint}`);
      setCustomStatus({
        loading: false,
        result: {
          success: true,
          status: response.status,
          data: response.data
        }
      });
    } catch (error) {
      console.error('Custom API Error:', error);
      setCustomStatus({
        loading: false,
        result: {
          success: false,
          error: error.message,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data
          } : null
        }
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">API Connection Debugger</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Environment Configuration</h2>
        <div className="mb-4">
          <p className="font-medium">API URL configured in frontend:</p>
          <code className="bg-gray-100 p-2 rounded block mt-1">{apiUrl}</code>
        </div>
        
        <div className="mb-4">
          <p className="font-medium">Network Information:</p>
          <pre className="bg-gray-100 p-2 rounded block mt-1 overflow-auto">
            {JSON.stringify(networkInfo, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Health Endpoint</h2>
          <button
            onClick={testHealthEndpoint}
            disabled={healthStatus.loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            {healthStatus.loading ? 'Testing...' : 'Test /health Endpoint'}
          </button>
          
          {healthStatus.result && (
            <div className={`mt-4 p-4 rounded-md ${healthStatus.result.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-semibold">
                {healthStatus.result.success ? 'Connection Successful!' : 'Connection Failed'}
              </h3>
              <pre className="mt-2 bg-gray-100 p-2 rounded text-sm overflow-auto max-h-60">
                {JSON.stringify(healthStatus.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Games Endpoint</h2>
          <button
            onClick={testGamesEndpoint}
            disabled={gamesStatus.loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            {gamesStatus.loading ? 'Testing...' : 'Test /games Endpoint'}
          </button>
          
          {gamesStatus.result && (
            <div className={`mt-4 p-4 rounded-md ${gamesStatus.result.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-semibold">
                {gamesStatus.result.success ? 'Connection Successful!' : 'Connection Failed'}
              </h3>
              <pre className="mt-2 bg-gray-100 p-2 rounded text-sm overflow-auto max-h-60">
                {JSON.stringify(gamesStatus.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Test Custom Endpoint</h2>
        
        <div className="flex mb-4">
          <div className="mr-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endpoint:
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-gray-200 text-gray-600 border border-r-0 border-gray-300 rounded-l-md">
                {apiUrl}
              </span>
              <input
                type="text"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="/endpoint"
              />
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={testCustomEndpoint}
              disabled={customStatus.loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              {customStatus.loading ? 'Testing...' : 'Test Endpoint'}
            </button>
          </div>
        </div>
        
        {customStatus.result && (
          <div className={`mt-4 p-4 rounded-md ${customStatus.result.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className="font-semibold">
              {customStatus.result.success ? 'Connection Successful!' : 'Connection Failed'}
            </h3>
            <pre className="mt-2 bg-gray-100 p-2 rounded text-sm overflow-auto max-h-60">
              {JSON.stringify(customStatus.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApiDebugger; 