import logging
from typing import Dict, List, Any, Optional, Union
from .llm_service import get_llm_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Agent:
    """Base class for all agents in the system"""
    
    def __init__(self, provider_name: str = None):
        """Initialize the agent with a specific LLM provider"""
        self.llm_service = get_llm_service()
        self.provider_name = provider_name
        self.provider = self.llm_service.get_provider(provider_name)
        self.history = []
    
    def _add_to_history(self, role: str, content: str):
        """Add a message to the conversation history"""
        self.history.append({"role": role, "content": content})
        # Keep history to a reasonable size
        if len(self.history) > 20:
            # Remove oldest messages but keep the system message if it exists
            if self.history[0]["role"] == "system":
                self.history = [self.history[0]] + self.history[-19:]
            else:
                self.history = self.history[-20:]
    
    def ask(self, query: str, system_prompt: str = None, options: Dict[str, Any] = None) -> str:
        """Ask the agent a question and get a response"""
        messages = []
        
        # Add system prompt if provided
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        # Add history if available
        if self.history:
            messages.extend(self.history)
        
        # Add the new query
        messages.append({"role": "user", "content": query})
        
        # Get response from LLM
        response = self.provider.generate_chat(messages, options)
        
        # Add to history
        self._add_to_history("user", query)
        self._add_to_history("assistant", response)
        
        return response
    
    def reset_history(self):
        """Clear the conversation history"""
        self.history = []

