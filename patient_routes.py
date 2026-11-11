from flask import Blueprint, request, jsonify
from services.patient_service import (
    add_patient, get_patients, update_patient,
    get_all_test_names, assign_test_to_patient
)
from services.audit_service import log_audit_action

patient_bp = Blueprint('patient', __name__)

@patient_bp.route('/test-names', methods=['GET'], strict_slashes=False)
def get_test_names_route():
    try:
        response, status = get_all_test_names()
        return jsonify(response), status
    except Exception as e:
        print(f"Error in get_test_names_route: {e}")
        return jsonify({"error": str(e)}), 500

@patient_bp.route('', methods=['POST'], strict_slashes=False)
@patient_bp.route('/', methods=['POST'], strict_slashes=False)
def create_patient():
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
        
    # We can handle request.files['photo'] here if needed
    response, status = add_patient(data)
    if status == 201:
        log_audit_action("system", f"Added patient: {data.get('name')} ({response.get('patient_uid')})")
    return jsonify(response), status

@patient_bp.route('', methods=['GET'], strict_slashes=False)
@patient_bp.route('/', methods=['GET'], strict_slashes=False)
def list_patients():
    response, status = get_patients()
    return jsonify(response), status

@patient_bp.route('/<patient_id>/assign-test', methods=['POST'], strict_slashes=False)
def assign_test_route(patient_id):
    try:
        data = request.get_json() or {}
        test_name  = data.get('test_name')
        catalog_id = data.get('catalog_id')  # optional catalog reference
        response, status = assign_test_to_patient(patient_id, test_name, catalog_id)
        if status == 201:
            log_audit_action("system", f"Assigned test '{test_name}' to patient ID {patient_id}")
        return jsonify(response), status
    except Exception as e:
        print(f"Error in assign_test_route: {e}")
        return jsonify({"error": str(e)}), 500

@patient_bp.route('/<patient_id>', methods=['PUT'], strict_slashes=False)
def update_patient_route(patient_id):
    try:
        data = request.get_json()
        print(f"Updating patient {patient_id} with data: {data}")
        response, status = update_patient(patient_id, data)
        if status == 200:
            log_audit_action("system", f"Updated patient ID {patient_id}")
        return jsonify(response), status
    except Exception as e:
        print(f"Error in update_patient_route: {e}")
        return jsonify({"error": str(e)}), 500
