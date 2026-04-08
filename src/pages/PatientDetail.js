import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PatientDetail = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // In a real implementation, this would be an API call
        // const response = await caregiverApi.getPatientById(patientId);
        
        // Hardcoded data for now
        const mockPatient = {
          id: patientId,
          firstName: 'John',
          lastName: 'Smith',
          age: 72,
          email: 'john.smith@example.com',
          phone: '+1 (555) 123-4567',
          condition: 'Mild Cognitive Impairment',
          notes: 'Patient has been showing steady improvement in memory tasks. Recommended daily cognitive exercises.',
          joinDate: '2023-01-15',
          lastActive: '2023-06-15T14:30:00',
          status: 'active',
          emergencyContact: {
            name: 'Mary Smith',
            relation: 'Daughter',
            phone: '+1 (555) 987-6543'
          },
          cognitiveScores: {
            memory: 75,
            attention: 82,
            processing: 68,
            language: 90,
            overall: 79
          },
          weeklyProgress: [
            { week: 'Week 1', score: 65 },
            { week: 'Week 2', score: 68 },
            { week: 'Week 3', score: 72 },
            { week: 'Week 4', score: 75 },
            { week: 'Week 5', score: 79 }
          ],
          recentGames: [
            { id: 1, name: 'Memory Match', date: '2023-06-15', score: 120, difficulty: 'Medium' },
            { id: 2, name: 'Word Scramble', date: '2023-06-14', score: 85, difficulty: 'Easy' },
            { id: 3, name: 'Pattern Match', date: '2023-06-13', score: 95, difficulty: 'Medium' },
            { id: 4, name: 'Reaction Time', date: '2023-06-12', score: 110, difficulty: 'Hard' }
          ],
          therapySessions: [
            { id: 1, name: 'Relaxation', date: '2023-06-15', duration: '15 min', category: 'Stress Relief' },
            { id: 2, name: 'Focus Flow', date: '2023-06-13', duration: '20 min', category: 'Concentration' },
            { id: 3, name: 'Sleep Aid', date: '2023-06-11', duration: '30 min', category: 'Sleep' }
          ],
          recommendations: [
            'Increase frequency of memory games',
            'Continue with daily relaxation sessions',
            'Try more challenging difficulty levels in Pattern Match',
            'Schedule regular cognitive assessments'
          ]
        };

        setPatient(mockPatient);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching patient data:', error);
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Patient not found. <Link to="/caregiver" className="underline">Return to Dashboard</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/caregiver" className="text-blue-600 hover:text-blue-800">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Patient Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl mr-4">
                  {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
                  <div className="mt-1 flex flex-wrap gap-4 text-gray-600">
                    <span>Age: {patient.age}</span>
                    <span>•</span>
                    <span>ID: {patient.id}</span>
                    <span>•</span>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      patient.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex gap-3">
              <button 
                onClick={() => navigate(`/caregiver/patient/${patient.id}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
              <button 
                onClick={() => navigate(`/caregiver/patient/${patient.id}/message`)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          <div className="p-6">
            <div className="text-sm font-medium text-gray-500">Overall Score</div>
            <div className="mt-2 flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{patient.cognitiveScores.overall}</div>
              <div className="ml-2 text-sm font-medium text-green-600">+14</div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="text-sm font-medium text-gray-500">Games Completed</div>
            <div className="mt-2 flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{patient.recentGames.length}</div>
              <div className="ml-2 text-sm font-medium text-gray-600">this week</div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="text-sm font-medium text-gray-500">Therapy Minutes</div>
            <div className="mt-2 flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">65</div>
              <div className="ml-2 text-sm font-medium text-gray-600">this week</div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="text-sm font-medium text-gray-500">Last Active</div>
            <div className="mt-2 flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">Today</div>
              <div className="ml-2 text-sm font-medium text-gray-600">2:30 PM</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-4" aria-label="Tabs">
          {['overview', 'games', 'therapy', 'notes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 font-medium text-sm rounded-md ${
                activeTab === tab
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'overview' && (
            <>
              {/* Cognitive Scores */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Cognitive Assessment</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(patient.cognitiveScores).map(([area, score]) => (
                    area !== 'overall' && (
                      <div key={area} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium text-gray-700 capitalize">{area}</h3>
                          <span className="text-sm font-medium text-blue-600">{score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              score >= 80 ? 'bg-green-600' :
                              score >= 60 ? 'bg-blue-600' :
                              'bg-yellow-600'
                            }`}
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Progress Chart */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Weekly Progress</h2>
                </div>
                <div className="p-6">
                  <div className="h-64 flex items-end justify-between space-x-2">
                    {patient.weeklyProgress.map((week) => (
                      <div key={week.week} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-blue-500 rounded-t"
                          style={{ height: `${week.score}%` }}
                        ></div>
                        <div className="text-xs text-gray-500 mt-2">{week.week}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'games' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Game History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Game
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patient.recentGames.map((game) => (
                      <tr key={game.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{game.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(game.date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            game.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                            game.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {game.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {game.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'therapy' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Therapy Sessions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patient.therapySessions.map((session) => (
                      <tr key={session.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{session.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{session.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(session.date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.duration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Clinical Notes</h2>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Condition</h3>
                  <p className="text-gray-700">{patient.condition}</p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-700">{patient.notes}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Recommendations</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {patient.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-gray-700">{recommendation}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-8">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Contact Information</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Email</div>
                  <div className="mt-1 text-sm text-gray-900">{patient.email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Phone</div>
                  <div className="mt-1 text-sm text-gray-900">{patient.phone}</div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-500">Emergency Contact</div>
                  <div className="mt-1 text-sm text-gray-900">{patient.emergencyContact.name}</div>
                  <div className="mt-1 text-sm text-gray-600">{patient.emergencyContact.relation}</div>
                  <div className="mt-1 text-sm text-gray-900">{patient.emergencyContact.phone}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Schedule Assessment
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                  Add Progress Note
                </button>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                  View Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail; 