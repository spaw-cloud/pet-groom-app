"""
Iteration 6 - Full Regression Test Suite for Spaw Group Pet Grooming PWA
Tests: API endpoints, auth flows, admin features, availability management
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-groom-react.preview.emergentagent.com')

# Test credentials
CUSTOMER = {"email": "spawcbe@gmail.com", "phone": "8778454723", "name": "Ashwath"}
ADMIN1 = {"phone": "8778454723", "password": "Sp@wappleid2026", "name": "Ashwath"}
ADMIN2 = {"phone": "9361011959", "password": "Sp@wappleid2026", "name": "Admin 2"}


class TestPWAFiles:
    """Test PWA manifest and static files"""

    def test_manifest_json(self):
        """PWA manifest should return 200"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200, f"manifest.json failed: {response.status_code}"
        data = response.json()
        assert data.get("name") == "Spaw Group - Pet Grooming"
        print("PASS: manifest.json returns 200 with correct app name")

    def test_notification_wav(self):
        """Notification sound file should return 200"""
        response = requests.head(f"{BASE_URL}/notification.wav")
        assert response.status_code == 200, f"notification.wav failed: {response.status_code}"
        assert "audio/wav" in response.headers.get("content-type", "")
        print("PASS: notification.wav returns 200")

    def test_apple_touch_icon(self):
        """Apple touch icon should return 200"""
        response = requests.head(f"{BASE_URL}/apple-touch-icon.png")
        assert response.status_code == 200, f"apple-touch-icon.png failed: {response.status_code}"
        assert "image/png" in response.headers.get("content-type", "")
        print("PASS: apple-touch-icon.png returns 200")


