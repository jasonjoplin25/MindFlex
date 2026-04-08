import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SoundTherapy = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [therapyCategories, setTherapyCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Simulate API call to fetch therapy categories
    const fetchTherapyData = async () => {
      try {
        // In a real implementation, this would be an API call
        // const response = await therapyApi.getCategories();
        
        // Hardcoded data for now
        const mockData = [
          {
            id: 'relaxation',
            name: 'Relaxation',
            description: 'Calming sounds to reduce stress and anxiety',
            icon: '🧘‍♀️',
            color: 'bg-blue-100'
          },
          {
            id: 'focus',
            name: 'Focus & Concentration',
            description: 'Sounds designed to enhance concentration and productivity',
            icon: '🎯',
            color: 'bg-purple-100'
          },
          {
            id: 'sleep',
            name: 'Sleep',
            description: 'Soothing sounds to help you fall asleep faster and sleep better',
            icon: '😴',
            color: 'bg-indigo-100'
          },
          {
            id: 'meditation',
            name: 'Meditation',
            description: 'Sounds to accompany and deepen your meditation practice',
            icon: '🧠',
            color: 'bg-green-100'
          },
          {
            id: 'nature',
            name: 'Nature Sounds',
            description: 'Immerse yourself in the calming sounds of nature',
            icon: '🌳',
            color: 'bg-emerald-100'
          },
          {
            id: 'binaural',
            name: 'Binaural Beats',
            description: 'Specialized audio tracks that may help with various cognitive states',
            icon: '🎵',
            color: 'bg-rose-100'
          }
        ];
        
        setTherapyCategories(mockData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching therapy data:', error);
        setLoading(false);
      }
    };

    fetchTherapyData();
  }, []);

  // Filter categories based on selection
  const filteredCategories = selectedCategory === 'all' 
    ? therapyCategories 
    : therapyCategories.filter(category => category.id === selectedCategory);

  // Hardcoded recommended tracks
  const recommendedTracks = [
    {
      id: 'deep-relaxation',
      title: 'Deep Relaxation',
      category: 'relaxation',
      duration: '20 min',
      imageUrl: '/images/relaxation.jpg',
      path: '/therapy/track/deep-relaxation'
    },
    {
      id: 'focus-flow',
      title: 'Focus Flow',
      category: 'focus',
      duration: '30 min',
      imageUrl: '/images/focus.jpg',
      path: '/therapy/track/focus-flow'
    },
    {
      id: 'sleep-waves',
      title: 'Sleep Waves',
      category: 'sleep',
      duration: '45 min',
      imageUrl: '/images/sleep.jpg',
      path: '/therapy/track/sleep-waves'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Sound Therapy</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Experience the healing power of sound. Our carefully crafted audio tracks can help reduce stress, 
            improve focus, enhance sleep quality, and support overall mental wellbeing.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            
            {therapyCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/therapy/category/${category.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className={`${category.color} p-6 flex items-center justify-center`}>
                    <span className="text-5xl">{category.icon}</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-gray-600 mb-4">{category.description}</p>
                    <div className="flex justify-end">
                      <span className="text-blue-600 font-medium">Explore tracks →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Recommended for You Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended for You</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendedTracks.map((track) => (
                  <Link
                    key={track.id}
                    to={track.path}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl">
                        {track.category === 'relaxation' ? '🧘‍♀️' : 
                         track.category === 'focus' ? '🎯' : '😴'}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900">{track.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">Duration: {track.duration}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600 font-medium">
                          {track.category.charAt(0).toUpperCase() + track.category.slice(1)}
                        </span>
                        <span className="text-blue-600">▶️</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-blue-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Benefits of Sound Therapy</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-3xl mb-4 text-center">😌</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Stress Reduction</h3>
                  <p className="text-gray-600 text-center">
                    Calming sounds can lower cortisol levels and reduce feelings of stress and anxiety.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-3xl mb-4 text-center">💤</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Improved Sleep</h3>
                  <p className="text-gray-600 text-center">
                    Soothing sounds can help you fall asleep faster and improve overall sleep quality.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-3xl mb-4 text-center">🧠</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Enhanced Focus</h3>
                  <p className="text-gray-600 text-center">
                    Certain sound frequencies can improve concentration and cognitive performance.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-3xl mb-4 text-center">🌊</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Emotional Balance</h3>
                  <p className="text-gray-600 text-center">
                    Regular sound therapy sessions can help regulate emotions and improve mood.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SoundTherapy; 