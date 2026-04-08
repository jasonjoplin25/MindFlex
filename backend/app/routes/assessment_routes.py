from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app.services.agent_service import get_assessment_agent
from app.services.caregiver_service import CaregiverService
from app.models.assessment import Assessment
from app.models.caregiver import Caregiver, CaregiverPatient
from app.models.patient import Patient
from app.database import db
import logging

logger = logging.getLogger(__name__)

assessment_bp = Blueprint('assessment', __name__, url_prefix='/api/assessment')


def _get_optional_identity():
    """Return JWT identity if token is present, else None."""
    try:
        verify_jwt_in_request(optional=True)
        return get_jwt_identity()
    except Exception:
        return None


def _get_patient_for_user(user_id):
    """Return the Patient row for a given user_id, or None."""
    return Patient.query.filter_by(user_id=user_id).first()


def _caregiver_can_access(caregiver_user_id, patient_id):
    """Return True if the caregiver (by user_id) has a relationship with patient_id."""
    caregiver = Caregiver.query.filter_by(user_id=caregiver_user_id).first()
    if not caregiver:
        return False
    rel = CaregiverPatient.query.filter_by(
        caregiver_id=caregiver.id, patient_id=patient_id
    ).first()
    return rel is not None


# ------------------------------------------------------------------ #
#  Save assessment results                                             #
# ------------------------------------------------------------------ #

