from models.db import db
import uuid

def seed_test_catalog():
    try:
        tests_ref = db.collection("master_templates")
        docs = list(tests_ref.limit(1).stream())
        if len(docs) > 0:
            print("Master templates already seeded.")
            return
            
        print("Seeding master templates in Firestore...")
        default_templates = [
            {
                "templateId": "cbc",
                "templateName": "Complete Blood Count (CBC)",
                "category": "Hematology",
                "parameters": [
                    {
                        "name": "Haemoglobin (HB)",
                        "method": "WB/Automated",
                        "unit": "g/dL",
                        "referenceRange": "11.0 - 14.0"
                    },
                    {
                        "name": "RBC (Red Blood Cell Count)",
                        "method": "WB/Automated",
                        "unit": "Million/cmm",
                        "referenceRange": "4.0 - 5.9"
                    },
                    {
                        "name": "WBC (Total Leucocyte Count)",
                        "method": "WB/Automated",
                        "unit": "cells/cmm",
                        "referenceRange": "4000 - 11000"
                    },
                    {
                        "name": "Platelet Count",
                        "method": "WB/Automated",
                        "unit": "Lakhs/cmm",
                        "referenceRange": "1.5 - 4.5"
                    }
                ]
            },
            {
                "templateId": "lipid_profile",
                "templateName": "Lipid Profile",
                "category": "Biochemistry",
                "parameters": [
                    {
                        "name": "S. Cholesterol",
                        "method": "Spectrophotometry",
                        "unit": "mg/dL",
                        "referenceRange": "130 - 200"
                    },
                    {
                        "name": "Triglycerides",
                        "method": "Spectrophotometry",
                        "unit": "mg/dL",
                        "referenceRange": "60 - 150"
                    },
                    {
                        "name": "HDL Cholesterol",
                        "method": "Spectrophotometry",
                        "unit": "mg/dL",
                        "referenceRange": "40 - 60"
                    },
                    {
                        "name": "LDL Cholesterol",
                        "method": "Calculated",
                        "unit": "mg/dL",
                        "referenceRange": "0 - 100"
                    }
                ]
            }
        ]
        
        for t in default_templates:
            # Setting doc id to templateId
            tests_ref.document(t["templateId"]).set(t)
        print("Seeded master templates successfully.")
    except Exception as e:
        print(f"Error seeding master templates: {e}")

def get_test_catalog():
    try:
        tests_ref = db.collection("master_templates")
        docs = tests_ref.stream()
        catalog = []
        for d in docs:
            t = d.to_dict()
            if 'name' not in t and 'templateName' in t:
                t['name'] = t['templateName']
            if 'id' not in t and 'templateId' in t:
                t['id'] = t['templateId']
            catalog.append(t)
        return catalog, 200
    except Exception as e:
        return {"error": str(e)}, 500

def add_or_update_catalog_test(test_data):
    try:
        # Standardize ID
        template_id = test_data.get("templateId") or test_data.get("id") or str(uuid.uuid4())[:8]
        test_data["templateId"] = template_id
        
        # Make sure id is also set for backwards compatibility with some frontend lists if they use .id
        test_data["id"] = template_id
        if "name" not in test_data and "templateName" in test_data:
            test_data["name"] = test_data["templateName"]
        elif "templateName" not in test_data and "name" in test_data:
            test_data["templateName"] = test_data["name"]
            
        db.collection("master_templates").document(template_id).set(test_data)
        return {"message": "Master template saved successfully", "templateId": template_id}, 200
    except Exception as e:
        return {"error": str(e)}, 500
