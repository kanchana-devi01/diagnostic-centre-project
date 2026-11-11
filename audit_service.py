from models.db import db
from datetime import datetime
import uuid

def log_audit_action(user_email, action, old_value=None, new_value=None):
    try:
        log_id = str(uuid.uuid4())
        log_ref = db.collection("audit_logs").document(log_id)
        log_ref.set({
            "id": log_id,
            "user": user_email or "system",
            "action": action,
            "timestamp": datetime.utcnow().isoformat(),
            "old_value": old_value,
            "new_value": new_value
        })
        print(f"Audit log recorded: {action} by {user_email or 'system'}")
    except Exception as e:
        print(f"Error logging audit action: {e}")
