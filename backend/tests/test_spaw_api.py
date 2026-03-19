"""
Spaw Group Pet Grooming API Tests
Tests for: Auth, Services, Pets, Bookings, Booked-slots, Admin features
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-groom-react.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_PHONE = "9876543210"
TEST_OTP = "123456"
ADMIN_PHONE = "8778454723"
ADMIN_PASSWORD = "Sp@wappleid2026"


class TestHealthAndServices:
    """Test basic API availability and services endpoint"""

    def test_services_endpoint(self):
        """GET /api/services should return list of services"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        services = response.json()
        assert isinstance(services, list)
        assert len(services) >= 1
        # Verify service structure
        service = services[0]
        assert "service_id" in service
        assert "name" in service
        assert "price" in service
        print(f"✓ Services endpoint returns {len(services)} services")


class TestAuthentication:
    """Test OTP-based authentication flow"""

    def test_send_otp(self):
        """POST /api/auth/send-otp should send OTP (mocked)"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["phone"] == TEST_PHONE
        print(f"✓ OTP sent successfully to {TEST_PHONE}")

    def test_verify_otp_valid(self):
        """POST /api/auth/verify-otp should authenticate with valid OTP"""
        # First send OTP
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
        
        # Verify OTP
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP
        })
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data
        assert "user_id" in data
        assert data.get("phone") == TEST_PHONE
        print(f"✓ OTP verification successful, session token received")
        return data["session_token"]

    def test_verify_otp_invalid(self):
        """POST /api/auth/verify-otp with wrong OTP should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TEST_PHONE,
            "otp": "000000"
        })
        assert response.status_code == 401
        print("✓ Invalid OTP correctly rejected")


class TestBookedSlots:
    """Test booked-slots endpoint - Feature 1"""

    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP
        })
        return response.json()["session_token"]

    def test_booked_slots_requires_auth(self):
        """GET /api/bookings/booked-slots without auth should fail"""
        today = datetime.now().strftime('%Y-%m-%d')
        response = requests.get(f"{BASE_URL}/api/bookings/booked-slots?date={today}")
        assert response.status_code == 401
        print("✓ Booked-slots endpoint requires authentication")

    def test_booked_slots_returns_data(self, auth_token):
        """GET /api/bookings/booked-slots should return booked slots for a date"""
        today = datetime.now().strftime('%Y-%m-%d')
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/bookings/booked-slots?date={today}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "date" in data
        assert "booked_slots" in data
        assert data["date"] == today
        assert isinstance(data["booked_slots"], list)
        print(f"✓ Booked-slots returns: date={data['date']}, slots={data['booked_slots']}")


class TestPetsCRUD:
    """Test pets CRUD operations"""

    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP
        })
        return response.json()["session_token"]

    def test_create_pet(self, auth_token):
        """POST /api/pets should create a pet"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        pet_data = {
            "name": "TEST_Buddy",
            "breed": "Golden Retriever",
            "age": 3,
            "weight": "25 kg"
        }
        response = requests.post(f"{BASE_URL}/api/pets", json=pet_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == pet_data["name"]
        assert data["breed"] == pet_data["breed"]
        assert "pet_id" in data
        print(f"✓ Pet created: {data['name']} ({data['pet_id']})")
        return data["pet_id"]

    def test_get_pets(self, auth_token):
        """GET /api/pets should return user's pets"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/pets", headers=headers)
        assert response.status_code == 200
        pets = response.json()
        assert isinstance(pets, list)
        print(f"✓ Get pets returns {len(pets)} pets")


