# LLM Integration for MindFlex App

This document outlines the integration of Large Language Models (LLMs) into the MindFlex application to provide agentic capabilities across different aspects of the application.

## Architecture

The LLM integration follows a modular architecture:

1. **LLM Service** (`app/services/llm_service.py`): Core service that manages connections to various LLM providers
2. **Agent Service** (`app/services/agent_service.py`): Specialized agents built on top of the LLM service
3. **LLM Routes** (`app/routes/llm_routes.py`): API endpoints for LLM interactions
4. **Integration with existing services**: Enhanced functionality in existing services

## Available LLM Providers

The system supports multiple LLM providers:

- **OpenAI**: GPT models (requires API key)
- **Anthropic**: Claude models (requires API key)
- **Local LLMs**: Connect to models running locally through APIs like Ollama or LM Studio

## Specialized Agents

The system includes three specialized agents, each targeting a specific area of the application:

1. **GameAgent**: For cognitive games and word puzzles
   - Generate game exercises
   - Evaluate user answers
   - Analyze performance

2. **TherapyAgent**: For sound therapy and relaxation
   - Recommend sounds based on mood
   - Generate guided meditations
   - Personalize therapy experiences

3. **CaregiverAgent**: For caregiver support
   - Analyze patient progress
   - Generate daily care plans
   - Provide caregiver advice

## API Endpoints

The following API endpoints are available for LLM interactions:

### General

- `GET /api/llm/models`: List available LLM models
- `POST /api/llm/chat`: General chat endpoint

### Game-Related

- `POST /api/llm/generate-exercise`: Generate a cognitive exercise
- `POST /api/llm/evaluate-answer`: Evaluate a user's answer

### Therapy-Related

- `POST /api/llm/recommend-sounds`: Recommend sounds based on mood
- `POST /api/llm/guided-meditation`: Generate a guided meditation script

### Caregiver-Related

- `POST /api/llm/analyze-patient`: Analyze patient progress
- `POST /api/llm/daily-plan`: Generate a daily care plan

## Configuration

LLM integration is configured through environment variables:

```
# LLM Configuration
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
LOCAL_LLM_API_URL=http://localhost:8080

# LLM Default Settings
DEFAULT_LLM_PROVIDER=openai
DEFAULT_TEXT_MODEL=gpt-3.5-turbo-instruct
DEFAULT_CHAT_MODEL=gpt-3.5-turbo
DEFAULT_EMBEDDING_MODEL=text-embedding-ada-002
```

## Usage Examples

### Generate a Cognitive Exercise

```javascript
// Frontend code example
const response = await fetch('/api/llm/generate-exercise', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    game_type: 'word puzzle',
    difficulty: 'medium',
    user_profile: {
      age: 65,
      strengths: 'vocabulary',
      improvement_areas: 'memory recall'
    }
  }),
});

const data = await response.json();
console.log(data.exercise);
```

### Analyze Patient Progress

```javascript
// Frontend code example
const response = await fetch('/api/llm/analyze-patient', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    patient_data: {
      game_history: [...],
      therapy_history: [...],
      medications: [...],
      reported_symptoms: [...]
    }
  }),
});

const data = await response.json();
console.log(data.analysis);
```

## Integration with Existing Services

The LLM capabilities have been integrated with existing services to enhance functionality:

1. **Game Analytics**: Enhanced with LLM-powered insights about cognitive patterns
2. **Therapy Recommendations**: Personalized based on user preferences and history
3. **Caregiver Support**: AI-powered patient progress analysis and care planning

## Implementation Notes

- The system uses a singleton pattern for LLM service and agents to manage resources efficiently
- JSON response parsing includes fallback mechanisms for when models don't return valid JSON
- Conversation history is maintained in agents but limited to a reasonable size
- Error handling ensures graceful degradation if LLM services are unavailable 