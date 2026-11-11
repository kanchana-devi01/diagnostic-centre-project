from flask import Blueprint, request, jsonify, send_from_directory, send_file
import os
from datetime import datetime
from services.report_service import upload_report_file, UPLOAD_FOLDER, generate_report_pdf
from services.patient_service import update_test_result, get_patients_data, save_patients, update_test_status
from services.audit_service import log_audit_action

report_bp = Blueprint('report', __name__)

@report_bp.route('/upload', methods=['POST'])
def upload():
    # Check if the post request has the file part
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    file = request.files['file']
    patient_id = request.form.get('patientId')
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    response, status = upload_report_file(file, patient_id)
    return jsonify(response), status

@report_bp.route('/download/<filename>', methods=['GET'], strict_slashes=False)
def download_file(filename):
    try:
        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)
    except Exception as e:
        return jsonify({"error": "File not found"}), 404

@report_bp.route('/result', methods=['POST'])
def update_result():
    data = request.get_json()
    patient_id = data.get('patient_id')
    test_id = data.get('test_id')
    result_data = data.get('result')
    
    if not patient_id or not test_id or not result_data:
        return jsonify({"error": "Missing required fields"}), 400
        
    response, status = update_test_result(patient_id, test_id, result_data)
    if status == 200:
        log_audit_action("system", f"Updated results for test ID {test_id} (Patient {patient_id})")
    return jsonify(response), status

@report_bp.route('/status', methods=['POST'])
def update_status():
    data = request.get_json()
    patient_id = data.get('patient_id')
    test_id = data.get('test_id')
    new_status = data.get('status')
    
    if not patient_id or not test_id or not new_status:
        return jsonify({"error": "Missing required fields"}), 400
        
    response, status = update_test_status(patient_id, test_id, new_status)
    if status == 200:
        log_audit_action("system", f"Updated status of test ID {test_id} to '{new_status}' (Patient {patient_id})")
    return jsonify(response), status


@report_bp.route('/vitals', methods=['POST'])
def update_vitals():
    data = request.get_json()
    patient_id = data.get('patient_id')
    vitals = data.get('vitals') # Object {temp, bp, pulse, weight}
    
    if not patient_id or not vitals:
        return jsonify({"error": "Missing patient_id or vitals"}), 400
        
    patients = get_patients_data()
    patient = next((p for p in patients if str(p['id']) == str(patient_id)), None)
    
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
        
    patient['vitals'] = vitals
    save_patients(patients)
    
    return jsonify({"message": "Vitals updated successfully"}), 200

@report_bp.route('/generate', methods=['POST'])
def generate_report():
    data = request.get_json()
    patient_id = data.get('patient_id')
    test_id = data.get('test_id')
    results = data.get('results') # List of {field, value, range}
    
    if not patient_id or not test_id or not results:
        return jsonify({"error": "Missing patient_id, test_id or results"}), 400
        
    # Get patient data
    patients = get_patients_data()
    patient = next((p for p in patients if str(p['id']) == str(patient_id)), None)
    
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
        
    test = next((t for t in patient.get('tests', []) if str(t['id']) == str(test_id)), None)
    if not test:
        return jsonify({"error": "Test not found"}), 404
        
    # Update test results in DB first
    update_test_result(patient_id, test_id, results)
    
    # Reload patients to get the updated one (or just use the one we have and update it)
    # Actually update_test_result saves to file. Let's just update our local copy.
    test['result'] = results
    test['status'] = "Result Entered"
    
    # Generate PDF
    filename, file_path = generate_report_pdf(patient, test['name'], results)
    
    # Update the report filename in patient's reports list
    # Remove any existing report for this specific test to ensure we always have the latest
    patient['reports'] = [r for r in patient.get('reports', []) if r.get('name') != test['name']]
    
    patient['reports'].append({
        "name": test['name'], 
        "filename": filename, 
        "date": datetime.now().strftime("%Y-%m-%d")
    })
    
    save_patients(patients)
    log_audit_action("system", f"Generated report for test '{test['name']}' (Patient {patient_id})")
    
    return jsonify({"message": "Report generated successfully", "filename": filename}), 200

from services.report_service import generate_summary_pdf

@report_bp.route('/summary', methods=['POST'])
def generate_summary():
    data = request.get_json()
    patient_id = data.get('patient_id')
    
    if not patient_id:
        return jsonify({"error": "Missing patient_id"}), 400
        
    patients = get_patients_data()
    patient = next((p for p in patients if str(p['id']) == str(patient_id)), None)
    
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
        
    filename, file_path = generate_summary_pdf(patient)
    return jsonify({"message": "Summary generated successfully", "filename": filename}), 200
