"""
Backend integration tests for Kindred Wealth Micronaut API.
Covers: health, auth (signup/login/me), validation, role enforcement,
self/admin access for /api/customers and PATCH onboarding updates,
and JWT persistence across backend restarts.
"""
import os
import time
import uuid
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://money-flow-429.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@kindred.local"
ADMIN_PASSWORD = "Admin@12345"


def _unique_email(tag="user"):
    # Backend lowercases emails on storage; keep our test emails lowercase to match.
    return f"test_{tag}_{uuid.uuid4().hex[:8]}@kindred.test"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "ADMIN"
    return data["token"]


@pytest.fixture
def new_customer(s):
    """Create a fresh customer; return dict {token, user, password, email}."""
    email = _unique_email("cust")
    password = "wealth1234"
    payload = {
        "fullName": "Test Customer",
        "email": email,
        "password": password,
        "phone": "+1 555 0100",
        "country": "US",
        "dateOfBirth": "1990-04-12",
    }
    r = s.post(f"{BASE_URL}/api/auth/signup", json=payload)
    assert r.status_code == 201, f"Signup failed: {r.status_code} {r.text}"
    data = r.json()
    data["password"] = password
    data["email"] = email
    return data


# ---------- Health ----------
class TestHealth:
    def test_health_ok(self, s):
        r = s.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ---------- Signup ----------
class TestSignup:
    def test_signup_success_returns_jwt_and_customer(self, s):
        email = _unique_email("signup")
        r = s.post(f"{BASE_URL}/api/auth/signup", json={
            "fullName": "Eleanor Hayes",
            "email": email,
            "password": "wealth1234",
            "phone": "+1 555 0100",
            "country": "US",
            "dateOfBirth": "1990-04-12",
        })
        assert r.status_code == 201, r.text
        body = r.json()
        assert isinstance(body.get("token"), str) and len(body["token"]) > 20
        u = body["user"]
        assert u["email"] == email
        assert u["fullName"] == "Eleanor Hayes"
        assert u["role"] == "CUSTOMER"
        assert u["phone"] == "+1 555 0100"
        assert u["country"] == "US"
        assert u["dateOfBirth"] == "1990-04-12"
        assert "id" in u

    def test_signup_duplicate_email_returns_409(self, s, new_customer):
        r = s.post(f"{BASE_URL}/api/auth/signup", json={
            "fullName": "Dup",
            "email": new_customer["email"],
            "password": "wealth1234",
            "phone": "+1 555 0101",
            "country": "US",
            "dateOfBirth": "1991-01-01",
        })
        assert r.status_code == 409, r.text
        body = r.json()
        # spec: error=email_taken
        assert body.get("error") == "email_taken" or "email" in str(body).lower()

    def test_signup_short_password_returns_400(self, s):
        r = s.post(f"{BASE_URL}/api/auth/signup", json={
            "fullName": "Short Pass",
            "email": _unique_email("short"),
            "password": "abc",
            "phone": "+1 555 0102",
            "country": "US",
            "dateOfBirth": "1990-01-01",
        })
        assert r.status_code == 400, r.text

    def test_signup_missing_fullname_returns_400(self, s):
        r = s.post(f"{BASE_URL}/api/auth/signup", json={
            "email": _unique_email("noname"),
            "password": "wealth1234",
            "phone": "+1 555 0103",
            "country": "US",
            "dateOfBirth": "1990-01-01",
        })
        assert r.status_code == 400, r.text


# ---------- Login ----------
class TestLogin:
    def test_login_success(self, s, new_customer):
        r = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": new_customer["email"],
            "password": new_customer["password"],
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["user"]["email"] == new_customer["email"]
        assert isinstance(body["token"], str)

    def test_login_wrong_password_returns_401(self, s, new_customer):
        r = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": new_customer["email"],
            "password": "wrongpass",
        })
        assert r.status_code == 401, r.text

    def test_login_unknown_email_returns_401(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": _unique_email("ghost"),
            "password": "wealth1234",
        })
        assert r.status_code == 401, r.text


# ---------- /api/me ----------
class TestMe:
    def test_me_with_token(self, s, new_customer):
        r = s.get(f"{BASE_URL}/api/me",
                  headers={"Authorization": f"Bearer {new_customer['token']}"})
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["email"] == new_customer["email"]
        assert u["role"] == "CUSTOMER"

    def test_me_without_token_unauthorized(self, s):
        # create a fresh session w/o auth header
        r = requests.get(f"{BASE_URL}/api/me")
        assert r.status_code == 401, r.text

    def test_me_with_bad_token(self, s):
        r = requests.get(f"{BASE_URL}/api/me",
                         headers={"Authorization": "Bearer not.a.real.jwt"})
        assert r.status_code == 401, r.text


