import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function MainLayout() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">MindFlex</Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-gray-700">Hello, {user.name}</span>
              </div>
            ) : (
              <span className="text-gray-700">Not logged in</span>
            )}
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="py-6">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-white shadow-md mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} MindFlex. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout; 