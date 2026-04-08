import unittest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.ml_utils import detect_cognitive_trends
from app.services.game_service import generate_recommendations

class TestGameService(unittest.TestCase):
    
    def setUp(self):
        """Set up test data."""
        # Create sample game history data
        dates = [datetime.now() - timedelta(days=i) for i in range(10, 0, -1)]
        
        self.improving_data = pd.DataFrame({
            'created_at': dates,
            'game_id': ['memory'] * 10,
            'score': [70, 72, 75, 73, 78, 80, 82, 85, 87, 90],
            'duration': [60, 58, 55, 57, 54, 52, 50, 48, 45, 43],
            'errors': [5, 5, 4, 4, 3, 3, 2, 2, 1, 1]
        })
        
        self.declining_data = pd.DataFrame({
            'created_at': dates,
            'game_id': ['attention'] * 10,
            'score': [90, 87, 85, 82, 80, 78, 75, 73, 70, 68],
            'duration': [40, 43, 45, 48, 50, 53, 55, 58, 60, 63],
            'errors': [1, 1, 2, 2, 3, 3, 4, 4, 5, 6]
        })
        
        self.stable_data = pd.DataFrame({
            'created_at': dates,
            'game_id': ['problem_solving'] * 10,
            'score': [80, 82, 79, 81, 80, 78, 81, 79, 80, 81],
            'duration': [50, 48, 51, 49, 50, 52, 49, 51, 50, 49],
            'errors': [2, 2, 3, 2, 2, 3, 2, 3, 2, 2]
        })
        
        self.insufficient_data = pd.DataFrame({
            'created_at': dates[:2],
            'game_id': ['language'] * 2,
            'score': [75, 78],
            'duration': [55, 53],
            'errors': [3, 2]
        })
    
    def test_detect_improving_trend(self):
        """Test trend detection for improving performance."""
        result = detect_cognitive_trends(self.improving_data)
        self.assertEqual(result['trend'], 'improving')
        self.assertIn('improving', result['details'])
    
    def test_detect_declining_trend(self):
        """Test trend detection for declining performance."""
        result = detect_cognitive_trends(self.declining_data)
        self.assertEqual(result['trend'], 'declining')
        self.assertIn('declining', result['details'])
    
    def test_detect_stable_trend(self):
        """Test trend detection for stable performance."""
        result = detect_cognitive_trends(self.stable_data)
        self.assertEqual(result['trend'], 'stable')
        self.assertIn('stable', result['details'])
    
    def test_insufficient_data(self):
        """Test handling of insufficient data."""
        result = detect_cognitive_trends(self.insufficient_data)
        self.assertEqual(result['trend'], 'insufficient_data')
    
    def test_generate_recommendations_improving(self):
        """Test recommendation generation for improving trend."""
        stats = {
            "total_games": 10,
            "avg_score": 80,
            "avg_duration": 50,
            "avg_errors": 2
        }
        recommendations = generate_recommendations('improving', stats)
        self.assertTrue(len(recommendations) > 0)
        self.assertTrue(any('challenge' in r.lower() for r in recommendations))
    
    def test_generate_recommendations_declining(self):
        """Test recommendation generation for declining trend."""
        stats = {
            "total_games": 10,
            "avg_score": 70,
            "avg_duration": 60,
            "avg_errors": 5
        }
        recommendations = generate_recommendations('declining', stats)
        self.assertTrue(len(recommendations) > 0)
        self.assertTrue(any('focus' in r.lower() for r in recommendations))

if __name__ == '__main__':
    unittest.main() 