class TestBookingFlow:
    """Test complete booking flow including booked slots verification"""

    @pytest.fixture
    def auth_session(self):
        """Get authentication token and ensure test pet exists"""
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP
        })
        token = response.json()["session_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Ensure a test pet exists
        pets_resp = requests.get(f"{BASE_URL}/api/pets", headers=headers)
        pets = pets_resp.json()
        if not pets:
            pet_resp = requests.post(f"{BASE_URL}/api/pets", json={
                "name": "TEST_BookingDog",
                "breed": "Labrador"
            }, headers=headers)
            pet_id = pet_resp.json()["pet_id"]
        else:
            pet_id = pets[0]["pet_id"]
        
        # Get a service
        services_resp = requests.get(f"{BASE_URL}/api/services")
        service_id = services_resp.json()[0]["service_id"]
        
        return {"token": token, "headers": headers, "pet_id": pet_id, "service_id": service_id}

    def test_create_booking_and_verify_slot_blocked(self, auth_session):
        """Create a booking and verify the slot shows as booked"""
        headers = auth_session["headers"]
        pet_id = auth_session["pet_id"]
        service_id = auth_session["service_id"]
        
        # Use a future date to avoid conflicts
        booking_date = (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d')
        booking_time = "11:00"
        
        # Check slots before booking
        slots_before = requests.get(
            f"{BASE_URL}/api/bookings/booked-slots?date={booking_date}",
            headers=headers
        ).json()
        initial_booked = slots_before.get("booked_slots", [])
        print(f"Initial booked slots for {booking_date}: {initial_booked}")
        
        # Create booking
        booking_data = {
            "pet_id": pet_id,
            "service_id": service_id,
            "date": booking_date,
            "time": booking_time,
            "address": "123 Test Street, Test City",
            "payment_type": "post_service"
        }
        response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data, headers=headers)
        assert response.status_code == 200
        booking = response.json()
        assert booking["date"] == booking_date
        assert booking["time"] == booking_time
        booking_id = booking["booking_id"]
        print(f"✓ Booking created: {booking_id} for {booking_date} at {booking_time}")
        
        # Check slots after booking - the time should now be booked
        slots_after = requests.get(
            f"{BASE_URL}/api/bookings/booked-slots?date={booking_date}",
            headers=headers
        ).json()
        assert booking_time in slots_after["booked_slots"], \
            f"Expected {booking_time} in booked slots, got {slots_after['booked_slots']}"
        print(f"✓ Time slot {booking_time} correctly shows as booked after booking")
        
        # Cleanup - cancel the booking
        requests.delete(f"{BASE_URL}/api/bookings/{booking_id}", headers=headers)
        print(f"✓ Test booking cancelled")

    def test_get_bookings(self, auth_session):
        """GET /api/bookings should return user's bookings with enriched data"""
        headers = auth_session["headers"]
        response = requests.get(f"{BASE_URL}/api/bookings", headers=headers)
        assert response.status_code == 200
        bookings = response.json()
        assert isinstance(bookings, list)
        # Check enriched fields if bookings exist
        if bookings:
            b = bookings[0]
            assert "service_name" in b
            assert "pet_name" in b
        print(f"✓ Get bookings returns {len(bookings)} bookings with enriched data")


class TestAdminAuth:
    """Test admin authentication - Feature 5"""

    def test_admin_login_valid(self):
        """POST /api/admin/login with valid credentials should succeed"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "token" in data
        assert "admin" in data
        assert data["admin"]["phone"] == ADMIN_PHONE
        print(f"✓ Admin login successful for {ADMIN_PHONE}")
        return data["token"]

    def test_admin_login_invalid(self):
        """POST /api/admin/login with invalid credentials should fail"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN_PHONE,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid admin credentials correctly rejected")

    def test_admin_dashboard_requires_auth(self):
        """GET /api/admin/dashboard without auth should fail"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 401
        print("✓ Admin dashboard correctly requires authentication")

    def test_admin_dashboard_with_auth(self):
        """GET /api/admin/dashboard with valid token should return stats"""
        # Login first
        login_resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        token = login_resp.json()["token"]
        
        # Access dashboard
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_customers" in data
        assert "total_bookings" in data
        assert "total_services" in data
        print(f"✓ Admin dashboard returns stats: {data['total_customers']} customers, {data['total_bookings']} bookings")


class TestAddresses:
    """Test address management"""

    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP
        })
        return response.json()["session_token"]

    def test_create_address(self, auth_token):
        """POST /api/addresses should create an address"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        address_data = {
            "house_number": "TEST_123",
            "street": "Test Street",
            "area": "Test Area",
            "city": "Test City",
            "pincode": "123456",
            "is_default": True
        }
        response = requests.post(f"{BASE_URL}/api/addresses", json=address_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["house_number"] == address_data["house_number"]
        assert "address_id" in data
        print(f"✓ Address created: {data['address_id']}")

    def test_get_addresses(self, auth_token):
        """GET /api/addresses should return user's addresses"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/addresses", headers=headers)
        assert response.status_code == 200
        addresses = response.json()
        assert isinstance(addresses, list)
        print(f"✓ Get addresses returns {len(addresses)} addresses")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
