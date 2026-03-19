"""
Full Regression Test Suite for Spaw Group Pet Grooming PWA
Tests: Auth, Services, Bookings, Pets, Addresses, Admin, Notifications, PWA files
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-groom-react.preview.emergentagent.com').rstrip('/')

# Test credentials from the review_request
EXISTING_USER = {
    "name": "Ashwath",
    "email": "spawcbe@gmail.com", 
    "phone": "8778454723"
}

ADMIN_CREDS = {
    "phone": "8778454723",
    "password": "Sp@wappleid2026"
}

class TestHealthAndServices:
    """Health check and services API tests"""
    
    def test_services_endpoint(self):
        """GET /api/services should return 4 dog grooming services"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        
        services = response.json()
        assert len(services) == 4, f"Expected 4 services, got {len(services)}"
        
        # Verify service names and prices
        service_prices = {s["name"]: s["price"] for s in services}
        expected_prices = {
            "Signature Bath (For Dogs)": 999.0,
            "Express Trim (For Dogs)": 1199.0,
            "Signature Trim (For Dogs)": 1999.0,
            "Pro Bath Membership (For Dogs)": 830.0
        }
        
        for name, price in expected_prices.items():
            assert name in service_prices, f"Missing service: {name}"
            assert service_prices[name] == price, f"Price mismatch for {name}: expected {price}, got {service_prices[name]}"
        
        # Verify each service has image_url
        for svc in services:
            assert svc.get("image_url"), f"Service {svc['name']} missing image_url"
            assert svc.get("included_services"), f"Service {svc['name']} missing included_services"
        
        print(f"✓ Services API returned {len(services)} services with correct prices")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_direct_login_existing_user(self):
        """Returning user should login directly without OTP"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_USER["email"],
            "phone": EXISTING_USER["phone"]
        })
        
        assert response.status_code == 200, f"Direct login failed: {response.text}"
        
        data = response.json()
        assert "session_token" in data, "Missing session_token in response"
        assert "user_id" in data, "Missing user_id in response"
        assert data.get("email") == EXISTING_USER["email"]
        
        print(f"✓ Direct login for existing user {EXISTING_USER['email']} successful")
        return data["session_token"]
    
    def test_direct_login_nonexistent_user(self):
        """Non-existent user should get 404 (NEW_USER)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent_test_1234@test.com",
            "phone": "9999999999"
        })
        
        assert response.status_code == 404, f"Expected 404 for new user, got {response.status_code}"
        assert "NEW_USER" in response.text or "detail" in response.json()
        
        print("✓ Non-existent user correctly returns 404")
    
    def test_auth_me_with_valid_token(self):
        """GET /api/auth/me should return user info with valid token"""
        # First login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_USER["email"],
            "phone": EXISTING_USER["phone"]
        })
        token = login_resp.json().get("session_token")
        
        # Get user info
        response = requests.get(f"{BASE_URL}/api/auth/me", 
            headers={"Authorization": f"Bearer {token}"})
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("email") == EXISTING_USER["email"]
        
        print("✓ GET /api/auth/me returns correct user info")
    
    def test_auth_me_without_token(self):
        """GET /api/auth/me should return 401 without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        
        print("✓ GET /api/auth/me correctly returns 401 without token")
    
    def test_logout(self):
        """POST /api/auth/logout should invalidate session"""
        # Login first
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_USER["email"],
            "phone": EXISTING_USER["phone"]
        })
        token = login_resp.json().get("session_token")
        
        # Logout
        logout_resp = requests.post(f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"})
        assert logout_resp.status_code == 200
        
        # Verify token is invalidated
        me_resp = requests.get(f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 401, "Session should be invalidated after logout"
        
        print("✓ Logout correctly invalidates session")


class TestAuthenticatedEndpoints:
    """Tests for endpoints requiring authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for authenticated tests"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_USER["email"],
            "phone": EXISTING_USER["phone"]
        })
        self.token = login_resp.json().get("session_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_bookings(self):
        """GET /api/bookings should return user's bookings"""
        response = requests.get(f"{BASE_URL}/api/bookings", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Check booking structure if any exist
        if data:
            b = data[0]
            assert "booking_id" in b
            assert "status" in b
            assert "service_name" in b
            assert "pet_name" in b
        
        print(f"✓ GET /api/bookings returned {len(data)} bookings")
    
    def test_get_pets(self):
        """GET /api/pets should return user's pets"""
        response = requests.get(f"{BASE_URL}/api/pets", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✓ GET /api/pets returned {len(data)} pets")
    
    def test_get_addresses(self):
        """GET /api/addresses should return user's addresses"""
        response = requests.get(f"{BASE_URL}/api/addresses", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✓ GET /api/addresses returned {len(data)} addresses")
    
    def test_get_notifications(self):
        """GET /api/notifications should return notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✓ GET /api/notifications returned {len(data)} notifications")
    
    def test_get_notifications_unread_count(self):
        """GET /api/notifications/unread-count should return count"""
        response = requests.get(f"{BASE_URL}/api/notifications/unread-count", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        
        print(f"✓ Unread notifications count: {data['count']}")
    
    def test_get_booked_slots(self):
        """GET /api/bookings/booked-slots should return booked time slots for date"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        response = requests.get(f"{BASE_URL}/api/bookings/booked-slots?date={tomorrow}", 
            headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "date" in data
        assert "booked_slots" in data
        
        print(f"✓ GET /api/bookings/booked-slots working")
    
    def test_update_profile(self):
        """PUT /api/user/profile should update user profile"""
        response = requests.put(f"{BASE_URL}/api/user/profile",
            headers=self.headers,
            json={"name": EXISTING_USER["name"]})
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("name") == EXISTING_USER["name"]
        
        print("✓ PUT /api/user/profile working")


class TestAdminAPI:
    """Admin dashboard and API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin"""
        login_resp = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN_CREDS)
        if login_resp.status_code != 200:
            pytest.skip(f"Admin login failed: {login_resp.text}")
        
        self.admin_token = login_resp.json().get("token")
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_admin_login(self):
        """POST /api/admin/login should authenticate admin"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json=ADMIN_CREDS)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "token" in data
        assert "admin" in data
        
        print("✓ Admin login successful")
    
    def test_admin_dashboard(self):
        """GET /api/admin/dashboard should return stats"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=self.admin_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_customers" in data
        assert "total_bookings" in data
        assert "pending_bookings" in data
        assert "total_services" in data
        assert "total_revenue" in data
        
        print(f"✓ Admin dashboard - Customers: {data['total_customers']}, Bookings: {data['total_bookings']}")
    
    def test_admin_get_bookings(self):
        """GET /api/admin/bookings should return all bookings"""
        response = requests.get(f"{BASE_URL}/api/admin/bookings", headers=self.admin_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✓ Admin bookings API returned {len(data)} bookings")
    
    def test_admin_get_customers(self):
        """GET /api/admin/customers should return all customers"""
        response = requests.get(f"{BASE_URL}/api/admin/customers", headers=self.admin_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✓ Admin customers API returned {len(data)} customers")
    
    def test_admin_get_services(self):
        """GET /api/admin/services should return all services"""
        response = requests.get(f"{BASE_URL}/api/admin/services", headers=self.admin_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 4
        
        print(f"✓ Admin services API returned {len(data)} services")
    
    def test_admin_notifications(self):
        """GET /api/admin/notifications should return admin notifications"""
        response = requests.get(f"{BASE_URL}/api/admin/notifications", headers=self.admin_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✓ Admin notifications API working")


class TestPWAFiles:
    """PWA manifest and service worker tests"""
    
    def test_manifest_json(self):
        """manifest.json should be accessible and valid"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("name") == "Spaw Group - Pet Grooming"
        assert data.get("short_name") == "Spaw Group"
        assert data.get("display") == "standalone"
        assert "icons" in data
        assert len(data["icons"]) >= 2
        
        print("✓ manifest.json is valid PWA manifest")
    
    def test_service_worker(self):
        """service-worker.js should be accessible"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        assert response.status_code == 200
        
        content = response.text
        assert "self.addEventListener" in content
        assert "fetch" in content
        
        print("✓ service-worker.js is accessible")
    
    def test_pwa_icons(self):
        """PWA icons should be accessible"""
        icons = ["/icon-192.png", "/icon-512.png"]
        
        for icon in icons:
            response = requests.get(f"{BASE_URL}{icon}")
            assert response.status_code == 200, f"Icon {icon} not accessible"
            assert "image/png" in response.headers.get("content-type", "")
        
        print("✓ PWA icons are accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
