import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=== ECHO Phase 17 Full Stack Integration Tests ===")
    
    # 1. Test Music Status (Public/Auth)
    print("\n1. Testing GET /api/music/status...")
    res = requests.get(f"{BASE_URL}/music/status")
    print(f"Status: {res.status_code}, Body: {res.json()}")
    assert res.status_code == 200
    assert res.json().get("configured") is True

    # 2. Test Music Tracks (Public)
    print("\n2. Testing GET /api/music/tracks?intent=relax&genres=Calm%20and%20relaxing...")
    res = requests.get(f"{BASE_URL}/music/tracks?intent=relax&genres=Calm%20and%20relaxing")
    print(f"Status: {res.status_code}")
    data = res.json()
    assert res.status_code == 200
    assert data.get("success") is True
    assert len(data.get("tracks", [])) > 0
    first_track = data["tracks"][0]
    print(f"First track: {first_track.get('title')} by {first_track.get('artist')}")
    assert "spotify_url" in first_track

    # 3. Create / Log in user for authenticated tests
    import time
    test_email = f"phase17_user_{int(time.time())}@example.com"
    login_payload = {
        "email": "test_phase17@example.com",
        "password": "Password123!"
    }
    # Try logging in, if not registered, register
    res = requests.post(f"{BASE_URL}/login", json=login_payload)
    if res.status_code != 200:
        reg_payload = {
            "name": "Phase 17 Tester",
            "email": "test_phase17@example.com",
            "password": "Password123!",
            "password_confirmation": "Password123!",
            "role": "user",
            "user_type": "student"
        }
        reg_res = requests.post(f"{BASE_URL}/register", json=reg_payload)
        assert reg_res.status_code in (200, 201), f"Register failed: {reg_res.text}"
        res = requests.post(f"{BASE_URL}/login", json=login_payload)
    
    assert res.status_code == 200
    token = res.json()["token"]
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    print("Authenticated successfully with Sanctum Bearer token.")

    # 4. Profile GET
    print("\n4. Testing GET /api/profile...")
    res = requests.get(f"{BASE_URL}/profile", headers=headers)
    print(f"Status: {res.status_code}, User: {res.json().get('user', {}).get('name')}")
    assert res.status_code == 200
    assert res.json().get("success") is True
    assert "notification_preferences" in res.json()
    assert "privacy_settings" in res.json()

    # 5. Profile Update (Personal & Preferences)
    print("\n5. Testing PUT /api/profile (update name & notification prefs)...")
    res = requests.put(f"{BASE_URL}/profile", headers=headers, json={
        "name": "Phase 17 Updated Tester",
        "notification_preferences": {
            "email_notifications": True,
            "checkin_reminders": True,
            "weekly_insights": False,
            "supporter_alerts": True
        },
        "privacy_settings": {
            "share_checkins": True,
            "share_patterns": True,
            "anonymous_analytics": False,
            "allow_supporter_view": True
        }
    })
    print(f"Status: {res.status_code}, Message: {res.json().get('message')}")
    assert res.status_code == 200
    assert res.json().get("success") is True

    # 6. Music Preferences GET & PUT
    print("\n6. Testing PUT & GET /api/music/preferences...")
    res = requests.put(f"{BASE_URL}/music/preferences", headers=headers, json={
        "intent": "focus",
        "genres": ["Lo-fi", "Classical"]
    })
    assert res.status_code == 200
    res = requests.get(f"{BASE_URL}/music/preferences", headers=headers)
    assert res.status_code == 200
    print(f"Saved Music Preferences: {res.json().get('preferences')}")
    assert res.json().get("preferences", {}).get("intent") == "focus"

    # 7. Activities Log (breathe, walk, grounding, stretch)
    print("\n7. Testing POST /api/activities/log...")
    for act_type in ["breathe", "walk", "grounding", "stretch", "hydrate"]:
        res = requests.post(f"{BASE_URL}/activities/log", headers=headers, json={
            "activity_type": act_type,
            "duration_seconds": 60,
            "completed": True,
            "feeling": "Calm"
        })
        assert res.status_code in (200, 201), f"Activity log failed: {res.text}"
        print(f"Logged {act_type}: {res.json().get('message')}")

    # 8. Journal Save & Fetch
    print("\n8. Testing POST /api/journal & GET /api/journal...")
    res = requests.post(f"{BASE_URL}/journal", headers=headers, json={
        "prompt": "What has been on your mind today?",
        "content": "Today I took time to breathe and test all the new restorative features."
    })
    assert res.status_code in (200, 201), f"Journal save failed: {res.text}"
    assert res.json().get("success") is True
    print(f"Saved journal entry id: {res.json().get('entry', {}).get('id')}")

    res = requests.get(f"{BASE_URL}/journal", headers=headers)
    assert res.status_code == 200
    assert len(res.json().get("entries", [])) > 0
    print(f"Fetched {len(res.json().get('entries', []))} journal entries.")

    # 9. Profile Check-ins history
    print("\n9. Testing GET /api/profile/check-ins...")
    res = requests.get(f"{BASE_URL}/profile/check-ins", headers=headers)
    assert res.status_code == 200
    print(f"Total check-ins for authenticated user: {res.json().get('total')}")

    # 10. Profile Password change
    print("\n10. Testing PUT /api/profile/password...")
    # Test invalid current password first
    res = requests.put(f"{BASE_URL}/profile/password", headers=headers, json={
        "current_password": "WrongPassword!",
        "password": "NewPassword123!",
        "password_confirmation": "NewPassword123!"
    })
    print(f"Invalid current password check: status {res.status_code}")
    assert res.status_code == 422

    # Change password to new password
    res = requests.put(f"{BASE_URL}/profile/password", headers=headers, json={
        "current_password": "Password123!",
        "password": "NewPassword123!",
        "password_confirmation": "NewPassword123!"
    })
    assert res.status_code == 200
    print(f"Valid password change: {res.json().get('message')}")

    # Restore password back to Password123!
    res = requests.put(f"{BASE_URL}/profile/password", headers=headers, json={
        "current_password": "NewPassword123!",
        "password": "Password123!",
        "password_confirmation": "Password123!"
    })
    assert res.status_code == 200

    # 11. Profile Logout
    print("\n11. Testing POST /api/profile/logout...")
    res = requests.post(f"{BASE_URL}/profile/logout", headers=headers)
    assert res.status_code == 200
    print(f"Logout response: {res.json().get('message')}")

    # Verify token is revoked
    res = requests.get(f"{BASE_URL}/profile", headers=headers)
    print(f"Access with revoked token: status {res.status_code}")
    assert res.status_code == 401

    print("\n ALL PHASE 17 INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"TEST FAILED: {e}")
        sys.exit(1)
