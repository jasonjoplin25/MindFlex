import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta

def detect_cognitive_trends(df):
    """
    Detect trends in cognitive game performance using time series analysis.
    
    Args:
        df (DataFrame): DataFrame containing game score data
        
    Returns:
        dict: Trend analysis results
    """
    # Ensure data is sorted by date
    df = df.sort_values('created_at')
    
    # Check if we have enough data points
    if len(df) < 5:
        return {
            "trend": "insufficient_data",
            "details": "Need at least 5 game sessions for trend analysis"
        }
    
    # Extract features for analysis
    features = ['score', 'duration', 'errors']
    
    # Calculate moving averages
    window_size = min(5, len(df) // 2)
    
    # Create a new DataFrame for analysis
    analysis_df = pd.DataFrame()
    
    for feature in features:
        if feature in df.columns:
            # Calculate moving average
            analysis_df[f'{feature}_ma'] = df[feature].rolling(window=window_size).mean()
            
            # Calculate rate of change (first derivative)
            analysis_df[f'{feature}_roc'] = df[feature].diff() / df[feature].shift(1)
    
    # Drop NaN values from initial window
    analysis_df = analysis_df.dropna()
    
    if len(analysis_df) < 3:
        return {
            "trend": "insufficient_data",
            "details": "Not enough data points after processing"
        }
    
    # Detect trends for each feature
    trends = {}
    
    for feature in features:
        if f'{feature}_ma' in analysis_df.columns:
            # Get the last few values of the moving average
            recent_values = analysis_df[f'{feature}_ma'].tail(3).values
            
            # Calculate the slope of recent values
            slope = np.polyfit(range(len(recent_values)), recent_values, 1)[0]
            
            # Determine trend direction
            if feature == 'score':
                # For score, higher is better
                if slope > 0.05:
                    trends[feature] = "improving"
                elif slope < -0.05:
                    trends[feature] = "declining"
                else:
                    trends[feature] = "stable"
            else:
                # For duration and errors, lower is better
                if slope > 0.05:
                    trends[feature] = "declining"
                elif slope < -0.05:
                    trends[feature] = "improving"
                else:
                    trends[feature] = "stable"
    
    # Determine overall trend
    if 'score' in trends:
        overall_trend = trends['score']
    else:
        # If no score data, use other metrics
        trend_values = list(trends.values())
        if 'declining' in trend_values:
            overall_trend = "declining"
        elif 'improving' in trend_values:
            overall_trend = "improving"
        else:
            overall_trend = "stable"
    
    # Generate detailed analysis
    details = []
    for feature, trend in trends.items():
        if feature == 'score':
            if trend == 'improving':
                details.append(f"Scores are improving over time")
            elif trend == 'declining':
                details.append(f"Scores are declining over time")
            else:
                details.append(f"Scores are stable")
        elif feature == 'duration':
            if trend == 'improving':
                details.append(f"Response times are getting faster")
            elif trend == 'declining':
                details.append(f"Response times are getting slower")
            else:
                details.append(f"Response times are stable")
        elif feature == 'errors':
            if trend == 'improving':
                details.append(f"Error rates are decreasing")
            elif trend == 'declining':
                details.append(f"Error rates are increasing")
            else:
                details.append(f"Error rates are stable")
    
    return {
        "trend": overall_trend,
        "details": ". ".join(details)
    }

def predict_cognitive_decline(patient_id, game_history):
    """
    Use a trained LSTM model to predict potential cognitive decline.
    
    Args:
        patient_id (str): ID of the patient
        game_history (DataFrame): DataFrame containing game history
        
    Returns:
        dict: Prediction results
    """
    # This is a placeholder for a more sophisticated ML model
    # In a real implementation, this would load a trained TensorFlow model
    
    # Check if we have enough data
    if len(game_history) < 10:
        return {
            "risk_level": "unknown",
            "confidence": 0.0,
            "message": "Insufficient data for prediction"
        }
    
    # Extract features
    features = ['score', 'duration', 'errors']
    
    # Normalize data
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(game_history[features])
    
    # In a real implementation, we would:
    # 1. Reshape data for LSTM input
    # 2. Load a pre-trained model
    # 3. Make predictions
    
    # Simulate a prediction based on trends
    score_trend = game_history['score'].tail(5).mean() - game_history['score'].head(5).mean()
    error_trend = game_history['errors'].tail(5).mean() - game_history['errors'].head(5).mean()
    
    # Calculate a simple risk score
    risk_score = -score_trend + error_trend
    
    # Map to risk levels
    if risk_score > 5:
        risk_level = "high"
        confidence = 0.8
        message = "Potential cognitive decline detected. Consider consulting a healthcare professional."
    elif risk_score > 2:
        risk_level = "moderate"
        confidence = 0.6
        message = "Some indicators of potential cognitive changes. Continue monitoring."
    else:
        risk_level = "low"
        confidence = 0.7
        message = "No significant indicators of cognitive decline."
    
    return {
        "risk_level": risk_level,
        "confidence": confidence,
        "message": message
    }

def generate_cognitive_report(patient_id, game_history, time_period='30d'):
    """
    Generate a comprehensive cognitive report for a patient.
    
    Args:
        patient_id (str): ID of the patient
        game_history (DataFrame): DataFrame containing game history
        time_period (str): Time period for analysis
        
    Returns:
        dict: Report data
    """
    # Group data by game type
    game_types = game_history['game_id'].unique()
    
    report = {
        "patient_id": patient_id,
        "generated_at": datetime.now().isoformat(),
        "time_period": time_period,
        "overall_trend": None,
        "game_analysis": {},
        "recommendations": []
    }
    
    # Analyze each game type
    for game_type in game_types:
        game_data = game_history[game_history['game_id'] == game_type]
        
        if len(game_data) >= 3:
            trend_data = detect_cognitive_trends(game_data)
            
            report["game_analysis"][game_type] = {
                "sessions": len(game_data),
                "avg_score": game_data['score'].mean(),
                "trend": trend_data["trend"],
                "details": trend_data["details"]
            }
    
    # Determine overall trend
    trends = [analysis["trend"] for analysis in report["game_analysis"].values() 
              if analysis["trend"] != "insufficient_data"]
    
    if trends:
        if "declining" in trends:
            report["overall_trend"] = "declining"
        elif "improving" in trends:
            report["overall_trend"] = "improving"
        else:
            report["overall_trend"] = "stable"
    else:
        report["overall_trend"] = "insufficient_data"
    
    # Generate recommendations
    if report["overall_trend"] == "declining":
        report["recommendations"].append("Consider increasing frequency of cognitive games")
        report["recommendations"].append("Try focusing on games that target areas showing decline")
    elif report["overall_trend"] == "improving":
        report["recommendations"].append("Continue current routine")
        report["recommendations"].append("Consider increasing difficulty levels to maintain challenge")
    elif report["overall_trend"] == "stable":
        report["recommendations"].append("Try new game types for variety")
        report["recommendations"].append("Consider adjusting difficulty to provide appropriate challenge")
    else:
        report["recommendations"].append("Continue playing games to generate more data for analysis")
    
    return report 