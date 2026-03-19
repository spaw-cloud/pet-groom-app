"""
Spaw Group - Full Regression Test Suite (Iteration 5)
Tests: Auth, Services, Admin, Availability Management, Bookings
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-groom-react.preview.emergentagent.com')

# Test credentials
CUSTOMER_CREDS = {"email": "spawcbe@gmail.com", "phone": "8778454723"}
ADMIN1_CREDS = {"phone": "8778454723", "password": "Sp@wappleid2026"}
ADMIN2_CREDS = {"phone": "9361011959", "password": "Sp@wappleid2026"}

# ==================== Health & Services Tests ====================

class TestServicesAPI:
    """Service endpoint tests"""
    
    def test_get_services_returns_4_services(self):
        """Services API returns 4 dog grooming services"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        
        services = response.json()
        assert len(services) == 4, f"Expected 4 services, got {len(services)}"
        
        # Verify service names
        service_names = [s["name"] for s in services]
        assert "Signature Bath (For Dogs)" in service_names
        assert "Express Trim (For Dogs)" in service_names
        assert "Signature Trim (For Dogs)" in service_names
        assert "Pro Bath Membership (For Dogs)" in service_names
    
    def test_services_have_images_and_prices(self):
        """Each service has image_url and price"""
        response = requests.get(f"{BASE_URL}/api/services")
        services = response.json()
        
        for svc in services:
            assert "image_url" in svc and svc["image_url"], f"Service {svc['name']} missing image_url"
            assert "price" in svc and svc["price"] > 0, f"Service {svc['name']} missing price"
            assert "included_services" in svc and len(svc["included_services"]) > 0


# ==================== Auth Tests ====================

class TestAuthAPI:
    """Authentication tests"""
    
    def test_existing_user_direct_login(self):
        """Existing user can login without OTP"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_CREDS)
        assert response.status_code == 200
        
        data = response.json()
        assert "session_token" in data
        assert data["email"] == CUSTOMER_CREDS["email"]
        assert data["phone"] == CUSTOMER_CREDS["phone"]
    
    def test_new_user_returns_404(self):
        """New user (non-existing) returns 404 - triggers OTP flow"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "phone": "0000000000"
        })
        assert response.status_code == 404
        assert "NEW_USER" in response.json().get("detail", "")
    
    def test_auth_me_with_valid_token(self):
        """GET /api/auth/me returns user info"""
        # First login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_CREDS)
        token = login_res.json()["session_token"]
        
        # Check /me
        me_res = requests.get(f"{BASE_URL}/api/auth/me", 
            headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["email"] == CUSTOMER_CREDS["email"]
    
    def test_logout_invalidates_session(self):
        """Logout properly invalidates session"""
        # Login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_CREDS)
        token = login_res.json()["session_token"]
        
        # Logout
        logout_res = requests.post(f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"})
        assert logout_res.status_code == 200
        
        # Token should be invalid now
        me_res = requests.get(f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 401


# ==================== Admin Tests ====================

class TestAdminAPI:
    """Admin authentication and dashboard tests"""
    
    def test_admin1_login(self):
        """Admin 1 (Ashwath) can login"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN1_CREDS)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "token" in data
        assert data["admin"]["name"] == "Ashwath"
        assert data["admin"]["phone"] == "8778454723"
    
    def test_admin2_login(self):
        """Admin 2 can login"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN2_CREDS)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "token" in data
        assert data["admin"]["name"] == "Admin 2"
        assert data["admin"]["phone"] == "9361011959"
    
    def test_admin_dashboard(self):
        """Admin dashboard returns stats"""
        # Login
        login_res = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN1_CREDS)
        token = login_res.json()["token"]
        
        # Dashboard
        dash_res = requests.get(f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {token}"})
        assert dash_res.status_code == 200
        
        data = dash_res.json()
        # Verify all stat fields exist
        assert "total_customers" in data
        assert "total_bookings" in data
        assert "pending_bookings" in data
        assert "confirmed_bookings" in data
        assert "completed_bookings" in data
        assert "cancelled_bookings" in data
        assert "total_services" in data
        assert "total_pets" in data
        assert "total_revenue" in data
    
    def test_admin_bookings_list(self):
        """Admin can get all bookings"""
        login_res = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN1_CREDS)
        token = login_res.json()["token"]
        
        bookings_res = requests.get(f"{BASE_URL}/api/admin/bookings",
            headers={"Authorization": f"Bearer {token}"})
        assert bookings_res.status_code == 200
        assert isinstance(bookings_res.json(), list)
    
    def test_admin_customers_list(self):
        """Admin can get all customers"""
        login_res = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN1_CREDS)
        token = login_res.json()["token"]
        
        customers_res = requests.get(f"{BASE_URL}/api/admin/customers",
            headers={"Authorization": f"Bearer {token}"})
        assert customers_res.status_code == 200
        assert isinstance(customers_res.json(), list)
    
    def test_admin_services_list(self):
        """Admin can get all services"""
        login_res = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN1_CREDS)
        token = login_res.json()["token"]
        
        services_res = requests.get(f"{BASE_URL}/api/admin/services",
            headers={"Authorization": f"Bearer {token}"})
        assert services_res.status_code == 200
        assert len(services_res.json()) == 4


# ==================== Availability Management Tests (Timer feature) ====================

