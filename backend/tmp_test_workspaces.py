import requests
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

def test_workspace_flow():
    # 1. Create two users (or use existing ones)
    # Since we can't easily create users with unique emails every time without cleanup, 
    # we'll assume we have a way to get tokens.
    
    # User A Login
    print("Logging in User A...")
    resp_a = requests.post(f"{BASE_URL}/auth/login", json={"email": "test@example.com", "password": "Password123!"})
    if resp_a.status_code != 200:
        # Try signup if login fails
        resp_a = requests.post(f"{BASE_URL}/auth/signup", json={"email": "test@example.com", "password": "Password123!", "full_name": "User A"})
    
    token_a = resp_a.json()["data"]["session"]["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User B Login
    print("Logging in User B...")
    resp_b = requests.post(f"{BASE_URL}/auth/login", json={"email": "pbkdf2@example.com", "password": "Password123!"})
    if resp_b.status_code != 200:
        resp_b = requests.post(f"{BASE_URL}/auth/signup", json={"email": "pbkdf2@example.com", "password": "Password123!", "full_name": "User B"})
    
    token_b = resp_b.json()["data"]["session"]["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 2. User A creates a workspace
    ws_id = str(uuid.uuid4())
    print(f"User A creating workspace {ws_id}...")
    ws_data = {
        "id": ws_id,
        "name": "Shared Test Project",
        "type": "shared",
        "content": "Initial content",
        "todos": [],
        "createdAt": "2026-02-27T12:00:00Z",
        "deleted": False
    }
    resp = requests.post(f"{BASE_URL}/workspaces/", json=ws_data, headers=headers_a)
    assert resp.status_code == 200

    # 3. User A invites User B
    print(f"User A inviting User B (pbkdf2@example.com)...")
    resp = requests.post(f"{BASE_URL}/workspaces/{ws_id}/invite", json={"email": "pbkdf2@example.com"}, headers=headers_a)
    assert resp.status_code == 200
    print("Invite sent successfully.")

    # 4. User B fetches workspaces and verifies they see the shared one
    print("User B fetching workspaces...")
    resp = requests.get(f"{BASE_URL}/workspaces/", headers=headers_b)
    workspaces = resp.json()
    found = any(w["id"] == ws_id for w in workspaces)
    assert found
    print("Success! User B can see the shared workspace.")

if __name__ == "__main__":
    try:
        test_workspace_flow()
        print("\nALL TESTS PASSED!")
    except Exception as e:
        print(f"\nTEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
