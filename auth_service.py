from werkzeug.security import generate_password_hash, check_password_hash
from services.user_service import get_all_admins, MOCK_AUTH_FILE, _get_mock_users, create_admin
import json
import os
import firebase_admin
from firebase_admin import auth

SUPER_ADMIN_EMAIL = "superadminsairamlab@gmail.com"
SUPER_ADMIN_PASSWORD = "superadmin__123"

def _ensure_super_admin():
    users = _get_mock_users()
    existing = next((u for u in users if u.get('role') == 'super_admin' or u.get('email') == SUPER_ADMIN_EMAIL), None)
    if not existing:
        # Create a hardcoded super admin in mock auth if it doesn't exist
        mock_users = users
        mock_users.append({
            "uid": "super_admin_id",
            "email": SUPER_ADMIN_EMAIL,
            "password": generate_password_hash(SUPER_ADMIN_PASSWORD),
            "name": "Sairam Lab Super Admin",
            "role": "super_admin",
            "disabled": False
        })
        with open(MOCK_AUTH_FILE, 'w') as f:
            json.dump(mock_users, f, indent=2)

def login_user(data):
    if not data:
        return {"error": "No data provided"}, 400
        
    email = data.get('email')
    password = data.get('password')
    
    _ensure_super_admin()
    
    # Check mock users first for local auth fallback
    mock_users = _get_mock_users()
    user = next((u for u in mock_users if u['email'] == email), None)
    
    if user and check_password_hash(user['password'], password):
        if user.get('disabled', False):
            return {"error": "Account is disabled. Contact super admin."}, 403
            
        role = user.get("role", "admin")
        return {"message": "Login successful", "token": "dummy_jwt_token", "user": {"email": email, "name": user.get("name"), "role": role, "uid": user.get("uid")}}, 200
        
    # If not in mock, it could be in real Firebase Auth, but we don't have password validation locally without custom tokens
    # For now, if mock auth fails and Firebase Auth is supposed to be used:
    return {"error": "Invalid email or password"}, 401

def register_user(data):
    # This was previously used for admin registration. We route it through user_service now.
    return create_admin(data, "system")
