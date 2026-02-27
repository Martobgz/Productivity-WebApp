import requests

BASE = "http://localhost:8000/api"

def login(email, password):
    r = requests.post(f"{BASE}/auth/login", json={"email": email, "password": password}, timeout=10)
    print(f"Login {email}: {r.status_code}")
    if r.status_code != 200:
        print(f"  Error: {r.text}")
        return None
    body = r.json()
    return body["data"]["session"]["access_token"]

def show_workspaces(label, token):
    if not token:
        print(f"\n=== {label}: SKIPPED (no token) ===")
        return
    ws = requests.get(f"{BASE}/workspaces/", headers={"Authorization": f"Bearer {token}"}, timeout=10).json()
    print(f"\n=== {label} sees {len(ws)} workspaces ===")
    for w in ws:
        print(f"  Name: {w['name']} | Type: {w.get('type','?')} | Owner ID: {w['user_id']}")

# Try both users
token_a = login("a@gmail.com", "133313")
token_b = login("b@gmail.com", "133313")

show_workspaces("User A (a@gmail.com)", token_a)
show_workspaces("User B (b@gmail.com)", token_b)