class GameAgent(Agent):
    """Agent specialized for cognitive games and exercises"""
    
    def __init__(self, provider_name: str = None):
        super().__init__(provider_name)
        
        # Set default system prompt
        self.system_prompt = """You are a specialized AI assistant for cognitive games and exercises. 
Your goal is to help users with word games, puzzles, and cognitive exercises that can improve memory,
attention, and language skills. Be encouraging, adaptive to different difficulty levels, and provide
hints without giving away answers completely."""
    
    def generate_exercise(self, game_type: str, difficulty: str, user_profile: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate a new cognitive exercise based on game type and difficulty"""
        prompt = f"""Generate a new {game_type} cognitive exercise at {difficulty} difficulty level."""
        
        if user_profile:
            prompt += f"""\nThis is for a user with the following profile:
Age: {user_profile.get('age', 'unknown')}
Cognitive strengths: {user_profile.get('strengths', 'unknown')}
Areas needing improvement: {user_profile.get('improvement_areas', 'unknown')}
Previous performance: {user_profile.get('previous_performance', 'unknown')}"""
        
        # Request a specific format for the response
        prompt += """\nPlease structure your response as a JSON object with the following fields:
1. title - The title of the exercise
2. instructions - Clear and concise instructions for the user
3. content - The actual exercise content (words, questions, etc.)
4. hints - A list of 3 progressive hints that can be revealed one by one
5. solution - The correct answer or approach
6. validation_criteria - How to validate if the user's answer is correct

Make sure the exercise is appropriate for the difficulty level and engaging for the user."""
        
        # Get response and parse as JSON
        try:
            response = self.ask(prompt, self.system_prompt)
            # Find JSON in the response (might be wrapped in ```json...``` or just plain text)
            import json
            import re
            
            # Try to find JSON in markdown code blocks
            json_match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', response)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Assume the entire response is JSON
                json_str = response
                
            exercise = json.loads(json_str)
            return exercise
        except Exception as e:
            logger.error(f"Error generating exercise: {str(e)}")
            return {
                "error": "Failed to generate exercise",
                "details": str(e)
            }
    
    def evaluate_answer(self, exercise: Dict[str, Any], user_answer: str) -> Dict[str, Any]:
        """Evaluate a user's answer to a cognitive exercise"""
        prompt = f"""Evaluate the following user answer to a cognitive exercise:
        
Exercise: {exercise['title']}
Instructions: {exercise['instructions']}
Content: {exercise['content']}
Correct solution: {exercise['solution']}
Validation criteria: {exercise['validation_criteria']}

User's answer: {user_answer}

Please provide feedback on the user's answer. Include:
1. Whether the answer is correct or partially correct
2. A score from 0-100
3. Constructive feedback
4. A suggestion for improvement if needed
5. Encouragement for the user

Structure your response as a JSON object."""
        
        try:
            response = self.ask(prompt, self.system_prompt)
            # Find JSON in the response
            import json
            import re
            
            json_match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', response)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response
                
            evaluation = json.loads(json_str)
            return evaluation
        except Exception as e:
            logger.error(f"Error evaluating answer: {str(e)}")
            return {
                "correct": False,
                "score": 0,
                "feedback": "Sorry, I couldn't evaluate your answer due to a technical issue.",
                "suggestion": "Please try again later.",
                "encouragement": "Keep practicing!"
            }

class TherapyAgent(Agent):
    """Agent specialized for sound therapy and relaxation"""
    
    def __init__(self, provider_name: str = None):
        super().__init__(provider_name)
        
        # Set default system prompt
        self.system_prompt = """You are a specialized AI assistant for sound therapy and relaxation.
Your role is to recommend appropriate sounds, music, and relaxation techniques based on a user's
mood, preferences, and therapeutic needs. Be calming, empathetic, and focus on emotional well-being
and stress reduction."""
    
    def recommend_sounds(self, user_mood: str, preferences: List[str] = None, therapy_goal: str = None) -> List[Dict[str, Any]]:
        """Recommend sounds based on user mood and preferences"""
        prompt = f"""Recommend sound therapy options for a user who is feeling {user_mood}."""
        
        if preferences:
            prompt += f"\nUser preferences: {', '.join(preferences)}"
        
        if therapy_goal:
            prompt += f"\nTherapy goal: {therapy_goal}"
        
        prompt += """\nPlease recommend 3-5 sound therapy options. Structure your response as a JSON array of objects, 
where each object has the following fields:
1. title - Name of the recommended sound or track
2. category - Category (nature, ambient, music, etc.)
3. duration - Recommended duration in minutes
4. description - Why this is recommended and its benefits
5. instructions - How to best experience this sound (environment, posture, etc.)"""
        
        try:
            response = self.ask(prompt, self.system_prompt)
            # Parse JSON response
            import json
            import re
            
            json_match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', response)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response
                
            recommendations = json.loads(json_str)
            return recommendations
        except Exception as e:
            logger.error(f"Error generating sound recommendations: {str(e)}")
            return [{
                "title": "Calming Ocean Waves",
                "category": "nature",
                "duration": 15,
                "description": "Ocean sounds can help reduce anxiety and promote relaxation.",
                "instructions": "Find a comfortable position, close your eyes, and focus on the rhythm of the waves."
            }]
    
    def generate_guided_meditation(self, duration_minutes: int, focus_area: str, user_experience_level: str = "beginner") -> str:
        """Generate a guided meditation script based on user preferences"""
        prompt = f"""Create a guided meditation script for a {duration_minutes}-minute meditation 
focusing on {focus_area} for a {user_experience_level} level practitioner.

The script should include:
1. A gentle introduction
2. Breathing instructions
3. Guided visualization
4. Periodic reminders to refocus attention
5. A gentle conclusion

Make sure the pacing is appropriate for a {duration_minutes}-minute session and the language 
is calming and supportive."""
        
        response = self.ask(prompt, self.system_prompt)
        return response

class CaregiverAgent(Agent):
    """Agent specialized for caregiver support and patient management"""
    
    def __init__(self, provider_name: str = None):
        super().__init__(provider_name)
        
        # Set default system prompt
        self.system_prompt = """You are a specialized AI assistant for caregivers managing patients with cognitive concerns.
Your role is to provide practical advice, emotional support, and help with tracking patient progress.
Be compassionate, informative, and focus on evidence-based approaches. While you can offer general
guidance, always clarify that you're not replacing professional medical advice."""
    
    def analyze_patient_progress(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze patient progress data and provide insights"""
        # Extract relevant data for the prompt
        game_history = patient_data.get("game_history", [])
        therapy_history = patient_data.get("therapy_history", [])
        medications = patient_data.get("medications", [])
        symptoms = patient_data.get("reported_symptoms", [])
        
        # Create a prompt for the LLM
        prompt = """Analyze the following patient data and provide insights on progress, areas for improvement, and recommendations:"""
        
        if game_history:
            prompt += "\n\nGame Performance History:"
            for game in game_history[:5]:  # Limit to most recent 5 for brevity
                prompt += f"\n- Game: {game.get('game_name')}, Score: {game.get('score')}, Date: {game.get('date')}"
        
        if therapy_history:
            prompt += "\n\nTherapy Session History:"
            for session in therapy_history[:5]:
                prompt += f"\n- Type: {session.get('therapy_type')}, Duration: {session.get('duration')} min, Mood Change: {session.get('mood_change', 'Not reported')}, Date: {session.get('date')}"
        
        if medications:
            prompt += "\n\nCurrent Medications:"
            for med in medications:
                prompt += f"\n- {med.get('name')}, Dosage: {med.get('dosage')}, Schedule: {med.get('schedule')}"
        
        if symptoms:
            prompt += "\n\nReported Symptoms:"
            for symptom in symptoms:
                prompt += f"\n- {symptom.get('description')}, Severity: {symptom.get('severity')}, Date: {symptom.get('date')}"
        
        prompt += """\n\nPlease structure your analysis as a JSON object with the following sections:
1. progress_summary - Overall assessment of patient progress
2. cognitive_strengths - Areas where the patient is showing good performance
3. improvement_areas - Areas that need attention or improvement
4. recommendations - Specific recommendations for games, exercises, or therapy
5. caregiver_tips - Practical tips for the caregiver
6. follow_up - Suggested follow-up actions or assessments"""
        
        try:
            response = self.ask(prompt, self.system_prompt)
            # Parse JSON response
            import json
            import re
            
            json_match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', response)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response
                
            analysis = json.loads(json_str)
            return analysis
        except Exception as e:
            logger.error(f"Error analyzing patient progress: {str(e)}")
            return {
                "progress_summary": "Unable to generate progress summary due to a technical issue.",
                "cognitive_strengths": [],
                "improvement_areas": [],
                "recommendations": ["Please try again later or consult a healthcare professional for a proper assessment."],
                "caregiver_tips": ["Continue following the care plan prescribed by healthcare providers."],
                "follow_up": ["Consider scheduling a consultation with the patient's healthcare provider."]
            }
    
    def generate_daily_plan(self, patient_profile: Dict[str, Any], caregiver_constraints: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate a daily care and activity plan for a patient"""
        prompt = """Generate a daily care and activity plan for a patient with the following profile:"""
        
        prompt += f"\nAge: {patient_profile.get('age', 'unknown')}"
        prompt += f"\nCognitive condition: {patient_profile.get('condition', 'unknown')}"
        prompt += f"\nMobility level: {patient_profile.get('mobility', 'unknown')}"
        prompt += f"\nCognitive strengths: {patient_profile.get('strengths', 'unknown')}"
        prompt += f"\nAreas needing improvement: {patient_profile.get('improvement_areas', 'unknown')}"
        prompt += f"\nInterests/hobbies: {patient_profile.get('interests', 'unknown')}"
        
        if caregiver_constraints:
            prompt += "\n\nCaregiver constraints:"
            prompt += f"\nAvailable time: {caregiver_constraints.get('available_time', 'unknown')}"
            prompt += f"\nSupport network: {caregiver_constraints.get('support_network', 'unknown')}"
            prompt += f"\nOther considerations: {caregiver_constraints.get('considerations', 'unknown')}"
        
        prompt += """\n\nPlease structure your daily plan as a JSON object with the following sections:
1. morning_routine - Activities and care for the morning
2. cognitive_exercises - Recommended cognitive games or exercises (2-3)
3. physical_activities - Recommended physical activities suitable for patient's mobility
4. meals - Meal suggestions considering nutritional needs
5. therapy_sessions - Any recommended therapy sessions
6. social_engagement - Ideas for social interaction
7. evening_routine - Activities and care for the evening
8. caregiver_breaks - Suggested times for caregiver rest and self-care"""
        
        try:
            response = self.ask(prompt, self.system_prompt)
            # Parse JSON response
            import json
            import re
            
            json_match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', response)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response
                
            daily_plan = json.loads(json_str)
            return daily_plan
        except Exception as e:
            logger.error(f"Error generating daily plan: {str(e)}")
            return {
                "morning_routine": ["Gentle wake-up", "Medication", "Breakfast", "Light stretching"],
                "cognitive_exercises": ["Memory card matching", "Simple word puzzles"],
                "physical_activities": ["Short walk if mobility allows", "Seated exercises"],
                "meals": ["Focus on balanced nutrition", "Stay hydrated throughout the day"],
                "therapy_sessions": ["Consider scheduled therapy appointments"],
                "social_engagement": ["Family video call", "Looking at photo albums"],
                "evening_routine": ["Calm activities before bed", "Medication", "Regular sleep schedule"],
                "caregiver_breaks": ["Short breaks when patient is engaged in an activity", "Self-care is important"]
            }


class AssessmentAgent(Agent):
    """Agent specialized for cognitive assessment interpretation and caregiver reporting"""

    # Clinical domain thresholds (0-100 normalised scores)
    DOMAIN_THRESHOLDS = {
        'memory':           {'normal': 70, 'mild': 50, 'moderate': 30},
        'attention':        {'normal': 65, 'mild': 45, 'moderate': 25},
        'processing-speed': {'normal': 60, 'mild': 40, 'moderate': 20},
        'reasoning':        {'normal': 67, 'mild': 50, 'moderate': 33},
    }

    DOMAIN_LABELS = {
        'memory': 'Memory & Recall',
        'attention': 'Attention & Concentration',
        'processing-speed': 'Processing Speed',
        'reasoning': 'Reasoning & Problem Solving',
    }

    def __init__(self, provider_name: str = None):
        super().__init__(provider_name)
        self.system_prompt = """You are a specialist AI assistant for cognitive health assessment in the MindFlex platform.
Your role is to interpret standardised cognitive assessment scores, identify patterns across domains, and produce
clear, compassionate, clinically-informed guidance for caregivers and patients.

Domain mapping:
- Memory & Recall      → corresponds to episodic memory assessed in MoCA/MMSE
- Attention            → sustained attention / CPT-AX paradigm
- Processing Speed     → psychomotor speed and executive efficiency
- Reasoning            → fluid reasoning / pattern completion

Score bands (0-100 normalised):
- 70-100  Normal range
- 50-69   Mild concern — monitor, gentle exercises recommended
- 30-49   Moderate concern — structured intervention warranted
- 0-29    Significant concern — clinical referral strongly recommended

IMPORTANT DISCLAIMERS:
- These are screening scores only, not clinical diagnoses.
- Always recommend that caregivers consult a qualified healthcare professional for formal assessment.
- Use compassionate, non-alarmist language.
- Be specific and actionable in recommendations."""

    # ------------------------------------------------------------------ #
    #  Core interpretation                                                 #
    # ------------------------------------------------------------------ #

    def interpret_results(self, scores: Dict[str, int], patient_profile: Dict[str, Any] = None) -> Dict[str, Any]:
        """Interpret assessment scores and return structured AI analysis."""
        overall = round(sum(scores.values()) / len(scores)) if scores else 0

        profile_text = ""
        if patient_profile:
            profile_text = f"""
Patient profile:
- Age: {patient_profile.get('age', 'unknown')}
- Condition: {patient_profile.get('condition', 'Not specified')}
- Interests: {patient_profile.get('interests', 'Not specified')}
"""

        prompt = f"""Interpret the following cognitive assessment results and provide a structured analysis.

Assessment scores (0-100 scale):
{chr(10).join(f'- {self.DOMAIN_LABELS.get(k, k)}: {v}/100' for k, v in scores.items())}
Overall average: {overall}/100
{profile_text}

Return a JSON object with these exact keys:
{{
  "overall_interpretation": "2-3 sentence plain-language summary for the patient/caregiver",
  "domain_breakdown": {{
    "<domain_key>": {{
      "label": "<human-readable name>",
      "score": <int>,
      "band": "normal|mild_concern|moderate_concern|significant_concern",
      "interpretation": "1-2 sentence explanation of what this score means",
      "immediate_tip": "one actionable tip the patient can try today"
    }}
  }},
  "strengths": ["list of domains or observations showing relative strength"],
  "focus_areas": ["list of domains or observations needing most attention"],
  "recommended_games": ["2-4 specific MindFlex game names most relevant to weakest domains"],
  "caregiver_note": "brief note for the caregiver about today's results",
  "clinical_disclaimer": "standard screening-only disclaimer"
}}"""

        try:
            response = self.ask(prompt, self.system_prompt)
            import json, re
            match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', response)
            return json.loads(match.group(1) if match else response)
        except Exception as e:
            logger.error(f"AssessmentAgent.interpret_results error: {e}")
            return {
                "overall_interpretation": "Assessment complete. Results have been saved.",
                "domain_breakdown": {k: {"label": self.DOMAIN_LABELS.get(k, k), "score": v, "band": "unknown",
                                         "interpretation": "", "immediate_tip": ""} for k, v in scores.items()},
                "strengths": [],
                "focus_areas": [],
                "recommended_games": [],
                "caregiver_note": "Please review the scores and consult a healthcare professional.",
                "clinical_disclaimer": "These are screening scores only. Consult a healthcare professional for formal assessment."
            }

    # ------------------------------------------------------------------ #
    #  Progress trend analysis                                             #
    # ------------------------------------------------------------------ #

    def analyze_progress_trends(self, assessment_history: List[Dict[str, Any]], patient_profile: Dict[str, Any] = None) -> Dict[str, Any]:
        """Analyse multiple past assessments to identify trends and produce insights."""
        if not assessment_history:
            return {"error": "No assessment history available."}

        history_text = "\n".join(
            f"- {a.get('created_at', 'unknown date')}: "
            + ", ".join(f"{self.DOMAIN_LABELS.get(k, k)}: {v}" for k, v in (a.get('scores') or {}).items())
            for a in assessment_history[-10:]  # cap at last 10
        )

        profile_text = ""
        if patient_profile:
            profile_text = f"Patient: age {patient_profile.get('age', '?')}, condition: {patient_profile.get('condition', 'Not specified')}\n"

        prompt = f"""Analyse the following cognitive assessment history and provide trend insights.

{profile_text}Assessment history (most recent last):
{history_text}

Return a JSON object with these keys:
{{
  "trend_summary": "3-4 sentence narrative of overall trajectory",
  "domain_trends": {{
    "<domain_key>": {{
      "direction": "improving|stable|declining|insufficient_data",
      "magnitude": "significant|moderate|slight",
      "observation": "1 sentence describing this domain's trend"
    }}
  }},
  "notable_changes": ["list of specific changes worth highlighting to the caregiver"],
  "intervention_response": "assessment of whether current exercises/therapy seem to be helping",
  "updated_recommendations": ["3-5 specific, actionable recommendations based on trends"],
  "follow_up_timeline": "suggested timing for next formal assessment"
}}"""

        try:
            response = self.ask(prompt, self.system_prompt)
            import json, re
            match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', response)
            return json.loads(match.group(1) if match else response)
        except Exception as e:
            logger.error(f"AssessmentAgent.analyze_progress_trends error: {e}")
            return {"trend_summary": "Unable to analyse trends at this time.", "error": str(e)}

    # ------------------------------------------------------------------ #
    #  Improvement plan                                                    #
    # ------------------------------------------------------------------ #

    def generate_improvement_plan(self, scores: Dict[str, int], patient_profile: Dict[str, Any] = None,
                                   game_history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate a personalised cognitive improvement plan."""
        sorted_domains = sorted(scores.items(), key=lambda x: x[1])
        weakest = [d for d, s in sorted_domains[:2]]

        game_context = ""
        if game_history:
            game_context = "\nRecent game activity:\n" + "\n".join(
                f"- {g.get('game_name', '?')}: avg score {g.get('avg_score', '?')}"
                for g in game_history[:5]
            )

        prompt = f"""Create a 4-week personalised cognitive improvement plan.

Current domain scores (0-100):
{chr(10).join(f'- {self.DOMAIN_LABELS.get(k, k)}: {v}/100' for k, v in scores.items())}
Priority domains (lowest scores): {', '.join(self.DOMAIN_LABELS.get(d, d) for d in weakest)}
{f"Patient age: {patient_profile.get('age', '?')}" if patient_profile else ""}
{f"Condition: {patient_profile.get('condition', 'Not specified')}" if patient_profile else ""}
{game_context}

Return a JSON object:
{{
  "plan_title": "short descriptive title",
  "plan_overview": "2-3 sentence summary of the plan's approach",
  "weekly_schedule": {{
    "week_1": {{
      "theme": "short theme name",
      "daily_exercises": ["list of 3-5 specific daily exercises with duration"],
      "mindflex_games": ["2-3 recommended games from: Memory Match, Pattern Memory, Math Challenge, Reaction Speed, Word Scramble"],
      "therapy": "sound therapy or relaxation recommendation",
      "goal": "measurable goal for this week"
    }},
    "week_2": {{ "theme": "", "daily_exercises": [], "mindflex_games": [], "therapy": "", "goal": "" }},
    "week_3": {{ "theme": "", "daily_exercises": [], "mindflex_games": [], "therapy": "", "goal": "" }},
    "week_4": {{ "theme": "", "daily_exercises": [], "mindflex_games": [], "therapy": "", "goal": "" }}
  }},
  "lifestyle_recommendations": ["3-4 lifestyle factors to support cognitive health"],
  "progress_indicators": ["how to tell if the plan is working"],
  "caregiver_role": "specific guidance for the caregiver in supporting this plan"
}}"""

        try:
            response = self.ask(prompt, self.system_prompt)
            import json, re
            match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', response)
            return json.loads(match.group(1) if match else response)
        except Exception as e:
            logger.error(f"AssessmentAgent.generate_improvement_plan error: {e}")
            return {"plan_title": "Personalised Improvement Plan", "error": str(e)}

    # ------------------------------------------------------------------ #
    #  Full caregiver report                                               #
    # ------------------------------------------------------------------ #

    def generate_assessment_report(self, current_assessment: Dict[str, Any],
                                    patient_context: Dict[str, Any],
                                    assessment_history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate a comprehensive caregiver-facing assessment report."""
        scores = current_assessment.get('scores', {})
        overall = round(sum(scores.values()) / len(scores)) if scores else 0
        date_str = current_assessment.get('created_at', 'Today')

        history_text = "No prior assessments on record."
        if assessment_history and len(assessment_history) > 1:
            prev = assessment_history[-2]
            prev_scores = prev.get('scores', {})
            changes = {k: scores.get(k, 0) - prev_scores.get(k, 0) for k in scores}
            history_text = "Change since last assessment:\n" + "\n".join(
                f"- {self.DOMAIN_LABELS.get(k, k)}: {'+' if v >= 0 else ''}{v} points"
                for k, v in changes.items()
            )

        patient_info = patient_context.get('patient_info', {}) if patient_context else {}

        prompt = f"""Generate a comprehensive cognitive assessment report suitable for a caregiver to share with healthcare providers.

Patient: {patient_info.get('name', 'Patient')} | Age: {patient_info.get('age', '?')} | Condition: {patient_info.get('condition', 'Not specified')}
Assessment date: {date_str}

Current scores (0-100):
{chr(10).join(f'- {self.DOMAIN_LABELS.get(k, k)}: {v}/100' for k, v in scores.items())}
Overall: {overall}/100

{history_text}

Medications: {', '.join(m.get('name', '') for m in (patient_context or {}).get('all_medications', [])[:5]) or 'Not specified'}

Return a JSON object:
{{
  "report_title": "Cognitive Assessment Report — <date>",
  "executive_summary": "3-4 sentence professional summary suitable for a clinician",
  "current_status": {{
    "overall_band": "normal|mild_concern|moderate_concern|significant_concern",
    "overall_score": {overall},
    "key_findings": ["3-5 bullet-point findings"],
    "compared_to_last": "brief comparison to previous assessment or 'first assessment'"
  }},
  "domain_analysis": {{
    "<domain_key>": {{
      "score": <int>,
      "band": "normal|mild_concern|moderate_concern|significant_concern",
      "clinical_note": "1-2 sentence professional observation"
    }}
  }},
  "recommendations": {{
    "immediate": ["actions to take this week"],
    "short_term": ["actions over next 1-3 months"],
    "clinical_referral": "recommendation on whether/when to seek formal clinical assessment"
  }},
  "next_assessment": "recommended timeframe for next screening",
  "disclaimer": "This report is generated from a digital screening tool and does not constitute a clinical diagnosis."
}}"""

        try:
            response = self.ask(prompt, self.system_prompt)
            import json, re
            match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', response)
            return json.loads(match.group(1) if match else response)
        except Exception as e:
            logger.error(f"AssessmentAgent.generate_assessment_report error: {e}")
            return {"report_title": "Assessment Report", "error": str(e)}

    # ------------------------------------------------------------------ #
    #  Caregiver strategy insights (combines all data sources)            #
    # ------------------------------------------------------------------ #

    def generate_caregiver_insights(self, patient_context: Dict[str, Any],
                                     assessment_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Combine assessment history, game data, mood, medications, notes into actionable caregiver insights."""
        patient_info = patient_context.get('patient_info', {}) if patient_context else {}
        game_data = patient_context.get('complete_game_data', {}) if patient_context else {}
        mood_entries = (patient_context.get('all_mood_entries') or [])[-7:]
        medications = (patient_context.get('all_medications') or [])[:5]
        notes = (patient_context.get('all_notes') or [])[-5:]

        assessment_summary = "No assessments on record."
        if assessment_history:
            latest = assessment_history[-1]
            scores = latest.get('scores', {})
            assessment_summary = f"Latest assessment ({latest.get('created_at', 'unknown')}): " + \
                ", ".join(f"{self.DOMAIN_LABELS.get(k, k)}: {v}/100" for k, v in scores.items())

        mood_summary = "No mood data."
        if mood_entries:
            avg_mood = sum(m.get('mood_rating', 5) for m in mood_entries) / len(mood_entries)
            avg_energy = sum(m.get('energy_level', 5) for m in mood_entries) / len(mood_entries)
            mood_summary = f"7-day averages — Mood: {avg_mood:.1f}/10, Energy: {avg_energy:.1f}/10"

        prompt = f"""Provide comprehensive caregiver insights by synthesising all available patient data.

Patient: {patient_info.get('name', 'Patient')}, age {patient_info.get('age', '?')}, condition: {patient_info.get('condition', 'Not specified')}

Cognitive assessments: {assessment_summary}

Game performance: {f"Total sessions: {game_data.get('total_sessions', 0)}, Games: {', '.join(game_data.get('games_played', []))}" if game_data else 'No data'}

Mood/wellbeing: {mood_summary}

Current medications: {', '.join(m.get('name', '') for m in medications) or 'None listed'}

Recent caregiver notes: {' | '.join(f"{n.get('date', '')}: {n.get('content', '')[:80]}" for n in notes) or 'None'}

Return a JSON object:
{{
  "snapshot": "3-4 sentence holistic overview of the patient's current state",
  "cognitive_status": "brief assessment status based on latest scores",
  "behavioural_patterns": ["observed patterns from mood/game/note data"],
  "caregiver_strategies": [
    {{
      "strategy": "strategy name",
      "rationale": "why this is relevant for this patient",
      "how_to": "step-by-step or practical instructions",
      "frequency": "how often to apply"
    }}
  ],
  "communication_tips": ["specific tips for communicating with this patient today"],
  "red_flags": ["signs to watch for that should prompt medical attention"],
  "self_care_reminder": "brief compassionate reminder for the caregiver's own wellbeing",
  "this_week_priorities": ["top 3 actionable priorities for this week"]
}}"""

        try:
            response = self.ask(prompt, self.system_prompt)
            import json, re
            match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', response)
            return json.loads(match.group(1) if match else response)
        except Exception as e:
            logger.error(f"AssessmentAgent.generate_caregiver_insights error: {e}")
            return {"snapshot": "Unable to generate insights at this time.", "error": str(e)}


# Singleton instances
_game_agent = None
_therapy_agent = None
_caregiver_agent = None
_assessment_agent = None

def get_game_agent(provider_name: str = None) -> GameAgent:
    """Get the singleton game agent instance"""
    global _game_agent
    if _game_agent is None:
        _game_agent = GameAgent(provider_name)
    return _game_agent

def get_therapy_agent(provider_name: str = None) -> TherapyAgent:
    """Get the singleton therapy agent instance"""
    global _therapy_agent
    if _therapy_agent is None:
        _therapy_agent = TherapyAgent(provider_name)
    return _therapy_agent

def get_caregiver_agent(provider_name: str = None) -> CaregiverAgent:
    """Get the singleton caregiver agent instance"""
    global _caregiver_agent
    if _caregiver_agent is None:
        _caregiver_agent = CaregiverAgent(provider_name)
    return _caregiver_agent

def get_assessment_agent(provider_name: str = None) -> AssessmentAgent:
    """Get the singleton assessment agent instance"""
    global _assessment_agent
    if _assessment_agent is None:
        _assessment_agent = AssessmentAgent(provider_name)
    return _assessment_agent 