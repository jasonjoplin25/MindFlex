import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/">
          <h1 className="text-center text-4xl font-bold text-primary-600">MindFlex</h1>
        </Link>
        <h2 className="mt-3 text-center text-xl text-neutral-600">
          Cognitive training and sound therapy
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-card sm:rounded-xl sm:px-10">
          <Outlet />
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            &copy; {new Date().getFullYear()} MindFlex. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout; 