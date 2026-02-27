import requests
import json

BASE = "http://localhost:8000/api"

def signup(email, password):
    r = requests.post(f"{BASE}/auth/signup", json={"email": email, "password": password, "full_name": email.split("@")[0]})
    if r.status_code == 200:
        return r.json()["data"]["session"]["access_token"]
    else:
        # If already exists, just login
        return login(email, password)

def login(email, password):
    r = requests.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    if r.status_code != 200:
        print(f"Login failed for {email}: {r.status_code} - {r.text}")
        exit(1)
    data = r.json()
    return data["data"]["session"]["access_token"]

# 1. Setup Users
EMAIL_A = "role_owner@test.com"
EMAIL_B = "role_part@test.com"
PWD = "password123"

TOKEN_A = signup(EMAIL_A, PWD)
TOKEN_B = signup(EMAIL_B, PWD)

# 2. User A creates a workspace
ws_id = "role-test-ws"
workspace_data = {
    "id": ws_id,
    "name": "Role Test Workspace",
    "type": "shared",
    "content": "Initial content",
    "todos": [],
    "createdAt": "2026-02-27T18:00:00Z",
    "deleted": False
}

print("User A creating workspace...")
requests.delete(f"{BASE}/workspaces/{ws_id}", headers={"Authorization": f"Bearer {TOKEN_A}"}) # Cleanup
r = requests.post(f"{BASE}/workspaces/", json=workspace_data, headers={"Authorization": f"Bearer {TOKEN_A}"})
print(f"Create status: {r.status_code}")

# 3. User A invites User B
print("User A inviting User B...")
r = requests.post(f"{BASE}/workspaces/{ws_id}/invite", json={"email": EMAIL_B}, headers={"Authorization": f"Bearer {TOKEN_A}"})
print(f"Invite status: {r.status_code}")

# 4. User B accepts
print("User B accepting invite...")
invites = requests.get(f"{BASE}/workspaces/invitations", headers={"Authorization": f"Bearer {TOKEN_B}"}).json()
invite_id = next(i["id"] for i in invites if i["workspace_id"] == ws_id)
requests.post(f"{BASE}/workspaces/invitations/{invite_id}/accept", headers={"Authorization": f"Bearer {TOKEN_B}"})

# 5. User B (Participant) tries to invite User A (again) or anyone else
print("User B (Participant) trying to invite...")
r = requests.post(f"{BASE}/workspaces/{ws_id}/invite", json={"email": "test3@example.com"}, headers={"Authorization": f"Bearer {TOKEN_B}"})
print(f"Participant invite status (expected 403): {r.status_code}")

# 6. User B (Participant) tries to delete
print("User B (Participant) trying to delete...")
r = requests.delete(f"{BASE}/workspaces/{ws_id}", headers={"Authorization": f"Bearer {TOKEN_B}"})
print(f"Participant delete status (expected 403): {r.status_code}")

# 7. User B (Participant) tries to edit
print("User B (Participant) trying to edit...")
r = requests.patch(f"{BASE}/workspaces/{ws_id}", json={"content": "Edited by participant"}, headers={"Authorization": f"Bearer {TOKEN_B}"})
print(f"Participant edit status (expected 200): {r.status_code}")

# 8. User A (Owner) deletes
print("User A (Owner) deleting...")
r = requests.delete(f"{BASE}/workspaces/{ws_id}", headers={"Authorization": f"Bearer {TOKEN_A}"})
print(f"Owner delete status (expected 200): {r.status_code}")
