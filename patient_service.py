import json
import os
import uuid
from datetime import date, datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_FILE = os.path.join(BASE_DIR, 'patients.json')

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _calculate_age_from_dob(dob_str):
    """Calculate age in years from a DOB string (YYYY-MM-DD). Returns int or None."""
    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
        today = date.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return max(0, age)
    except Exception:
        return None

def _get_demographic_key(age, gender):
    """Return the best-matching reference-range key for a patient's demographics."""
    gender = (gender or "").lower()
    if age is None:
        return "default"
    if age < 18:
        return "child"
    if gender == "female":
        return "female"
    return "male"

def _build_reference_range_str(param, demographic_key):
    """Format the reference range from a catalog parameter dict."""
    ranges = param.get("reference_ranges", {})
    r = ranges.get(demographic_key) or ranges.get("default") or {}
    if r.get("display"):
        return r["display"]
    mn = r.get("min")
    mx = r.get("max")
    if mn is not None and mx is not None:
        return f"{mn} - {mx}"
    return ""

def _build_test_rows_from_catalog(catalog_test, demographic_key):
    """
    Build the result rows list for a test from a catalog template.
    Returns a list of row dicts (section + parameter rows) compatible with EnterResults.
    """
    rows = [{"type": "section", "title": catalog_test.get("name", catalog_test.get("templateName", "")).upper()}]
    for param in catalog_test.get("parameters", []):
        rows.append({
            "id": str(uuid.uuid4()),
            "type": "parameter",
            "name": param.get("name", ""),
            "method": param.get("method", param.get("default_method", "")),
            "result": "",
            "unit": param.get("unit", ""),
            "range": param.get("referenceRange", _build_reference_range_str(param, demographic_key)),
        })
    return rows

# ---------------------------------------------------------------------------
# Persistence helpers
# ---------------------------------------------------------------------------

