import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { therapyApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const SoundPlayer = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(30); // minutes
  const [remainingTime, setRemainingTime] = useState(null);
  
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const animationRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        setLoading(true);
        const response = await therapyApi.getSoundTrackById(trackId);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        setTrack(response.data);
        
        // Log this session if user is logged in
        if (user) {
          await therapyApi.logTherapySession(trackId);
        }
      } catch (err) {
        setError('Failed to load sound track: ' + err.message);
        console.error('Error fetching sound track:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrack();
    
    // Cleanup animation frame on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [trackId, user]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      cancelAnimationFrame(animationRef.current);
    } else {
      audioRef.current.play();
      animationRef.current = requestAnimationFrame(whilePlaying);
    }
    setIsPlaying(!isPlaying);
  };

  const whilePlaying = () => {
    if (audioRef.current) {
      progressBarRef.current.value = audioRef.current.currentTime;
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(whilePlaying);
    }
  };

  const changeRange = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = progressBarRef.current.value;
      setCurrentTime(progressBarRef.current.value);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      progressBarRef.current.max = audioRef.current.duration;
    }
  };

  const formatTime = (time) => {
    if (time && !isNaN(time)) {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    return '0:00';
  };

  // Handle timer
  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const endTime = Date.now() + timerDuration * 60 * 1000;
    setRemainingTime(timerDuration * 60);
    setTimerActive(true);
    
    timerRef.current = setInterval(() => {
      const remaining = Math.round((endTime - Date.now()) / 1000);
      
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setTimerActive(false);
        setRemainingTime(null);
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      } else {
        setRemainingTime(remaining);
      }
    }, 1000);
  };

  const cancelTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimerActive(false);
    setRemainingTime(null);
  };

  // Format timer display
  const formatTimerDisplay = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-neutral-200 rounded-lg mb-6"></div>
          <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-3/4 mb-6"></div>
          <div className="h-10 bg-neutral-200 rounded-lg w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-error-50 text-error-700 rounded-lg">
          {error}
        </div>
        <button
          onClick={() => navigate('/therapy')}
          className="mt-4 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
        >
          Back to Sound Therapy
        </button>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-neutral-700">Sound track not found</h3>
          <button
            onClick={() => navigate('/therapy')}
            className="mt-4 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
          >
            Back to Sound Therapy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/therapy" className="text-purple-600 hover:text-purple-800">
          ← Back to Sound Therapy
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="h-64 bg-purple-100 flex items-center justify-center">
          <div className="text-8xl">🎵</div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{track.title}</h1>
              <p className="text-gray-600 mt-1">Category: {track.category}</p>
            </div>
            <span className="mt-2 md:mt-0 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              {formatTime(duration)}
            </span>
          </div>
          
          <p className="text-gray-700 mb-8">{track.description}</p>
          
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">{formatTime(currentTime)}</span>
              <span className="text-gray-600 text-sm">{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={changeRange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="flex items-center justify-center space-x-6 mb-8">
            <button className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"></path>
              </svg>
            </button>
            
            <button 
              className="p-4 bg-purple-600 rounded-full hover:bg-purple-700 transition-colors"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              )}
            </button>
            
            <button className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"></path>
              </svg>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.465a5 5 0 001.06-7.072m-2.829 9.9a9 9 0 010-12.728"></path>
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={(e) => setVolume(e.target.value / 100)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-purple-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-purple-800 mb-4">How to Use This Sound Therapy</h2>
        <ol className="list-decimal pl-5 text-gray-700 space-y-2">
          <li>Find a quiet, comfortable place where you won't be disturbed.</li>
          <li>Use headphones for the best experience.</li>
          <li>Close your eyes and focus on your breathing.</li>
          <li>Let the sounds guide your relaxation or focus.</li>
          <li>Try to complete at least 10 minutes of listening for optimal benefits.</li>
        </ol>
      </div>
    </div>
  );
};

export default SoundPlayer; 