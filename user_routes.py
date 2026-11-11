from flask import Blueprint, request, jsonify
from services.user_service import (
    get_all_admins, create_admin, update_admin, 
    toggle_admin_status, reset_admin_password
)

user_bp = Blueprint('user', __name__)

@user_bp.route('/', methods=['GET'], strict_slashes=False)
def list_admins():
    # In a real app, require Super Admin token
    admins = get_all_admins()
    return jsonify(admins), 200

@user_bp.route('/', methods=['POST'], strict_slashes=False)
def add_admin():
    data = request.get_json()
    # In a real app, extract creator_id from token
    creator_id = "super_admin_id" 
    response, status = create_admin(data, creator_id)
    return jsonify(response), status

@user_bp.route('/<uid>', methods=['PUT'], strict_slashes=False)
def edit_admin(uid):
    data = request.get_json()
    updater_id = "super_admin_id"
    response, status = update_admin(uid, data, updater_id)
    return jsonify(response), status

@user_bp.route('/<uid>/status', methods=['PUT'], strict_slashes=False)
def change_status(uid):
    data = request.get_json()
    is_active = data.get('isActive', True)
    updater_id = "super_admin_id"
    response, status = toggle_admin_status(uid, is_active, updater_id)
    return jsonify(response), status

@user_bp.route('/<uid>/reset-password', methods=['PUT'], strict_slashes=False)
def reset_password(uid):
    data = request.get_json()
    new_password = data.get('password')
    updater_id = "super_admin_id"
    response, status = reset_admin_password(uid, new_password, updater_id)
    return jsonify(response), status
