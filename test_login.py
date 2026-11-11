import requests

url = "http://localhost:5000/api/auth/login"
data = {
    "email": "superadmin@sairam.com",
    "password": "superadmin123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
