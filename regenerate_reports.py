import json
import os
import sys

# Add the parent directory to the path so we can import services
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.patient_service import get_patients_data, save_patients
from services.report_service import generate_report_pdf
from datetime import datetime

def regenerate_all_reports():
    patients = get_patients_data()
    updated_count = 0
    
    for patient in patients:
        reports_updated = False
        
        # Iterate over all tests to see if any are completed
        for test in patient.get('tests', []):
            if test.get('status') == 'completed' and test.get('result'):
                print(f"Regenerating report for patient {patient['name']} (Test: {test['name']})")
                
                # Regenerate the PDF using the new format
                filename, file_path = generate_report_pdf(patient, test['name'], test['result'])
                
                # Update the reports array in the patient object
                if 'reports' not in patient:
                    patient['reports'] = []
                    
                # Remove the old report entry for this test if it exists
                patient['reports'] = [r for r in patient['reports'] if r.get('name') != test['name']]
                
                # Append the newly generated report
                patient['reports'].append({
                    "name": test['name'], 
                    "filename": filename, 
                    "date": datetime.now().strftime("%Y-%m-%d")
                })
                reports_updated = True
                
        if reports_updated:
            updated_count += 1
            
    if updated_count > 0:
        save_patients(patients)
        print(f"\nSuccessfully regenerated and updated reports for {updated_count} patients.")
    else:
        print("\nNo completed reports found to regenerate.")

if __name__ == "__main__":
    regenerate_all_reports()
