import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome to MindFlex</h1>
        <p className="text-gray-600 mt-2">Your personal cognitive training platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <Link 
          to="/games"
          className="bg-blue-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold text-blue-800 mb-2">Cognitive Games</h2>
          <p className="text-gray-700 mb-4">Improve your memory, attention, and problem-solving skills with our interactive games.</p>
          <div className="flex justify-end">
            <span className="text-blue-600 font-medium">Explore Games →</span>
          </div>
        </Link>

        <Link 
          to="/therapy"
          className="bg-purple-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold text-purple-800 mb-2">Sound Therapy</h2>
          <p className="text-gray-700 mb-4">Relax and focus with our curated collection of therapeutic sounds and music.</p>
          <div className="flex justify-end">
            <span className="text-purple-600 font-medium">Explore Therapy →</span>
          </div>
        </Link>

        <Link 
          to="/profile"
          className="bg-green-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold text-green-800 mb-2">Your Progress</h2>
          <p className="text-gray-700 mb-4">Track your cognitive improvement and view your activity history.</p>
          <div className="flex justify-end">
            <span className="text-green-600 font-medium">View Progress →</span>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-gray-50 rounded-md">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <span className="text-blue-600 text-xl">🎮</span>
            </div>
            <div>
              <p className="font-medium">Memory Match Game</p>
              <p className="text-sm text-gray-600">Score: 120 points</p>
            </div>
            <div className="ml-auto text-sm text-gray-500">
              Today
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-md">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <span className="text-purple-600 text-xl">🎵</span>
            </div>
            <div>
              <p className="font-medium">Relaxation Session</p>
              <p className="text-sm text-gray-600">Duration: 15 minutes</p>
            </div>
            <div className="ml-auto text-sm text-gray-500">
              Yesterday
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">Daily Tip</h2>
        <p className="text-gray-700">Regular cognitive training can help maintain and improve brain function. Try to complete at least one game each day!</p>
      </div>
    </div>
  );
};

export default Dashboard; 