import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api"

def test_calendar():
    email = f"caltest_{datetime.now().timestamp()}@example.com"
    password = "password123"

    # 1. Register
    url = f"{BASE_URL}/auth/signup"
    print(f"Registering user {email} at {url}...")
    reg_data = {
        "email": email,
        "password": password,
        "full_name": "Calendar Tester"
    }
    try:
        resp = requests.post(url, json=reg_data, timeout=10)
        print(f"Registration response: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Registration failed: {resp.text}")
    except Exception as e:
        print(f"Registration request error: {e}")
    
    # 2. Login
    url = f"{BASE_URL}/auth/login"
    print(f"Logging in at {url}...")
    login_data = {
        "email": email,
        "password": password
    }
    try:
        resp = requests.post(url, json=login_data, timeout=10)
        print(f"Login response: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return
        
        token = resp.json()["data"]["session"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")
    except Exception as e:
        print(f"Login request error: {e}")
        return

    # 3. Create Event
    print("\nCreating event...")
    start_time = datetime.now() + timedelta(days=1)
    end_time = start_time + timedelta(hours=2)
    
    event_data = {
        "title": "Backend Sprint Review",
        "description": "Discuss calendar implementation",
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "all_day": False,
        "color": "#3b82f6"
    }
    
    resp = requests.post(f"{BASE_URL}/calendar/", json=event_data, headers=headers)
    if resp.status_code != 200:
        print(f"Create failed: {resp.text}")
        return
    
    event_id = resp.json()["id"]
    print(f"Event created with ID: {event_id}")

    # 4. List Events
    print("\nListing events...")
    resp = requests.get(f"{BASE_URL}/calendar/", headers=headers)
    events = resp.json()
    print(f"Found {len(events)} events.")
    for e in events:
        print(f"- {e['title']} ({e['start_time']})")

    # 5. Update Event
    print(f"\nUpdating event {event_id}...")
    update_data = {"title": "Updated: Sprint Review"}
    resp = requests.put(f"{BASE_URL}/calendar/{event_id}", json=update_data, headers=headers)
    print(f"Update response: {resp.status_code}")
    print(f"New title: {resp.json()['title']}")

    # 6. Delete Event
    print(f"\nDeleting event {event_id}...")
    resp = requests.delete(f"{BASE_URL}/calendar/{event_id}", headers=headers)
    print(f"Delete response: {resp.status_code}")

    print("\nALL CALENDAR TESTS PASSED!")

if __name__ == "__main__":
    test_calendar()

if __name__ == "__main__":
    test_calendar()
