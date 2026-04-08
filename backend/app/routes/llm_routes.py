from flask import Blueprint, request, jsonify
import os
from app.services.agent_service import (
    get_game_agent,
    get_therapy_agent,
    get_caregiver_agent
)

bp = Blueprint('llm', __name__, url_prefix='/api/llm')

@bp.route('/models', methods=['GET'])
def list_models():
    """List available LLM models."""
    # Environment variables or config
    default_provider = os.environ.get('DEFAULT_LLM_PROVIDER', 'openai')
    
    # Build models list based on available API keys and configurations
    models = []
    
    # OpenAI models
    if os.environ.get('OPENAI_API_KEY'):
        models.extend([
            {
                "id": "gpt-4o",
                "name": "GPT-4o",
                "provider": "openai",
                "description": "Most capable model, can understand and generate text, images, and code",
                "context_length": 128000,
                "is_chat": True
            },
            {
                "id": "gpt-3.5-turbo",
                "name": "GPT-3.5 Turbo",
                "provider": "openai",
                "description": "Fast and efficient model for most tasks",
                "context_length": 16000,
                "is_chat": True
            }
        ])
    
    # Anthropic models
    if os.environ.get('ANTHROPIC_API_KEY'):
        models.extend([
            {
                "id": "claude-3-opus-20240229",
                "name": "Claude 3 Opus",
                "provider": "anthropic",
                "description": "Most powerful Claude model for complex tasks",
                "context_length": 200000,
                "is_chat": True
            },
            {
                "id": "claude-3-sonnet-20240229",
                "name": "Claude 3 Sonnet",
                "provider": "anthropic",
                "description": "Balanced Claude model for most tasks",
                "context_length": 200000,
                "is_chat": True
            },
            {
                "id": "claude-3-haiku-20240307",
                "name": "Claude 3 Haiku",
                "provider": "anthropic",
                "description": "Fast and efficient Claude model",
                "context_length": 200000,
                "is_chat": True
            }
        ])
    
    # Local models (always available)
    local_api_url = os.environ.get('LOCAL_LLM_API_URL')
    if local_api_url:
        models.append({
            "id": "local-default",
            "name": "Local LLM",
            "provider": "local",
            "description": "Run models locally via API",
            "context_length": 8000,
            "is_chat": True
        })
    
    # Get default model ID based on provider
    default_model_id = None
    if default_provider == 'openai' and os.environ.get('OPENAI_API_KEY'):
        default_model_id = os.environ.get('DEFAULT_CHAT_MODEL', 'gpt-3.5-turbo')
    elif default_provider == 'anthropic' and os.environ.get('ANTHROPIC_API_KEY'):
        default_model_id = os.environ.get('DEFAULT_CHAT_MODEL', 'claude-3-sonnet-20240229')
    elif default_provider == 'local':
        default_model_id = 'local-default'
    
    return jsonify({
        "status": "success",
        "models": models,
        "default_model_id": default_model_id
    })

@bp.route('/chat', methods=['POST'])
def chat():
    """General chat endpoint for LLM interaction."""
    data = request.json
    
    # Get parameters
    messages = data.get('messages', [])
    model_id = data.get('model_id')
    provider = data.get('provider')
    
    # Determine provider from model_id if not specified
    if not provider and model_id:
        if model_id.startswith('gpt-'):
            provider = 'openai'
        elif model_id.startswith('claude-'):
            provider = 'anthropic'
        else:
            provider = 'local'
    
    # Use default provider if none specified
    if not provider:
        provider = os.environ.get('DEFAULT_LLM_PROVIDER', 'openai')
    
    # Get game agent (which is based on the general Agent)
    agent = get_game_agent(provider)
    
    # Reset history to prevent contamination
    agent.reset_history()
    
    # Extract just the user messages for the prompt
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            "role": msg.get('role', 'user'),
            "content": msg.get('content', '')
        })
    
    options = {
        "model": model_id
    }
    
    try:
        # Use the last message as the query and include prior messages as history
        if formatted_messages:
            # Add all messages before the last one to history
            for msg in formatted_messages[:-1]:
                agent._add_to_history(msg["role"], msg["content"])
            
            # Use the last message as the query
            last_message = formatted_messages[-1]
            response = agent.ask(last_message["content"], options=options)
        else:
            response = "No messages provided."
            
        return jsonify({
            "status": "success",
            "response": response
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@bp.route('/generate-exercise', methods=['POST'])
def generate_exercise():
    """Generate a cognitive exercise using the game agent."""
    data = request.json
    
    game_type = data.get('game_type', 'word puzzle')
    difficulty = data.get('difficulty', 'medium')
    user_profile = data.get('user_profile', {})
    provider_name = data.get('provider')
    
    agent = get_game_agent(provider_name)
    
    try:
        exercise = agent.generate_exercise(game_type, difficulty, user_profile)
        return jsonify({
            "status": "success",
            "exercise": exercise
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@bp.route('/evaluate-answer', methods=['POST'])
def evaluate_answer():
    """Evaluate a user's answer to a cognitive exercise."""
    data = request.json
    
    exercise = data.get('exercise', {})
    user_answer = data.get('user_answer', '')
    provider_name = data.get('provider')
    
    agent = get_game_agent(provider_name)
    
    try:
        evaluation = agent.evaluate_answer(exercise, user_answer)
        return jsonify({
            "status": "success",
            "evaluation": evaluation
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@bp.route('/recommend-sounds', methods=['POST'])
def recommend_sounds():
    """Recommend sounds for therapy based on user mood."""
    data = request.json
    
    user_mood = data.get('mood', 'neutral')
    preferences = data.get('preferences', [])
    therapy_goal = data.get('therapy_goal')
    provider_name = data.get('provider')
    
    agent = get_therapy_agent(provider_name)
    
    try:
        recommendations = agent.recommend_sounds(user_mood, preferences, therapy_goal)
        return jsonify({
            "status": "success",
            "recommendations": recommendations
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@bp.route('/guided-meditation', methods=['POST'])
def guided_meditation():
    """Generate a guided meditation script."""
    data = request.json
    
    duration_minutes = data.get('duration', 10)
    focus_area = data.get('focus_area', 'relaxation')
    experience_level = data.get('experience_level', 'beginner')
    provider_name = data.get('provider')
    
    agent = get_therapy_agent(provider_name)
    
    try:
        meditation = agent.generate_guided_meditation(duration_minutes, focus_area, experience_level)
        return jsonify({
            "status": "success",
            "meditation": meditation
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@bp.route('/analyze-patient', methods=['POST'])
def analyze_patient():
    """Analyze patient progress data using the caregiver agent."""
    data = request.json
    
    patient_data = data.get('patient_data', {})
    provider_name = data.get('provider')
    
    agent = get_caregiver_agent(provider_name)
    
    try:
        analysis = agent.analyze_patient_progress(patient_data)
        return jsonify({
            "status": "success",
            "analysis": analysis
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@bp.route('/daily-plan', methods=['POST'])
def daily_plan():
    """Generate a daily care plan for a patient."""
    data = request.json
    
    patient_profile = data.get('patient_profile', {})
    caregiver_constraints = data.get('caregiver_constraints', {})
    provider_name = data.get('provider')
    
    agent = get_caregiver_agent(provider_name)
    
    try:
        plan = agent.generate_daily_plan(patient_profile, caregiver_constraints)
        return jsonify({
            "status": "success",
            "plan": plan
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500 