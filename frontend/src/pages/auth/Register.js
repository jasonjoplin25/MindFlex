import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'patient', // Default to patient
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      throw new Error('Name is required');
    }
    if (!formData.email.trim()) {
      throw new Error('Email is required');
    }
    if (!formData.password) {
      throw new Error('Password is required');
    }
    if (formData.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (formData.password !== formData.confirmPassword) {
      throw new Error('Passwords do not match');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      validateForm();

      const userData = {
        first_name: formData.name.split(' ')[0] || formData.name,
        last_name: formData.name.split(' ').slice(1).join(' ') || '',
        user_type: formData.userType
      };

      const result = await signUp(
        formData.email,
        formData.password,
        userData
      );

      if (result.error) {
        throw new Error(result.error.error || result.error.message || result.error);
      }

      // Redirect to dashboard on successful registration
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-center text-2xl font-bold text-neutral-900 mb-6">
        Create your account
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-error-50 text-error-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
            Full name
          </label>
          <div className="mt-1">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter your full name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="Create a password"
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Password must be at least 8 characters long
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
            Confirm password
          </label>
          <div className="mt-1">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field"
              placeholder="Confirm your password"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">I am a:</label>
          <div className="mt-2 flex space-x-4">
            <div className="flex items-center">
              <input
                id="patient"
                name="userType"
                type="radio"
                value="patient"
                checked={formData.userType === 'patient'}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="patient" className="ml-2 block text-sm text-neutral-700">
                Patient
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="caregiver"
                name="userType"
                type="radio"
                value="caregiver"
                checked={formData.userType === 'caregiver'}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="caregiver" className="ml-2 block text-sm text-neutral-700">
                Caregiver
              </label>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full btn-primary ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register; 