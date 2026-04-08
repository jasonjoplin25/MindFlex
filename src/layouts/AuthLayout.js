import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="py-6">
        <div className="container mx-auto px-4">
          <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center">
            <span className="mr-2">🧠</span>
            MindFlex
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} MindFlex. All rights reserved.
            </p>
            <div className="mt-2 flex justify-center space-x-4">
              <a href="#" className="text-gray-600 hover:text-blue-600 text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 text-sm">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout; 