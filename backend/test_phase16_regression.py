import requests
import sys
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

def print_result(name, passed, detail=""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"{status} | {name}" + (f": {detail}" if detail else ""))
    if not passed:
        sys.exit(1)

def main():
    print("=" * 70)
    print("PHASE 16 — AUTH, ACCESS KEY & CONNECTION REGRESSION TEST")
    print("=" * 70)

    # 1. Register Teacher (admin)
    teacher_email = f"teacher_{uuid.uuid4().hex[:8]}@example.com"
    res = requests.post(f"{BASE_URL}/register", json={
        "name": "Teacher Tester",
        "email": teacher_email,
        "password": "Password123!",
        "password_confirmation": "Password123!",
        "role": "admin",
        "user_type": "teacher"
    }, headers={"Accept": "application/json"})
    print_result("Teacher registration", res.status_code == 201)
    access_key = res.json().get("access_key")
    teacher_id = res.json().get("user", {}).get("id")

    # Login Teacher
    res_login_t = requests.post(f"{BASE_URL}/login", json={
        "email": teacher_email,
        "password": "Password123!"
    }, headers={"Accept": "application/json"})
    token_t = res_login_t.json().get("token")
    headers_t = {"Authorization": f"Bearer {token_t}", "Accept": "application/json"}

    # 2. Register Student (user)
    student_email = f"student_{uuid.uuid4().hex[:8]}@example.com"
    res = requests.post(f"{BASE_URL}/register", json={
        "name": "Student Tester",
        "email": student_email,
        "password": "Password123!",
        "password_confirmation": "Password123!",
        "role": "user",
        "user_type": "student"
    }, headers={"Accept": "application/json"})
    print_result("Student registration", res.status_code == 201)

    # Login Student
    res_login_s = requests.post(f"{BASE_URL}/login", json={
        "email": student_email,
        "password": "Password123!"
    }, headers={"Accept": "application/json"})
    token_s = res_login_s.json().get("token")
    headers_s = {"Authorization": f"Bearer {token_s}", "Accept": "application/json"}

    # 3. Verify access key
    res_v = requests.post(f"{BASE_URL}/access-key/verify", json={"access_key": access_key}, headers={"Accept": "application/json"})
    print_result("Verify teacher access key", res_v.status_code == 200 and res_v.json().get("user", {}).get("id") == teacher_id)

    # 4. Student creates connection request
    res_c = requests.post(f"{BASE_URL}/connections", json={
        "supporter_id": teacher_id,
        "allow_mood": True,
        "allow_stress": False,
        "allow_sleep": True,
        "allow_energy": False
    }, headers=headers_s)
    print_result("Student connection request", res_c.status_code == 201)
    conn_id = res_c.json().get("connection", {}).get("id")

    # 5. Teacher checks incoming
    res_inc = requests.get(f"{BASE_URL}/connections/incoming", headers=headers_t)
    print_result("Teacher views incoming requests", res_inc.status_code == 200 and any(c["id"] == conn_id for c in res_inc.json().get("connections", [])))

    # 6. Teacher accepts connection
    res_acc = requests.post(f"{BASE_URL}/connections/{conn_id}/accept", headers=headers_t)
    print_result("Teacher accepts connection", res_acc.status_code == 200 and res_acc.json().get("connection", {}).get("status") == "accepted")

    # 7. Student updates permissions
    res_p = requests.patch(f"{BASE_URL}/connections/{conn_id}/permissions", json={
        "allow_mood": True,
        "allow_stress": True,
        "allow_sleep": True,
        "allow_energy": True
    }, headers=headers_s)
    print_result("Student updates permissions", res_p.status_code == 200 and res_p.json().get("connection", {}).get("allow_stress") is True)

    # 8. Student revokes connection
    res_rev = requests.post(f"{BASE_URL}/connections/{conn_id}/revoke", headers=headers_s)
    print_result("Student revokes connection", res_rev.status_code == 200 and res_rev.json().get("connection", {}).get("status") == "revoked")

    print("=" * 70)
    print("NO REGRESSIONS DETECTED! ALL EXISTING FLOWS OPERATIONAL.")
    print("=" * 70)

if __name__ == "__main__":
    main()
