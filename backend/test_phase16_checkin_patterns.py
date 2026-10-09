import requests
import sys
import time
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

def print_result(name, passed, detail=""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"{status} | {name}" + (f": {detail}" if detail else ""))
    if not passed:
        sys.exit(1)

def main():
    print("=" * 70)
    print("PHASE 16 — CHECK-IN & PATTERN ENGINE COMPREHENSIVE API TEST SUITE")
    print("=" * 70)

    # 1. Unauthenticated endpoints
    res = requests.post(f"{BASE_URL}/check-ins", json={"mood": 8, "energy": 7, "focus": 6, "stress": 4, "sleep": 8}, headers={"Accept": "application/json"})
    print_result("Unauthenticated POST /api/check-ins returns 401", res.status_code == 401, f"Status {res.status_code}")

    res = requests.get(f"{BASE_URL}/patterns?period=7d", headers={"Accept": "application/json"})
    print_result("Unauthenticated GET /api/patterns returns 401", res.status_code == 401, f"Status {res.status_code}")

    # 2. Register Test User A
    user_a_email = f"user_a_{uuid.uuid4().hex[:8]}@example.com"
    password_a = "Password123!"
    res = requests.post(f"{BASE_URL}/register", json={
        "name": "User Alpha",
        "email": user_a_email,
        "password": password_a,
        "password_confirmation": password_a,
        "role": "user",
        "user_type": "student"
    }, headers={"Accept": "application/json"})
    print_result("User A registration succeeds", res.status_code == 201, f"Status {res.status_code}")
    user_a_id = res.json().get("user", {}).get("id")

    # Login User A
    res_login_a = requests.post(f"{BASE_URL}/login", json={
        "email": user_a_email,
        "password": password_a
    }, headers={"Accept": "application/json"})
    token_a = res_login_a.json().get("token")
    headers_a = {"Authorization": f"Bearer {token_a}", "Accept": "application/json"}

    # 3. Validation Tests
    # Missing rating
    res = requests.post(f"{BASE_URL}/check-ins", json={"energy": 7, "focus": 6, "stress": 4, "sleep": 8}, headers=headers_a)
    print_result("Validation: Missing mood returns 422", res.status_code == 422, f"Status {res.status_code}")

    # Rating below 1
    res = requests.post(f"{BASE_URL}/check-ins", json={"mood": 0, "energy": 7, "focus": 6, "stress": 4, "sleep": 8}, headers=headers_a)
    print_result("Validation: Rating below 1 returns 422", res.status_code == 422, f"Status {res.status_code}")

    # Rating above 10
    res = requests.post(f"{BASE_URL}/check-ins", json={"mood": 11, "energy": 7, "focus": 6, "stress": 4, "sleep": 8}, headers=headers_a)
    print_result("Validation: Rating above 10 returns 422", res.status_code == 422, f"Status {res.status_code}")

    # Non-integer rating
    res = requests.post(f"{BASE_URL}/check-ins", json={"mood": 7.5, "energy": 7, "focus": 6, "stress": 4, "sleep": 8}, headers=headers_a)
    print_result("Validation: Non-integer rating returns 422", res.status_code == 422, f"Status {res.status_code}")

    # 4. Valid Check-in Creation with spoofed user_id
    res = requests.post(f"{BASE_URL}/check-ins", json={
        "user_id": 999999,  # Attempt to spoof
        "mood": 8,
        "energy": 7,
        "focus": 6,
        "stress": 3,
        "sleep": 8
    }, headers=headers_a)
    print_result("Valid check-in created with 201", res.status_code == 201, f"Status {res.status_code}")
    data = res.json()
    check_in_a1 = data.get("check_in", {})
    print_result("Check-in belongs to authenticated user, ignoring spoofed user_id", check_in_a1.get("user_id") == user_a_id)
    print_result("Derived summary returned in response", "summary" in data and data["summary"].get("state") == "positive")

    # 5. Idempotency guard for double-click
    res_dup = requests.post(f"{BASE_URL}/check-ins", json={
        "mood": 8,
        "energy": 7,
        "focus": 6,
        "stress": 3,
        "sleep": 8
    }, headers=headers_a)
    print_result("Duplicate double-click returns 201 idempotently", res_dup.status_code == 201 and res_dup.json().get("check_in", {}).get("id") == check_in_a1.get("id"))

    # 6. Register Test User B (Empty State Check)
    user_b_email = f"user_b_{uuid.uuid4().hex[:8]}@example.com"
    password_b = "Password123!"
    res = requests.post(f"{BASE_URL}/register", json={
        "name": "User Beta",
        "email": user_b_email,
        "password": password_b,
        "password_confirmation": password_b,
        "role": "user",
        "user_type": "employee"
    }, headers={"Accept": "application/json"})
    
    # Login User B
    res_login_b = requests.post(f"{BASE_URL}/login", json={
        "email": user_b_email,
        "password": password_b
    }, headers={"Accept": "application/json"})
    token_b = res_login_b.json().get("token")
    headers_b = {"Authorization": f"Bearer {token_b}", "Accept": "application/json"}

    # Pattern for User B with 0 check-ins
    res = requests.get(f"{BASE_URL}/patterns?period=7d", headers=headers_b)
    print_result("Empty pattern returns 200 without error", res.status_code == 200, f"Status {res.status_code}")
    pat_b = res.json()
    print_result("Empty pattern total_check_ins is 0", pat_b.get("total_check_ins") == 0)
    print_result("Empty pattern latest_check_in is null", pat_b.get("latest_check_in") is None)
    print_result("Empty pattern has_sufficient_data is False", pat_b.get("has_sufficient_data") is False)
    print_result("Empty pattern observations are returned", len(pat_b.get("observations", [])) > 0)

    # 7. Privacy & Isolation check
    res_b_checkins = requests.get(f"{BASE_URL}/check-ins", headers=headers_b)
    print_result("User B cannot see User A's check-ins", len(res_b_checkins.json().get("check_ins", [])) == 0)

    # 8. Single check-in behavior for User B
    time.sleep(1)
    res = requests.post(f"{BASE_URL}/check-ins", json={
        "mood": 5,
        "energy": 5,
        "focus": 5,
        "stress": 7,
        "sleep": 5
    }, headers=headers_b)
    print_result("User B creates first check-in", res.status_code == 201)

    res = requests.get(f"{BASE_URL}/patterns?period=7d", headers=headers_b)
    pat_b1 = res.json()
    print_result("Single check-in total_check_ins is 1", pat_b1.get("total_check_ins") == 1)
    print_result("Single check-in cannot determine trend (insufficient_data)", pat_b1.get("trends", {}).get("mood") == "insufficient_data")
    print_result("Single check-in has_sufficient_data is False", pat_b1.get("has_sufficient_data") is False)

    # 9. Second check-in for User B to test trend & inverted stress
    time.sleep(5)  # Wait past idempotency window
    res = requests.post(f"{BASE_URL}/check-ins", json={
        "mood": 8,     # +3 (improving)
        "energy": 7,   # +2 (improving)
        "focus": 6,    # +1 (improving)
        "stress": 4,   # -3 (calmer -> improving)
        "sleep": 8     # +3 (improving)
    }, headers=headers_b)
    print_result("User B creates second check-in", res.status_code == 201)

    res = requests.get(f"{BASE_URL}/patterns?period=7d", headers=headers_b)
    pat_b2 = res.json()
    print_result("Multiple check-ins total_check_ins is 2", pat_b2.get("total_check_ins") == 2)
    print_result("Multiple check-ins has_sufficient_data is True", pat_b2.get("has_sufficient_data") is True)
    
    # Verify averages:
    # mood: (5 + 8) / 2 = 6.5
    # stress: (7 + 4) / 2 = 5.5
    avg_mood = pat_b2.get("averages", {}).get("mood")
    avg_stress = pat_b2.get("averages", {}).get("stress")
    print_result("Average mood is 6.5", avg_mood == 6.5, f"Value: {avg_mood}")
    print_result("Average stress is 5.5", avg_stress == 5.5, f"Value: {avg_stress}")

    # Verify stress trend direction (inverted: stress decreased from 7 to 4 -> delta -3 -> improving)
    stress_trend = pat_b2.get("trends", {}).get("stress")
    mood_trend = pat_b2.get("trends", {}).get("mood")
    print_result("Mood trend is 'improving'", mood_trend == "improving", f"Trend: {mood_trend}")
    print_result("Stress trend is 'improving' when stress decreased", stress_trend == "improving", f"Trend: {stress_trend}")

    # Verify chronological ordering
    ts = pat_b2.get("time_series", [])
    print_result("Time series has 2 entries", len(ts) == 2)
    print_result("Time series is in chronological order", ts[0]["id"] < ts[1]["id"])

    # 10. Period filtering
    res_30 = requests.get(f"{BASE_URL}/patterns?period=30d", headers=headers_b)
    res_90 = requests.get(f"{BASE_URL}/patterns?period=90d", headers=headers_b)
    res_all = requests.get(f"{BASE_URL}/patterns?period=all", headers=headers_b)
    print_result("Period 30d supported", res_30.status_code == 200 and res_30.json().get("period") == "30d")
    print_result("Period 90d supported", res_90.status_code == 200 and res_90.json().get("period") == "90d")
    print_result("Period all supported", res_all.status_code == 200 and res_all.json().get("period") == "all")

    print("=" * 70)
    print("ALL PHASE 16 TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    main()
