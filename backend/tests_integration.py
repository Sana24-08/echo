import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(resp_body)
        except:
            return e.code, {"raw_error": resp_body}

def run_tests():
    print("=== ECHO MASTER FULL-STACK INTEGRATION SUITE ===")
    results = {}

    # 1. System Status Endpoint (Phase 8)
    print("\n--- 1. Testing GET /api/status ---")
    status_code, status_data = make_request("/status")
    print(f"Status Code: {status_code}")
    print(f"Status Response: {json.dumps(status_data, indent=2)}")
    if status_code == 200 and status_data.get("backend") == "operational" and status_data.get("database") == "operational":
        results["system_status"] = "PASS"
    else:
        results["system_status"] = "FAIL"

    # 2. Authentication (Register and Login test user)
    print("\n--- 2. Authenticating Test User ---")
    import time
    unique_email = f"echo_test_{int(time.time())}@echotest.org"
    register_payload = {
        "name": "Integration Student",
        "email": unique_email,
        "password": "Password123!",
        "password_confirmation": "Password123!",
        "role": "user",
        "user_type": "student",
    }
    status_code, reg_data = make_request("/register", "POST", register_payload)
    if status_code != 201:
        print(f"Registration failed: {reg_data}")
        results["auth_register"] = "FAIL"
        return results

    # Login to obtain token
    login_payload = {
        "email": unique_email,
        "password": "Password123!",
    }
    status_code, login_data = make_request("/login", "POST", login_payload)
    token = login_data.get("token")
    if status_code == 200 and token:
        print(f"Registered and logged in user successfully. Token received.")
        results["auth_register"] = "PASS"
    else:
        print(f"Login failed: {login_data}")
        results["auth_register"] = "FAIL"
        return results


    # 3. Check-In Submission (Phase 3)
    print("\n--- 3. Testing POST /api/check-ins (Check-In Persistence) ---")
    checkin_payload = {
        "mood": 8,
        "energy": 7,
        "focus": 8,
        "stress": 3,
        "sleep": 8,
    }
    status_code, checkin_res = make_request("/check-ins", "POST", checkin_payload, token)
    print(f"Check-In Status: {status_code}")
    print(f"Check-In Response: {json.dumps(checkin_res, indent=2)}")
    if status_code in (200, 201) and checkin_res.get("success"):
        results["checkin_persistence"] = "PASS"
    else:
        results["checkin_persistence"] = "FAIL"

    # Add a second check-in to test trend calculations
    checkin_payload_2 = {
        "mood": 9,
        "energy": 8,
        "focus": 8,
        "stress": 2,
        "sleep": 9,
    }
    make_request("/check-ins", "POST", checkin_payload_2, token)

    # 4. Patterns Analysis (Phase 4)
    print("\n--- 4. Testing GET /api/patterns ---")
    status_code, pattern_res = make_request("/patterns?period=7d", "GET", token=token)
    print(f"Patterns Status: {status_code}")
    print(f"Total check-ins: {pattern_res.get('total_check_ins')}")
    print(f"Averages: {pattern_res.get('averages')}")
    print(f"Trends: {pattern_res.get('trends')}")
    if status_code == 200 and pattern_res.get("total_check_ins") >= 2:
        results["pattern_analysis"] = "PASS"
    else:
        results["pattern_analysis"] = "FAIL"

    # 5. Reports Aggregation (Phase 5)
    print("\n--- 5. Testing GET /api/reports ---")
    status_code, report_res = make_request("/reports?period=30d", "GET", token=token)
    print(f"Reports Status: {status_code}")
    print(f"Period Label: {report_res.get('period_label')}")
    print(f"Status Badge: {report_res.get('status_badge')}")
    print(f"Dimension Reports: {json.dumps(report_res.get('dimension_reports'), indent=2)}")
    if status_code == 200 and report_res.get("success") and len(report_res.get("dimension_reports", [])) == 5:
        results["reports_dashboard"] = "PASS"
    else:
        results["reports_dashboard"] = "FAIL"

    # 6. Gemini Conversational Chat (Phase 2)
    print("\n--- 6. Testing POST /api/chat with Gemini AI ---")
    chat_payload = {
        "message": "Hello ECHO! I completed my check-in today and feel rested. How are you?",
        "history": [
            {"role": "user", "content": "Hi ECHO"},
            {"role": "assistant", "content": "Hello! I am here with you. How are you feeling today?"}
        ]
    }
    status_code, chat_res = make_request("/chat", "POST", chat_payload, token)
    print(f"Chat Status: {status_code}")
    print(f"Chat Response: {json.dumps(chat_res, indent=2)}")
    if status_code == 200 and chat_res.get("success") and len(chat_res.get("reply", "")) > 10:
        results["gemini_chat"] = "PASS"
    else:
        results["gemini_chat"] = "FAIL"

    # 7. Unauthorized Access Security Check (Phase 7)
    print("\n--- 7. Security: Verify Protected Endpoints Reject Unauthenticated Requests ---")
    status_unauth, _ = make_request("/reports", "GET")
    if status_unauth == 401:
        print("Unauthorized access correctly rejected with HTTP 401.")
        results["security_auth"] = "PASS"
    else:
        results["security_auth"] = "FAIL"

    print("\n=== SUMMARY RESULTS ===")
    for test_name, outcome in results.items():
        print(f"{test_name.upper()}: {outcome}")

    return results

if __name__ == "__main__":
    run_tests()
