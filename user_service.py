from models.db import db
import firebase_admin
from firebase_admin import auth
from datetime import datetime
import uuid
import json
import os
from werkzeug.security import generate_password_hash, check_password_hash
from services.audit_service import log_audit_action

# Fallback for mock auth
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOCK_AUTH_FILE = os.path.join(BASE_DIR, 'mock_auth.json')

def _is_mock_mode():
    try:
        # Check if auth works
        if not firebase_admin._apps: return True
        return False # Assuming if apps exist, auth is available (might still fail, caught below)
    except:
        return True

def _get_mock_users():
    if not os.path.exists(MOCK_AUTH_FILE): return []
    with open(MOCK_AUTH_FILE, 'r') as f:
        return json.load(f)

def _save_mock_users(users):
    with open(MOCK_AUTH_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def get_all_admins():
    users_ref = db.collection('users')
    try:
        docs = users_ref.stream()
        return [doc.to_dict() for doc in docs if doc.to_dict().get('role') == 'admin']
    except Exception as e:
        print(f"Error fetching admins: {e}")
        return []

def create_admin(data, creator_id="super_admin_id"):
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    phone = data.get('phone', '')
    
    if not email or not password:
        return {"error": "Email and password are required"}, 400
        
    try:
        # Try Firebase Auth
        user_record = auth.create_user(
            email=email,
            password=password,
            display_name=name,
            phone_number=phone if phone else None
        )
        uid = user_record.uid
    except Exception as e:
        print(f"Firebase Auth failed, using mock auth. Error: {e}")
        # Mock auth fallback
        mock_users = _get_mock_users()
        if any(u['email'] == email for u in mock_users):
            return {"error": "Email already exists"}, 409
            
        uid = str(uuid.uuid4())
        mock_users.append({
            "uid": uid,
            "email": email,
            "password": generate_password_hash(password),
            "name": name,
            "disabled": False
        })
        _save_mock_users(mock_users)
        
    # Save to Firestore
    user_data = {
        "id": uid,
        "name": name,
        "email": email,
        "phone": phone,
        "role": "admin",
        "isActive": True,
        "createdBy": creator_id,
        "createdAt": datetime.utcnow().isoformat()
    }
    
    db.collection('users').document(uid).set(user_data)
    log_audit_action(creator_id, f"Created Admin user: {email} ({uid})")
    
    return {"message": "Admin created successfully", "user": user_data}, 201

def update_admin(uid, data, updater_id="super_admin_id"):
    try:
        updates = {}
        if 'name' in data: updates['name'] = data['name']
        if 'phone' in data: updates['phone'] = data['phone']
        if 'email' in data: updates['email'] = data['email']
        
        if not updates:
            return {"error": "No data to update"}, 400
            
        # Update Firebase Auth if email/name changed
        auth_updates = {}
        if 'email' in updates: auth_updates['email'] = updates['email']
        if 'name' in updates: auth_updates['display_name'] = updates['name']
        if 'phone' in updates and updates['phone']: auth_updates['phone_number'] = updates['phone']
        
        if auth_updates:
            try:
                auth.update_user(uid, **auth_updates)
            except Exception as e:
                print(f"Firebase Auth update failed, using mock. Error: {e}")
                mock_users = _get_mock_users()
                for u in mock_users:
                    if u['uid'] == uid:
                        if 'email' in auth_updates: u['email'] = auth_updates['email']
                        if 'display_name' in auth_updates: u['name'] = auth_updates['display_name']
                        break
                _save_mock_users(mock_users)
        
        # Update Firestore
        db.collection('users').document(uid).update(updates)
        log_audit_action(updater_id, f"Updated Admin user: {uid}")
        
        return {"message": "Admin updated successfully"}, 200
    except Exception as e:
        return {"error": str(e)}, 500

def toggle_admin_status(uid, is_active, updater_id="super_admin_id"):
    try:
        # Update Firebase Auth
        try:
            auth.update_user(uid, disabled=not is_active)
        except Exception as e:
            print(f"Firebase Auth toggle failed, using mock. Error: {e}")
            mock_users = _get_mock_users()
            for u in mock_users:
                if u['uid'] == uid:
                    u['disabled'] = not is_active
                    break
            _save_mock_users(mock_users)
            
        # Update Firestore
        db.collection('users').document(uid).update({"isActive": is_active})
        action = "Enabled" if is_active else "Disabled"
        log_audit_action(updater_id, f"{action} Admin user: {uid}")
        
        return {"message": f"Admin {'enabled' if is_active else 'disabled'} successfully"}, 200
    except Exception as e:
        return {"error": str(e)}, 500

def reset_admin_password(uid, new_password, updater_id="super_admin_id"):
    try:
        if not new_password:
            return {"error": "New password is required"}, 400
            
        # Update Firebase Auth
        try:
            auth.update_user(uid, password=new_password)
        except Exception as e:
            print(f"Firebase Auth password reset failed, using mock. Error: {e}")
            mock_users = _get_mock_users()
            for u in mock_users:
                if u['uid'] == uid:
                    u['password'] = generate_password_hash(new_password)
                    break
            _save_mock_users(mock_users)
            
        log_audit_action(updater_id, f"Reset password for Admin user: {uid}")
        return {"message": "Password reset successfully"}, 200
    except Exception as e:
        return {"error": str(e)}, 500