def get_patients_data():
    if not os.path.exists(DB_FILE):
        return []
    try:
        with open(DB_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return []

def save_patients(patients):
    with open(DB_FILE, 'w') as f:
        json.dump(patients, f, indent=2)

# ---------------------------------------------------------------------------
# Patient CRUD
# ---------------------------------------------------------------------------

def add_patient(data):
    if not data:
        return {"error": "No data provided"}, 400

    name    = data.get('name')
    contact = data.get('contact')
    gender  = data.get('gender', 'Male')
    dob_str = data.get('dob')          # preferred: YYYY-MM-DD
    age_raw = data.get('age')           # fallback numeric age

    # Resolve age
    computed_age = None
    if dob_str:
        computed_age = _calculate_age_from_dob(dob_str)
    if computed_age is None and age_raw is not None:
        try:
            computed_age = int(age_raw)
        except (TypeError, ValueError):
            pass

    if not name or not contact:
        return {"error": "Name and contact are required"}, 400
    if computed_age is None:
        return {"error": "Either a valid Date of Birth (YYYY-MM-DD) or Age is required"}, 400

    patients = get_patients_data()

    # Generate patient_uid (SR1001, SR1002, …)
    last_id_num = 1000
    if patients:
        uids = [p.get('patient_uid', 'SR1000') for p in patients]
        nums = [int(u.replace('SR', '')) for u in uids if u.startswith('SR') and u[2:].isdigit()]
        if nums:
            last_id_num = max(nums)
    patient_uid = f"SR{last_id_num + 1}"
    patient_id  = str(uuid.uuid4())

    # Resolve assigned tests
    assigned_tests_raw = data.get('assigned_tests', [])
    if isinstance(assigned_tests_raw, str):
        assigned_tests_raw = [t.strip() for t in assigned_tests_raw.split(',') if t.strip()]

    demographic_key = _get_demographic_key(computed_age, gender)

    # Try to enrich tests from the catalog if catalog service is available
    tests = []
    try:
        from services.catalog_service import get_test_catalog
        catalog, _ = get_test_catalog()
        catalog_by_name = {t.get('name', t.get('templateName', '')).lower(): t for t in catalog if isinstance(t, dict)}

        for test_name in assigned_tests_raw:
            cat_entry = catalog_by_name.get(test_name.strip().lower())
            if cat_entry:
                tests.append({
                    "id": str(uuid.uuid4()),
                    "name": cat_entry.get('name', cat_entry.get('templateName', '')),
                    "catalog_id": cat_entry.get('id', cat_entry.get('templateId')),
                    "status": "pending",
                    "result": None,
                    "template_rows": _build_test_rows_from_catalog(cat_entry, demographic_key),
                })
            else:
                tests.append({
                    "id": str(uuid.uuid4()),
                    "name": test_name.strip(),
                    "catalog_id": None,
                    "status": "pending",
                    "result": None,
                    "template_rows": [],
                })
    except Exception as e:
        print(f"[patient_service] catalog enrichment failed: {e}")
        tests = [
            {"id": str(uuid.uuid4()), "name": t.strip(), "catalog_id": None,
             "status": "pending", "result": None, "template_rows": []}
            for t in assigned_tests_raw
        ]

    patients.append({
        "id":          patient_id,
        "patient_uid": patient_uid,
        "name":        name,
        "dob":         dob_str or "",
        "age":         computed_age,
        "gender":      gender,
        "contact":     contact,
        "photo_url":   f"https://ui-avatars.com/api/?name={name}&background=random",
        "registered_at": datetime.now().isoformat(),
        "total_bills": 0,
        "reports":     [],
        "tests":       tests,
        "vitals": {
            "temp":   "",
            "bp":     "",
            "pulse":  "",
            "weight": ""
        }
    })

    save_patients(patients)
    return {
        "message":    f"Patient {name} added successfully!",
        "patient_id": patient_id,
        "patient_uid": patient_uid
    }, 201

def get_patients():
    return get_patients_data(), 200

def update_patient(patient_id, data):
    patients = get_patients_data()
    for patient in patients:
        if str(patient['id']) == str(patient_id):
            patient['name']    = data.get('name',    patient.get('name', ''))
            patient['contact'] = data.get('contact', patient.get('contact', ''))
            patient['gender']  = data.get('gender',  patient.get('gender', 'Male'))
            patient['vitals']  = data.get('vitals',  patient.get('vitals', {}))

            # Support updating age via dob or direct age
            if data.get('dob'):
                age = _calculate_age_from_dob(data['dob'])
                if age is not None:
                    patient['dob'] = data['dob']
                    patient['age'] = age
            elif data.get('age') is not None:
                try:
                    patient['age'] = int(data['age'])
                except (TypeError, ValueError):
                    pass

            save_patients(patients)
            return {"message": "Patient updated successfully"}, 200
    return {"error": "Patient not found"}, 404

def update_test_result(patient_id, test_id, result_data):
    patients = get_patients_data()
    for patient in patients:
        if str(patient['id']) == str(patient_id):
            for test in patient.get('tests', []):
                if str(test['id']) == str(test_id):
                    test['result'] = result_data
                    test['status'] = "Result Entered"
                    save_patients(patients)
                    return {"message": "Test result updated successfully"}, 200
    return {"error": "Patient or test not found"}, 404

def update_test_status(patient_id, test_id, new_status):
    patients = get_patients_data()
    for patient in patients:
        if str(patient['id']) == str(patient_id):
            for test in patient.get('tests', []):
                if str(test['id']) == str(test_id):
                    test['status'] = new_status
                    save_patients(patients)
                    return {"message": f"Test status updated to {new_status}"}, 200
    return {"error": "Patient or test not found"}, 404

# ---------------------------------------------------------------------------
# Test name suggestions (from patients + catalog)
# ---------------------------------------------------------------------------

def get_all_test_names():
    """Return a sorted unique list of test names from the catalog + existing patients."""
    test_names_map = {}

    # 1) Pull from master catalog first (preferred)
    try:
        from services.catalog_service import get_test_catalog
        catalog, _ = get_test_catalog()
        for t in catalog:
            if isinstance(t, dict) and t.get('name'):
                cleaned = t['name'].strip()
                test_names_map[cleaned.lower()] = cleaned
    except Exception as e:
        print(f"[patient_service] catalog fetch failed: {e}")

    # 2) Also include any ad-hoc tests stored in patients
    for patient in get_patients_data():
        for test in patient.get('tests', []):
            name = test.get('name')
            if name:
                cleaned = name.strip()
                if cleaned.lower() not in test_names_map:
                    test_names_map[cleaned.lower()] = cleaned

    sorted_names = [test_names_map[k] for k in sorted(test_names_map.keys())]
    return sorted_names, 200

# ---------------------------------------------------------------------------
# Assign test to existing patient (catalog-aware)
# ---------------------------------------------------------------------------

def assign_test_to_patient(patient_id, test_name, catalog_id=None):
    if not test_name:
        return {"error": "Test name is required"}, 400

    patients = get_patients_data()
    for patient in patients:
        if str(patient['id']) == str(patient_id):
            demographic_key = _get_demographic_key(patient.get('age'), patient.get('gender'))

            template_rows = []
            resolved_name = test_name.strip()
            resolved_catalog_id = catalog_id

            # Enrich from catalog
            try:
                from services.catalog_service import get_test_catalog
                catalog, _ = get_test_catalog()
                cat_entry = None
                if catalog_id:
                    cat_entry = next((t for t in catalog if t.get('id') == catalog_id), None)
                if not cat_entry:
                    cat_entry = next(
                        (t for t in catalog if t.get('name', '').lower() == test_name.strip().lower()),
                        None
                    )
                if cat_entry:
                    resolved_name        = cat_entry['name']
                    resolved_catalog_id  = cat_entry.get('id')
                    template_rows        = _build_test_rows_from_catalog(cat_entry, demographic_key)
            except Exception as e:
                print(f"[patient_service] catalog enrich on assign failed: {e}")

            new_test = {
                "id":         str(uuid.uuid4()),
                "name":       resolved_name,
                "catalog_id": resolved_catalog_id,
                "status":     "pending",
                "result":     None,
                "template_rows": template_rows,
            }
            if 'tests' not in patient or not isinstance(patient['tests'], list):
                patient['tests'] = []
            patient['tests'].append(new_test)
            save_patients(patients)
            return {"message": f"Test '{resolved_name}' assigned successfully", "test": new_test}, 200

    return {"error": "Patient not found"}, 404