# ---------- Role enforcement: /api/customers ----------
class TestCustomersList:
    def test_list_customers_admin_ok(self, s, admin_token, new_customer):
        r = s.get(f"{BASE_URL}/api/customers",
                  headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200, r.text
        items = r.json()
        assert isinstance(items, list)
        emails = [u.get("email") for u in items]
        assert new_customer["email"] in emails

    def test_list_customers_customer_forbidden(self, s, new_customer):
        r = s.get(f"{BASE_URL}/api/customers",
                  headers={"Authorization": f"Bearer {new_customer['token']}"})
        assert r.status_code == 403, r.text

    def test_list_customers_anonymous_unauthorized(self, s):
        r = requests.get(f"{BASE_URL}/api/customers")
        assert r.status_code == 401, r.text


# ---------- /api/customers/{id} self/admin access ----------
class TestCustomerDetail:
    def test_self_can_read_own(self, s, new_customer):
        uid = new_customer["user"]["id"]
        r = s.get(f"{BASE_URL}/api/customers/{uid}",
                  headers={"Authorization": f"Bearer {new_customer['token']}"})
        assert r.status_code == 200, r.text
        assert r.json()["id"] == uid

    def test_other_customer_forbidden(self, s, new_customer):
        # create a 2nd customer; first should not access second's record
        email2 = _unique_email("c2")
        r = s.post(f"{BASE_URL}/api/auth/signup", json={
            "fullName": "Second Cust",
            "email": email2,
            "password": "wealth1234",
            "phone": "+1 555 0200",
            "country": "GB",
            "dateOfBirth": "1992-02-02",
        })
        assert r.status_code == 201
        other_id = r.json()["user"]["id"]

        r2 = s.get(f"{BASE_URL}/api/customers/{other_id}",
                   headers={"Authorization": f"Bearer {new_customer['token']}"})
        assert r2.status_code == 403, r2.text

    def test_admin_can_read_any(self, s, admin_token, new_customer):
        uid = new_customer["user"]["id"]
        r = s.get(f"{BASE_URL}/api/customers/{uid}",
                  headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200, r.text
        assert r.json()["email"] == new_customer["email"]


# ---------- PATCH /api/customers/{id} ----------
class TestCustomerPatch:
    def test_patch_self_updates_onboarding_fields(self, s, new_customer):
        uid = new_customer["user"]["id"]
        r = s.patch(f"{BASE_URL}/api/customers/{uid}",
                    headers={"Authorization": f"Bearer {new_customer['token']}"},
                    json={"phone": "+1 555 9999", "country": "CA"})
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["phone"] == "+1 555 9999"
        assert u["country"] == "CA"

        # verify persisted via GET
        r2 = s.get(f"{BASE_URL}/api/customers/{uid}",
                   headers={"Authorization": f"Bearer {new_customer['token']}"})
        assert r2.status_code == 200
        assert r2.json()["phone"] == "+1 555 9999"
        assert r2.json()["country"] == "CA"

    def test_patch_other_customer_forbidden(self, s, new_customer):
        email2 = _unique_email("victim")
        r = s.post(f"{BASE_URL}/api/auth/signup", json={
            "fullName": "Victim",
            "email": email2,
            "password": "wealth1234",
            "phone": "+1 555 0300",
            "country": "DE",
            "dateOfBirth": "1985-05-05",
        })
        assert r.status_code == 201
        other_id = r.json()["user"]["id"]

        r2 = s.patch(f"{BASE_URL}/api/customers/{other_id}",
                     headers={"Authorization": f"Bearer {new_customer['token']}"},
                     json={"country": "ZZ"})
        assert r2.status_code == 403, r2.text


# ---------- JWT persistence across restart ----------
class TestJwtPersistence:
    def test_token_still_valid_after_backend_restart(self, s, new_customer):
        token = new_customer["token"]
        # ensure it works first
        r0 = s.get(f"{BASE_URL}/api/me",
                   headers={"Authorization": f"Bearer {token}"})
        assert r0.status_code == 200

        # Restart backend (JWT_SECRET fixed in supervisor env, H2 file persists)
        try:
            subprocess.run(["sudo", "supervisorctl", "restart", "backend"],
                           check=True, capture_output=True, timeout=30)
        except Exception as e:
            pytest.skip(f"Cannot restart backend in this env: {e}")

        # wait for backend to come back up
        deadline = time.time() + 60
        ok = False
        while time.time() < deadline:
            try:
                h = requests.get(f"{BASE_URL}/api/health", timeout=3)
                if h.status_code == 200:
                    ok = True
                    break
            except Exception:
                pass
            time.sleep(2)
        assert ok, "Backend did not come back up within 60s"

        r1 = requests.get(f"{BASE_URL}/api/me",
                          headers={"Authorization": f"Bearer {token}"})
        assert r1.status_code == 200, f"Token rejected after restart: {r1.status_code} {r1.text}"
        assert r1.json()["email"] == new_customer["email"]