class TestAvailabilityAPI:
    """Timer/Availability management tests"""
    
    def test_admin_get_blocked_slots(self):
        """Admin can get blocked slots"""
        login_res = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN1_CREDS)
        token = login_res.json()["token"]
        
        blocked_res = requests.get(f"{BASE_URL}/api/admin/availability/blocked",
            headers={"Authorization": f"Bearer {token}"})
        assert blocked_res.status_code == 200
        assert isinstance(blocked_res.json(), list)
    
    def test_admin_block_and_unblock_slot(self):
        """Admin can block and unblock a time slot"""
        login_res = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN1_CREDS)
        token = login_res.json()["token"]
        
        test_date = "2026-03-15"
        test_time = "11:00 AM"
        
        # Block slot
        block_res = requests.post(f"{BASE_URL}/api/admin/availability/block",
            json={"date": test_date, "time": test_time},
            headers={"Authorization": f"Bearer {token}"})
        assert block_res.status_code == 200
        
        # Verify blocked
        blocked_res = requests.get(f"{BASE_URL}/api/admin/availability/blocked",
            headers={"Authorization": f"Bearer {token}"})
        blocked = blocked_res.json()
        found = any(b["date"] == test_date and b["time"] == test_time for b in blocked)
        assert found, f"Slot {test_date} {test_time} not found in blocked list"
        
        # Unblock slot
        unblock_res = requests.post(f"{BASE_URL}/api/admin/availability/unblock",
            json={"date": test_date, "time": test_time},
            headers={"Authorization": f"Bearer {token}"})
        assert unblock_res.status_code == 200
    
    def test_admin_block_entire_day(self):
        """Admin can block/unblock entire day"""
        login_res = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN1_CREDS)
        token = login_res.json()["token"]
        
        test_date = "2026-03-20"
        
        # Block entire day (time=null)
        block_res = requests.post(f"{BASE_URL}/api/admin/availability/block",
            json={"date": test_date, "time": None},
            headers={"Authorization": f"Bearer {token}"})
        assert block_res.status_code == 200
        
        # Verify in blocked dates list
        dates_res = requests.get(f"{BASE_URL}/api/admin/availability/blocked-dates",
            headers={"Authorization": f"Bearer {token}"})
        assert test_date in dates_res.json()
        
        # Unblock
        unblock_res = requests.post(f"{BASE_URL}/api/admin/availability/unblock",
            json={"date": test_date, "time": None},
            headers={"Authorization": f"Bearer {token}"})
        assert unblock_res.status_code == 200
    
    def test_client_blocked_dates_endpoint(self):
        """Client can get blocked dates for calendar"""
        # Login as customer
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_CREDS)
        token = login_res.json()["session_token"]
        
        # Get blocked dates
        blocked_res = requests.get(f"{BASE_URL}/api/availability/blocked-dates",
            headers={"Authorization": f"Bearer {token}"})
        assert blocked_res.status_code == 200
        assert isinstance(blocked_res.json(), list)


# ==================== Booking & Time Slots Tests ====================

class TestBookingTimeSlots:
    """Time slot availability tests"""
    
    def test_booked_slots_endpoint(self):
        """Client can get booked slots for a date"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_CREDS)
        token = login_res.json()["session_token"]
        
        # Get booked slots for tomorrow
        from datetime import datetime, timedelta
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        slots_res = requests.get(f"{BASE_URL}/api/bookings/booked-slots?date={tomorrow}",
            headers={"Authorization": f"Bearer {token}"})
        assert slots_res.status_code == 200
        
        data = slots_res.json()
        assert "date" in data
        assert "booked_slots" in data
        assert "day_blocked" in data


# ==================== User Bookings Tests ====================

class TestUserBookings:
    """User booking tests"""
    
    def test_get_user_bookings(self):
        """User can get their bookings"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_CREDS)
        token = login_res.json()["session_token"]
        
        bookings_res = requests.get(f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {token}"})
        assert bookings_res.status_code == 200
        assert isinstance(bookings_res.json(), list)
    
    def test_get_user_pets(self):
        """User can get their pets"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_CREDS)
        token = login_res.json()["session_token"]
        
        pets_res = requests.get(f"{BASE_URL}/api/pets",
            headers={"Authorization": f"Bearer {token}"})
        assert pets_res.status_code == 200
        assert isinstance(pets_res.json(), list)
    
    def test_get_user_addresses(self):
        """User can get their addresses"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_CREDS)
        token = login_res.json()["session_token"]
        
        addresses_res = requests.get(f"{BASE_URL}/api/addresses",
            headers={"Authorization": f"Bearer {token}"})
        assert addresses_res.status_code == 200
        assert isinstance(addresses_res.json(), list)


# ==================== Notification Tests ====================

class TestNotifications:
    """Notification tests"""
    
    def test_user_notifications(self):
        """User can get their notifications"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_CREDS)
        token = login_res.json()["session_token"]
        
        notif_res = requests.get(f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {token}"})
        assert notif_res.status_code == 200
    
    def test_user_unread_count(self):
        """User can get unread notification count"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_CREDS)
        token = login_res.json()["session_token"]
        
        count_res = requests.get(f"{BASE_URL}/api/notifications/unread-count",
            headers={"Authorization": f"Bearer {token}"})
        assert count_res.status_code == 200
        assert "count" in count_res.json()
    
    def test_admin_notifications(self):
        """Admin can get notifications"""
        login_res = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN1_CREDS)
        token = login_res.json()["token"]
        
        notif_res = requests.get(f"{BASE_URL}/api/admin/notifications",
            headers={"Authorization": f"Bearer {token}"})
        assert notif_res.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
