import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  // Placeholder user data
  const userData = {
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    role: 'Patient',
    joinDate: '2023-01-10',
    totalGamesPlayed: 42,
    averageScore: 85,
    favoriteGame: 'Memory Match',
    therapyMinutes: 320,
    cognitiveScores: {
      memory: 75,
      attention: 82,
      processing: 68,
      language: 90
    },
    recentActivity: [
      { type: 'game', name: 'Memory Match', date: '2023-06-10', score: 120 },
      { type: 'therapy', name: 'Relaxation', date: '2023-06-09', duration: '15 min' },
      { type: 'game', name: 'Word Scramble', date: '2023-06-08', score: 85 },
      { type: 'game', name: 'Pattern Match', date: '2023-06-07', score: 95 }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👤</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">{userData.name}</h1>
              <p className="text-gray-600">{userData.role}</p>
              <p className="text-gray-500 text-sm mt-1">Member since {new Date(userData.joinDate).toLocaleDateString()}</p>
            </div>
            
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Email</span>
                <span className="text-gray-800">{userData.email}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Games Played</span>
                <span className="text-gray-800">{userData.totalGamesPlayed}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Average Score</span>
                <span className="text-gray-800">{userData.averageScore}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Favorite Game</span>
                <span className="text-gray-800">{userData.favoriteGame}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Therapy Minutes</span>
                <span className="text-gray-800">{userData.therapyMinutes}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Cognitive Progress</h2>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(userData.cognitiveScores).map(([area, score]) => (
                <div key={area}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">{area}</span>
                    <span className="text-sm font-medium text-blue-600">{score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Account Settings</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Edit Profile
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={userData.name}
                    disabled
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={userData.email}
                    disabled
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    id="password"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value="********"
                    disabled
                  />
                </div>
              </form>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {userData.recentActivity.map((activity, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-full mr-4 ${
                      activity.type === 'game' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      <span className={`text-xl ${
                        activity.type === 'game' ? 'text-blue-600' : 'text-purple-600'
                      }`}>
                        {activity.type === 'game' ? '🎮' : '🎵'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{activity.name}</p>
                      {activity.type === 'game' ? (
                        <p className="text-sm text-gray-600">Score: {activity.score}</p>
                      ) : (
                        <p className="text-sm text-gray-600">Duration: {activity.duration}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 