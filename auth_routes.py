from flask import Blueprint, request, jsonify
from services.auth_service import login_user, register_user

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    response, status = login_user(data)
    return jsonify(response), status

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    response, status = register_user(data)
    return jsonify(response), status

@auth_bp.route('/register-admin', methods=['POST'])
def register_admin():
    # In a real app, we would verify the requester's token here
    data = request.get_json()
    data['role'] = 'admin' # Force role to admin
    response, status = register_user(data)
    return jsonify(response), status
