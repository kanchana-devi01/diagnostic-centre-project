import os
from werkzeug.utils import secure_filename
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import mm
from datetime import datetime

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Use absolute path to ensure logo is found
LOGO_PATH = r"C:\Users\acer\Documents\sairam diagnostic centre project\frontend\public\logo.png"

def generate_report_pdf(patient_data, test_name, results):
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"report_{patient_data['id']}_{timestamp}.pdf"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    
    c = canvas.Canvas(file_path, pagesize=A4)
    width, height = A4 # 595.27 x 841.89 points
    
    blue_color = colors.HexColor("#1e40af")
    # Very small margin equivalent to ~1px visual padding
    margin = 10
    
    # --- HEADER ---
    
    # Logo
    if os.path.exists(LOGO_PATH):
        try:
            # Draw logo on the far left with minimal margin
            c.drawImage(LOGO_PATH, margin, height - 110, width=80, height=80, preserveAspectRatio=True, mask='auto')
        except:
            pass
            
    # Contact Info (Top Right)
    c.setFillColor(blue_color)
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(width - margin, height - 35, "LandLine : 044-35623983")
    c.drawRightString(width - margin, height - 48, "Mobile : 9840104871")
    
    # Main Title (Centered)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width/2 + 20, height - 65, "SAIRAM DIAGNOSTIC CENTRE")
    
    # Subtitles
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(width/2 + 20, height - 82, "SAI RAM BLOOD TEST CENTRE")
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(width/2 + 20, height - 95, "(ECG ATTACHED)")
    
    c.setFont("Helvetica", 8)
    address = "10/1, Bajanai Koil 5th Street, Choolaimedu, Chennai - 600 094."
    c.drawCentredString(width/2 + 20, height - 108, address)
    
    # Blue Divider Line
    c.setStrokeColor(blue_color)
    c.setLineWidth(1.5)
    c.line(margin, height - 115, width - margin, height - 115)
    
    # --- PATIENT INFO ---
    c.setFillColor(colors.black)
    y = height - 140
    
    text_margin = margin + 5
    
    # Row 1
    c.setFont("Helvetica", 10)
    c.drawString(text_margin, y, "Name:")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(text_margin + 60, y, str(patient_data.get('name', '')).upper())
    
    c.setFont("Helvetica", 10)
    c.drawString(width - 240, y, "SID No:")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(width - 150, y, "03018056")
    
    y -= 18
    # Row 2
    c.setFont("Helvetica", 10)
    c.drawString(text_margin, y, "PID:")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(text_margin + 60, y, str(patient_data.get('patient_uid', '')))
    
    c.setFont("Helvetica", 10)
    c.drawString(width - 240, y, "Reg Date:")
    curr_time = datetime.now().strftime("%d/%m/%Y %I:%M:%S %p")
    c.drawString(width - 150, y, curr_time)
    
    y -= 18
    # Row 3
    c.setFont("Helvetica", 10)
    c.drawString(text_margin, y, "Age / Sex:")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(text_margin + 60, y, f"{patient_data.get('age', '')} Y / {patient_data.get('gender', '')}")
    
    c.setFont("Helvetica", 10)
    c.drawString(width - 240, y, "Coll Date:")
    c.drawString(width - 150, y, curr_time)
    
    y -= 18
    # Row 4
    c.setFont("Helvetica", 10)
    c.drawString(text_margin, y, "Referrer:")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(text_margin + 60, y, "SAI RAM DIAGNOSTIC CENTRE")
    
    c.setFont("Helvetica", 10)
    c.drawString(width - 240, y, "Report Date:")
    c.drawString(width - 150, y, curr_time)
    
    # --- TABLE TITLE ---
    y -= 35
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(width/2, y, "FINAL TEST REPORT")
    
    # --- TABLE HEADER ---
    y -= 30
    c.setStrokeColor(colors.black)
    c.setLineWidth(1)
    c.line(margin, y + 12, width - margin, y + 12)
    c.line(margin, y - 5, width - margin, y - 5)
    
    c.setFont("Helvetica-Bold", 9)
    c.drawString(text_margin, y, "INVESTIGATION / METHOD")
    c.drawCentredString(width/2 - 30, y, "RESULT")
    c.drawString(width - 200, y, "UNITS")
    c.drawString(width - 130, y, "REFERENCE INTERVAL")
    
    # --- TABLE BODY ---
    y -= 25
    for row in results:
        if row.get('type') == 'section':
            y -= 5
            c.setFont("Helvetica-Bold", 11)
            c.drawString(text_margin, y, str(row.get('title', '')).upper())
            y -= 20
        else:
            c.setFont("Helvetica-Bold", 10)
            c.drawString(text_margin, y, str(row.get('name', '')))
            c.setFont("Helvetica", 8)
            c.drawString(text_margin, y - 10, f"( Method : {row.get('method', 'WB/Automated')} )")
            
            c.setFont("Helvetica-Bold", 11)
            c.drawCentredString(width/2 - 30, y, str(row.get('result', '')))
            
            c.setFont("Helvetica", 10)
            c.drawString(width - 200, y, str(row.get('unit', '')))
            c.drawString(width - 130, y, str(row.get('range', '')))
            
            y -= 30
            
        if y < 100:
            c.showPage()
            y = height - 50
            
    # --- FOOTER ---
    c.setStrokeColor(blue_color)
    c.setLineWidth(1.5)
    c.line(margin, 80, width - margin, 80)
    
    c.setFillColor(blue_color)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(width/2, 65, "Working Hours : Morning 7.00 AM to 1.30 PM Evening: 6.30 p.m. to 9.00 PM")
    c.drawCentredString(width/2, 50, "Sunday: 7.00 AM to 2.00 PM.")
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(width/2, 30, "★ DIABETIC CHAPPALS AVAILABLE ★")
    
    c.save()
    return filename, file_path

def upload_report_file(file, patient_id):
    if not patient_id: return {"error": "Patient ID is required"}, 400
    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)
    return {"message": "Report uploaded successfully!", "path": save_path}, 201

def generate_summary_pdf(patient_data):
    filename = f"summary_{patient_data['id']}.pdf"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    c = canvas.Canvas(file_path, pagesize=A4)
    c.drawString(100, 750, f"Summary for {patient_data['name']}")
    c.save()
    return filename, file_path