class TestServicesAPI:
    """Test services API endpoint"""

    def test_get_services(self):
        """GET /api/services should return 4 dog services"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200, f"Failed: {response.status_code}"
        services = response.json()
        assert len(services) == 4, f"Expected 4 services, got {len(services)}"
        
        # Verify service names
        service_names = [s["name"] for s in services]
        assert "Signature Bath (For Dogs)" in service_names
        assert "Express Trim (For Dogs)" in service_names
        assert "Signature Trim (For Dogs)" in service_names
        assert "Pro Bath Membership (For Dogs)" in service_names
        
        # Verify prices
        prices = {s["name"]: s["price"] for s in services}
        assert prices["Signature Bath (For Dogs)"] == 999
        assert prices["Express Trim (For Dogs)"] == 1299
        assert prices["Signature Trim (For Dogs)"] == 1999
        assert prices["Pro Bath Membership (For Dogs)"] == 830
        
        # Verify all have images
        for s in services:
            assert s.get("image_url"), f"Service {s['name']} missing image_url"
        
        print(f"PASS: GET /api/services - {len(services)} services with correct prices and images")


class TestCustomerAuth:
    """Test customer authentication flow"""

    def test_direct_login_existing_user(self):
        """POST /api/auth/login should work for existing user without OTP"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER["email"],
            "phone": CUSTOMER["phone"]
        })
        assert response.status_code == 200, f"Direct login failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "session_token" in data, "No session_token in response"
        assert data.get("email") == CUSTOMER["email"]
        assert data.get("name") == CUSTOMER["name"]
        print(f"PASS: Direct login works for existing user {CUSTOMER['email']}")
        return data["session_token"]

    def test_login_new_user_returns_404(self):
        """POST /api/auth/login for new user should return 404 (NEW_USER)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "newuser_test_12345@example.com",
            "phone": "9999999999"
        })
        assert response.status_code == 404, f"Expected 404 for new user, got {response.status_code}"
        print("PASS: New user login returns 404 (triggers OTP flow)")

    def test_auth_me_with_token(self):
        """GET /api/auth/me should return user info with valid token"""
        # First login to get token
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER["email"],
            "phone": CUSTOMER["phone"]
        })
        assert login_res.status_code == 200
        token = login_res.json()["session_token"]
        
        # Then check /auth/me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200, f"auth/me failed: {response.status_code}"
        data = response.json()
        assert data.get("email") == CUSTOMER["email"]
        print("PASS: GET /api/auth/me returns user info with valid token")

    def test_logout(self):
        """POST /api/auth/logout should invalidate session"""
        # Login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER["email"],
            "phone": CUSTOMER["phone"]
        })
        token = login_res.json()["session_token"]
        
        # Logout
        response = requests.post(f"{BASE_URL}/api/auth/logout", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200, f"Logout failed: {response.status_code}"
        
        # Verify token is invalid after logout
        me_res = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert me_res.status_code == 401, "Token should be invalid after logout"
        print("PASS: Logout invalidates session token")


class TestCustomerEndpoints:
    """Test customer-facing API endpoints"""

    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER["email"],
            "phone": CUSTOMER["phone"]
        })
        self.token = response.json()["session_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_get_pets(self):
        """GET /api/pets should return user's pets"""
        response = requests.get(f"{BASE_URL}/api/pets", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        pets = response.json()
        assert isinstance(pets, list)
        print(f"PASS: GET /api/pets returns {len(pets)} pets")

    def test_get_bookings(self):
        """GET /api/bookings should return user's bookings with service/pet names"""
        response = requests.get(f"{BASE_URL}/api/bookings", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        bookings = response.json()
        assert isinstance(bookings, list)
        # Verify enriched data
        if bookings:
            assert "service_name" in bookings[0]
            assert "pet_name" in bookings[0]
        print(f"PASS: GET /api/bookings returns {len(bookings)} bookings with enriched data")

    def test_get_addresses(self):
        """GET /api/addresses should return user's addresses"""
        response = requests.get(f"{BASE_URL}/api/addresses", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        addresses = response.json()
        assert isinstance(addresses, list)
        print(f"PASS: GET /api/addresses returns {len(addresses)} addresses")

    def test_get_notifications(self):
        """GET /api/notifications should return user's notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        print("PASS: GET /api/notifications returns 200")

    def test_get_notifications_unread_count(self):
        """GET /api/notifications/unread-count should return count"""
        response = requests.get(f"{BASE_URL}/api/notifications/unread-count", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        data = response.json()
        assert "count" in data
        print(f"PASS: GET /api/notifications/unread-count returns count: {data['count']}")

    def test_get_booked_slots(self):
        """GET /api/bookings/booked-slots should return slots for date"""
        response = requests.get(f"{BASE_URL}/api/bookings/booked-slots?date=2026-03-10", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        data = response.json()
        assert "booked_slots" in data
        assert "day_blocked" in data
        print(f"PASS: GET /api/bookings/booked-slots returns booked_slots and day_blocked flag")

    def test_get_blocked_dates_for_client(self):
        """GET /api/availability/blocked-dates should return blocked dates for calendar"""
        response = requests.get(f"{BASE_URL}/api/availability/blocked-dates", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/availability/blocked-dates returns {len(data)} blocked dates")


class TestAdminAuth:
    """Test admin authentication - both admin accounts"""

    def test_admin1_login(self):
        """POST /api/admin/login for Admin 1 (Ashwath)"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN1["phone"],
            "password": ADMIN1["password"]
        })
        assert response.status_code == 200, f"Admin1 login failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "token" in data
        assert data["admin"]["name"] == ADMIN1["name"]
        print(f"PASS: Admin 1 ({ADMIN1['name']}) login successful")
        return data["token"]

    def test_admin2_login(self):
        """POST /api/admin/login for Admin 2"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN2["phone"],
            "password": ADMIN2["password"]
        })
        assert response.status_code == 200, f"Admin2 login failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "token" in data
        assert data["admin"]["name"] == ADMIN2["name"]
        print(f"PASS: Admin 2 ({ADMIN2['name']}) login successful")
        return data["token"]

    def test_admin_invalid_credentials(self):
        """POST /api/admin/login with wrong password should fail"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN1["phone"],
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Admin login with wrong credentials returns 401")


class TestAdminEndpoints:
    """Test admin API endpoints"""

    @pytest.fixture(autouse=True)
    def setup_admin_auth(self):
        """Get admin token for tests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN1["phone"],
            "password": ADMIN1["password"]
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_admin_dashboard(self):
        """GET /api/admin/dashboard should return stats"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        data = response.json()
        
        # Verify all expected stats fields
        expected_fields = [
            "total_customers", "total_bookings", "pending_bookings",
            "confirmed_bookings", "completed_bookings", "cancelled_bookings",
            "total_pets", "total_services", "total_revenue", "recent_bookings"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"PASS: Admin dashboard - {data['total_customers']} customers, {data['total_bookings']} bookings, ₹{data['total_revenue']} revenue")

    def test_admin_get_bookings(self):
        """GET /api/admin/bookings should return all bookings with enriched data"""
        response = requests.get(f"{BASE_URL}/api/admin/bookings", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        bookings = response.json()
        assert isinstance(bookings, list)
        
        # Verify enriched data
        if bookings:
            assert "customer" in bookings[0]
            assert "service_details" in bookings[0]
            assert "pet_details" in bookings[0]
        
        print(f"PASS: GET /api/admin/bookings returns {len(bookings)} bookings with customer/service/pet details")

    def test_admin_get_customers(self):
        """GET /api/admin/customers should return all customers"""
        response = requests.get(f"{BASE_URL}/api/admin/customers", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        customers = response.json()
        assert isinstance(customers, list)
        
        # Verify enriched data
        if customers:
            assert "booking_count" in customers[0]
            assert "pet_count" in customers[0]
        
        print(f"PASS: GET /api/admin/customers returns {len(customers)} customers with booking/pet counts")

    def test_admin_get_services(self):
        """GET /api/admin/services should return all services"""
        response = requests.get(f"{BASE_URL}/api/admin/services", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        services = response.json()
        assert len(services) == 4
        print(f"PASS: GET /api/admin/services returns {len(services)} services")

    def test_admin_notifications(self):
        """GET /api/admin/notifications should return admin notifications"""
        response = requests.get(f"{BASE_URL}/api/admin/notifications", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        print("PASS: GET /api/admin/notifications returns 200")

    def test_admin_notifications_unread_count(self):
        """GET /api/admin/notifications/unread-count should return count"""
        response = requests.get(f"{BASE_URL}/api/admin/notifications/unread-count", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        data = response.json()
        assert "count" in data
        print(f"PASS: GET /api/admin/notifications/unread-count returns count: {data['count']}")


class TestAvailabilityManagement:
    """Test admin availability (Timer) management APIs"""

    @pytest.fixture(autouse=True)
    def setup_admin_auth(self):
        """Get admin token for tests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN1["phone"],
            "password": ADMIN1["password"]
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_get_blocked_slots(self):
        """GET /api/admin/availability/blocked should return blocked slots"""
        response = requests.get(f"{BASE_URL}/api/admin/availability/blocked", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/admin/availability/blocked returns {len(data)} blocked slots")

    def test_block_and_unblock_time_slot(self):
        """POST /api/admin/availability/block and unblock should work"""
        test_date = "2026-12-25"
        test_time = "10:30 AM"
        
        # Block a specific time slot
        block_res = requests.post(f"{BASE_URL}/api/admin/availability/block", 
            json={"date": test_date, "time": test_time},
            headers=self.headers
        )
        assert block_res.status_code == 200, f"Block failed: {block_res.status_code}"
        print(f"PASS: Blocked time slot {test_time} on {test_date}")
        
        # Unblock the time slot
        unblock_res = requests.post(f"{BASE_URL}/api/admin/availability/unblock",
            json={"date": test_date, "time": test_time},
            headers=self.headers
        )
        assert unblock_res.status_code == 200, f"Unblock failed: {unblock_res.status_code}"
        print(f"PASS: Unblocked time slot {test_time} on {test_date}")

    def test_block_and_unblock_entire_day(self):
        """POST /api/admin/availability/block entire day should work"""
        test_date = "2026-12-31"
        
        # Block entire day
        block_res = requests.post(f"{BASE_URL}/api/admin/availability/block",
            json={"date": test_date, "time": None},
            headers=self.headers
        )
        assert block_res.status_code == 200, f"Block day failed: {block_res.status_code}"
        print(f"PASS: Blocked entire day {test_date}")
        
        # Unblock entire day
        unblock_res = requests.post(f"{BASE_URL}/api/admin/availability/unblock",
            json={"date": test_date, "time": None},
            headers=self.headers
        )
        assert unblock_res.status_code == 200, f"Unblock day failed: {unblock_res.status_code}"
        print(f"PASS: Unblocked entire day {test_date}")

    def test_admin_blocked_dates_endpoint(self):
        """GET /api/admin/availability/blocked-dates should return blocked dates list"""
        response = requests.get(f"{BASE_URL}/api/admin/availability/blocked-dates", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/admin/availability/blocked-dates returns {len(data)} blocked dates")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
