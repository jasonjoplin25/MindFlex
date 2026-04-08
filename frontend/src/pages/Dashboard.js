import React, { useState } from 'react';
import { gameApi } from '../services/apiService';

function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const testApiConnection = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const gamesData = await gameApi.getGames();
      console.log('API Response:', gamesData);
      setTestResult({
        success: true,
        data: gamesData
      });
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'Failed to connect to API');
      setTestResult({
        success: false,
        error: err.message || 'Failed to connect to API'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">API Connection Test</h2>
        <button
          onClick={testApiConnection}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          {loading ? 'Testing...' : 'Test API Connection'}
        </button>
        
        {testResult && (
          <div className={`mt-4 p-4 rounded-md ${testResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <h3 className="font-semibold">
              {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
            </h3>
            {testResult.success ? (
              <div className="mt-2">
                <p>Received {testResult.data.games?.length || 0} games from the API.</p>
                <pre className="mt-2 bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-red-700">{testResult.error}</p>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-600">No recent activity to display.</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recommended Games</h2>
          <p className="text-gray-600">No recommended games available.</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Sound Therapy</h2>
          <p className="text-gray-600">No recommended sound therapy available.</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 