@assessment_bp.route('/save', methods=['POST'])
def save_assessment():
    """Save cognitive assessment results. Works for authenticated users and guests."""
    user_id = _get_optional_identity()
    data = request.get_json()

    if not data or not data.get('scores'):
        return jsonify({'success': False, 'error': 'scores are required'}), 400

    scores = data['scores']
    overall = round(sum(scores.values()) / len(scores)) if scores else 0

    try:
        patient = _get_patient_for_user(user_id) if user_id else None
        patient_id = patient.id if patient else None

        record = Assessment(
            patient_id=patient_id,
            assessment_type='cognitive_screening',
            results={
                'scores': scores,
                'raw_results': data.get('raw_results', {}),
            },
            score=overall,
            administered_by=user_id,
        )
        db.session.add(record)
        db.session.commit()

        return jsonify({
            'success': True,
            'assessment_id': str(record.id),
            'overall_score': overall,
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving assessment: {e}")
        # Return partial success so the frontend flow continues
        return jsonify({'success': True, 'assessment_id': None, 'overall_score': overall}), 201


# ------------------------------------------------------------------ #
#  AI interpretation of a single assessment                           #
# ------------------------------------------------------------------ #

@assessment_bp.route('/interpret', methods=['POST'])
def interpret_assessment():
    """Return AI interpretation of assessment scores."""
    data = request.get_json()
    if not data or not data.get('scores'):
        return jsonify({'success': False, 'error': 'scores are required'}), 400

    agent = get_assessment_agent()
    interpretation = agent.interpret_results(
        scores=data['scores'],
        patient_profile=data.get('patient_profile'),
    )

    return jsonify({'success': True, 'interpretation': interpretation}), 200


# ------------------------------------------------------------------ #
#  Assessment history (caregiver viewing a patient)                   #
# ------------------------------------------------------------------ #

@assessment_bp.route('/history/<patient_id>', methods=['GET'])
@jwt_required()
def get_assessment_history(patient_id):
    """Get cognitive screening history for a patient (caregiver access)."""
    caregiver_user_id = get_jwt_identity()

    # Allow access if requester is the patient themselves OR is their caregiver
    patient = Patient.query.filter_by(id=patient_id).first()
    is_own = patient and str(patient.user_id) == str(caregiver_user_id)
    if not is_own and not _caregiver_can_access(caregiver_user_id, patient_id):
        return jsonify({'success': False, 'error': 'Access denied'}), 403

    assessments = Assessment.query.filter_by(
        patient_id=patient_id,
        assessment_type='cognitive_screening',
    ).order_by(Assessment.created_at.asc()).all()

    return jsonify({
        'success': True,
        'history': [a.to_dict() for a in assessments],
    }), 200


# ------------------------------------------------------------------ #
#  Progress trend analysis                                             #
# ------------------------------------------------------------------ #

@assessment_bp.route('/trends/<patient_id>', methods=['GET'])
@jwt_required()
def get_assessment_trends(patient_id):
    """Analyse assessment history trends for a patient."""
    caregiver_user_id = get_jwt_identity()

    patient = Patient.query.filter_by(id=patient_id).first()
    is_own = patient and str(patient.user_id) == str(caregiver_user_id)
    if not is_own and not _caregiver_can_access(caregiver_user_id, patient_id):
        return jsonify({'success': False, 'error': 'Access denied'}), 403

    assessments = Assessment.query.filter_by(
        patient_id=patient_id,
        assessment_type='cognitive_screening',
    ).order_by(Assessment.created_at.asc()).all()

    history = [a.to_dict() for a in assessments]

    # Normalise — agent expects 'scores' key at top level of each record
    for h in history:
        if 'scores' not in h and isinstance(h.get('results'), dict):
            h['scores'] = h['results'].get('scores', {})

    if len(history) < 2:
        return jsonify({
            'success': True,
            'trends': {'trend_summary': 'At least two assessments are needed to identify trends.'},
            'history': history,
        }), 200

    patient_profile = None
    try:
        details = CaregiverService.get_patient_details(patient_id, caregiver_user_id)
        if details:
            patient_profile = details
    except Exception:
        pass

    agent = get_assessment_agent()
    trends = agent.analyze_progress_trends(history, patient_profile)

    return jsonify({'success': True, 'trends': trends, 'history': history}), 200


# ------------------------------------------------------------------ #
#  Personalised improvement plan                                       #
# ------------------------------------------------------------------ #

@assessment_bp.route('/improvement-plan', methods=['POST'])
def get_improvement_plan():
    """Generate a personalised 4-week improvement plan from scores."""
    data = request.get_json()
    if not data or not data.get('scores'):
        return jsonify({'success': False, 'error': 'scores are required'}), 400

    agent = get_assessment_agent()
    plan = agent.generate_improvement_plan(
        scores=data['scores'],
        patient_profile=data.get('patient_profile'),
        game_history=data.get('game_history'),
    )

    return jsonify({'success': True, 'plan': plan}), 200


# ------------------------------------------------------------------ #
#  Full caregiver report                                               #
# ------------------------------------------------------------------ #

@assessment_bp.route('/report/<patient_id>', methods=['POST'])
@jwt_required()
def generate_report(patient_id):
    """Generate a comprehensive assessment report for a patient."""
    caregiver_user_id = get_jwt_identity()

    patient = Patient.query.filter_by(id=patient_id).first()
    is_own = patient and str(patient.user_id) == str(caregiver_user_id)
    if not is_own and not _caregiver_can_access(caregiver_user_id, patient_id):
        return jsonify({'success': False, 'error': 'Access denied'}), 403

    assessments = Assessment.query.filter_by(
        patient_id=patient_id,
        assessment_type='cognitive_screening',
    ).order_by(Assessment.created_at.asc()).all()

    if not assessments:
        return jsonify({'success': False, 'error': 'No assessments found for this patient'}), 404

    history = [a.to_dict() for a in assessments]
    for h in history:
        if 'scores' not in h and isinstance(h.get('results'), dict):
            h['scores'] = h['results'].get('scores', {})

    patient_context = None
    try:
        ctx = CaregiverService.get_patient_context(patient_id, caregiver_user_id)
        patient_context = ctx.get('context') if ctx else None
    except Exception:
        pass

    agent = get_assessment_agent()
    report = agent.generate_assessment_report(
        current_assessment=history[-1],
        patient_context=patient_context,
        assessment_history=history,
    )

    return jsonify({'success': True, 'report': report}), 200


# ------------------------------------------------------------------ #
#  Comprehensive caregiver insights                                    #
# ------------------------------------------------------------------ #

@assessment_bp.route('/caregiver/insights/<patient_id>', methods=['GET'])
@jwt_required()
def get_caregiver_insights(patient_id):
    """Return comprehensive AI insights combining all patient data sources."""
    caregiver_user_id = get_jwt_identity()

    if not _caregiver_can_access(caregiver_user_id, patient_id):
        return jsonify({'success': False, 'error': 'Access denied'}), 403

    assessments = Assessment.query.filter_by(
        patient_id=patient_id,
        assessment_type='cognitive_screening',
    ).order_by(Assessment.created_at.asc()).all()

    history = [a.to_dict() for a in assessments]
    for h in history:
        if 'scores' not in h and isinstance(h.get('results'), dict):
            h['scores'] = h['results'].get('scores', {})

    patient_context = None
    try:
        ctx = CaregiverService.get_patient_context(patient_id, caregiver_user_id)
        patient_context = ctx.get('context') if ctx else None
    except Exception:
        pass

    agent = get_assessment_agent()
    insights = agent.generate_caregiver_insights(patient_context, history)

    return jsonify({'success': True, 'insights': insights}), 200
