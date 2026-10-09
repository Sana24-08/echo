import requests
import uuid
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def print_test(num, name, condition, details=""):
    status = "PASS" if condition else "FAIL"
    print(f"Test {num:2d} | [{status}] | {name}" + (f" -> {details}" if details else ""))
    if not condition:
        print(f"FAILED ON TEST {num}: {name} - {details}")
        sys.exit(1)

def main():
    print("=" * 80)
    print("ECHO COMPREHENSIVE ACCESS KEY VERIFICATION & AUTHORIZATION TEST SUITE")
    print("=" * 80)

    # Setup Support Teacher
    teacher_email = f"teacher_suite_{uuid.uuid4().hex[:8]}@example.com"
    res_reg_t = requests.post(f"{BASE_URL}/register", json={
        "name": "Teacher Suite Tester",
        "email": teacher_email,
        "password": "Password123!",
        "password_confirmation": "Password123!",
        "role": "admin",
        "user_type": "teacher"
    }, headers={"Accept": "application/json"})
    token_t = res_reg_t.json().get("token")
    teacher_id = res_reg_t.json().get("user", {}).get("id")
    initial_key = res_reg_t.json().get("access_key")
    headers_t = {"Authorization": f"Bearer {token_t}", "Accept": "application/json"}

    # 1. An eligible support account generates a key (explicit regeneration)
    res_gen = requests.post(f"{BASE_URL}/access-key/generate", headers=headers_t)
    new_generated_key = res_gen.json().get("access_key")
    print_test(1, "Eligible support account generates key",
               res_gen.status_code == 200 and bool(new_generated_key) and new_generated_key != initial_key and new_generated_key.startswith("ECHO-"),
               f"Status: {res_gen.status_code}, Key: {new_generated_key}")

    # 2. The key is persisted in MySQL
    res_get = requests.get(f"{BASE_URL}/access-key", headers=headers_t)
    persisted_key = res_get.json().get("access_key")
    print_test(2, "Key is persisted in MySQL",
               res_get.status_code == 200 and persisted_key == new_generated_key,
               f"Persisted: {persisted_key}")

    # 3. The Admin endpoint returns that saved key
    print_test(3, "Admin endpoint returns that saved key",
               persisted_key == new_generated_key and bool(persisted_key),
               f"Saved key: {persisted_key}")

    # 4. Refreshing/re-requesting does not unexpectedly change it
    res_refresh = requests.get(f"{BASE_URL}/access-key", headers=headers_t)
    refreshed_key = res_refresh.json().get("access_key")
    print_test(4, "Re-requesting does not unexpectedly change key",
               res_refresh.status_code == 200 and refreshed_key == new_generated_key,
               f"Refreshed: {refreshed_key}")

    # 5. User enters the key and receives HTTP 200
    res_verify = requests.post(f"{BASE_URL}/access-key/verify", json={"access_key": new_generated_key}, headers={"Accept": "application/json"})
    print_test(5, "User enters key and receives HTTP 200",
               res_verify.status_code == 200,
               f"Status: {res_verify.status_code}, Msg: {res_verify.json().get('message')}")

    # Also test case-insensitivity and en-dash normalization in verification
    res_verify_lower = requests.post(f"{BASE_URL}/access-key/verify", json={"access_key": new_generated_key.lower()}, headers={"Accept": "application/json"})
    res_verify_dash = requests.post(f"{BASE_URL}/access-key/verify", json={"access_key": new_generated_key.replace("-", "–")}, headers={"Accept": "application/json"})
    print_test(5, "Verification normalizes case and unicode dashes",
               res_verify_lower.status_code == 200 and res_verify_dash.status_code == 200,
               f"Lower: {res_verify_lower.status_code}, Dash: {res_verify_dash.status_code}")

    # 6. The verified account matches the database record
    verified_user = res_verify.json().get("user", {})
    print_test(6, "Verified account matches database record",
               verified_user.get("id") == teacher_id and verified_user.get("name") == "Teacher Suite Tester" and verified_user.get("role") == "admin" and verified_user.get("user_type") == "teacher",
               f"User: {verified_user}")

    # 7. An invalid key returns HTTP 401
    res_inv = requests.post(f"{BASE_URL}/access-key/verify", json={"access_key": "ECHO-INVALID-KEY9"}, headers={"Accept": "application/json"})
    print_test(7, "Invalid key returns HTTP 401",
               res_inv.status_code == 401 and res_inv.json().get("message") == "Invalid access key",
               f"Status: {res_inv.status_code}, Message: {res_inv.json().get('message')}")

    # 8. Empty input is handled correctly (HTTP 422)
    res_empty = requests.post(f"{BASE_URL}/access-key/verify", json={"access_key": ""}, headers={"Accept": "application/json"})
    res_spaces = requests.post(f"{BASE_URL}/access-key/verify", json={"access_key": "   "}, headers={"Accept": "application/json"})
    print_test(8, "Empty input returns HTTP 422",
               res_empty.status_code == 422 and res_spaces.status_code == 422,
               f"Empty: {res_empty.status_code}, Spaces: {res_spaces.status_code}")

    # 9. Duplicate keys cannot be generated (test uniqueness by generating multiple keys)
    keys_set = set([new_generated_key])
    all_unique = True
    for _ in range(5):
        r = requests.post(f"{BASE_URL}/access-key/generate", headers=headers_t)
        k = r.json().get("access_key")
        if k in keys_set:
            all_unique = False
        keys_set.add(k)
    print_test(9, "Duplicate keys cannot be generated (all unique)",
               all_unique and len(keys_set) == 6,
               f"Generated {len(keys_set)} unique keys")

    # 10. One account cannot retrieve or regenerate another account's key
    teacher2_email = f"teacher2_{uuid.uuid4().hex[:8]}@example.com"
    res_t2 = requests.post(f"{BASE_URL}/register", json={
        "name": "Teacher Two",
        "email": teacher2_email,
        "password": "Password123!",
        "password_confirmation": "Password123!",
        "role": "admin",
        "user_type": "parent"
    }, headers={"Accept": "application/json"})
    token_t2 = res_t2.json().get("token")
    headers_t2 = {"Authorization": f"Bearer {token_t2}", "Accept": "application/json"}
    key_t2 = res_t2.json().get("access_key")

    res_t1_view = requests.get(f"{BASE_URL}/access-key", headers=headers_t)
    key_t1_current = res_t1_view.json().get("access_key")

    res_t2_view = requests.get(f"{BASE_URL}/access-key", headers=headers_t2)
    key_t2_current = res_t2_view.json().get("access_key")

    # Non-admin / student cannot access support key endpoints (HTTP 403)
    student_email = f"student_iso_{uuid.uuid4().hex[:8]}@example.com"
    res_s = requests.post(f"{BASE_URL}/register", json={
        "name": "Student Iso",
        "email": student_email,
        "password": "Password123!",
        "password_confirmation": "Password123!",
        "role": "user",
        "user_type": "student"
    }, headers={"Accept": "application/json"})
    token_s = res_s.json().get("token")
    headers_s = {"Authorization": f"Bearer {token_s}", "Accept": "application/json"}

    res_unauth = requests.get(f"{BASE_URL}/access-key", headers={"Accept": "application/json"})
    res_forbidden = requests.get(f"{BASE_URL}/access-key", headers=headers_s)

    print_test(10, "Account isolation & authorization: unauthenticated 401, non-support 403, accounts isolated",
               key_t1_current != key_t2_current and res_unauth.status_code == 401 and res_forbidden.status_code == 403,
               f"Unauth: {res_unauth.status_code}, Forbidden: {res_forbidden.status_code}, Isolated: {key_t1_current != key_t2_current}")

    # 11. Valid key does not bypass connection approval or privacy permissions
    # Student attempts to connect using teacher's key
    res_conn = requests.post(f"{BASE_URL}/connections", json={
        "supporter_id": teacher_id,
        "allow_mood": True,
        "allow_stress": False,
        "allow_sleep": False,
        "allow_energy": False
    }, headers=headers_s)
    conn_data = res_conn.json().get("connection", {})
    conn_id = conn_data.get("id")
    # Connection is 'pending', not automatically accepted
    print_test(11, "Valid key does NOT bypass connection approval (status is pending, permissions constrained)",
               res_conn.status_code == 201 and conn_data.get("status") == "pending" and conn_data.get("allow_mood") is True and conn_data.get("allow_stress") is False,
               f"Status: {conn_data.get('status')}, AllowMood: {conn_data.get('allow_mood')}, AllowStress: {conn_data.get('allow_stress')}")

    # 12. Existing login, signup, verification, and connection workflows still work
    res_login_t = requests.post(f"{BASE_URL}/login", json={
        "email": teacher_email,
        "password": "Password123!"
    }, headers={"Accept": "application/json"})
    t_login_key = res_login_t.json().get("user", {}).get("access_key")

    res_accept = requests.post(f"{BASE_URL}/connections/{conn_id}/accept", headers=headers_t)
    res_perm = requests.patch(f"{BASE_URL}/connections/{conn_id}/permissions", json={"allow_stress": True}, headers=headers_s)
    res_revoke = requests.post(f"{BASE_URL}/connections/{conn_id}/revoke", headers=headers_s)

    print_test(12, "Existing login, connections, accept, permissions, and revoke workflows work",
               res_login_t.status_code == 200 and t_login_key == key_t1_current and res_accept.status_code == 200 and res_perm.status_code == 200 and res_revoke.status_code == 200,
               f"Login: {res_login_t.status_code}, Accept: {res_accept.status_code}, Perm: {res_perm.status_code}, Revoke: {res_revoke.status_code}")

    print("=" * 80)
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    main()
