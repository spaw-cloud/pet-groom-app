"""
Iteration 8 - Backend API Tests for Spaw Group Pet Grooming App
Tests: Services, Admin Login, Admin Dashboard, Admin APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials for testing
ADMIN_1_PHONE = "8778454723"
ADMIN_1_PASSWORD = "Sp@wappleid2026"
ADMIN_2_PHONE = "9361011959"
ADMIN_2_PASSWORD = "Sp@wappleid2026"


# ==================== Services API Tests ====================
class TestServicesAPI:
    """Test the public /api/services endpoint"""
    
    def test_services_returns_200(self):
        """Services endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        print("✓ Services endpoint returns 200")
    
    def test_services_returns_list(self):
        """Services should return a list of 4 services"""
        response = requests.get(f"{BASE_URL}/api/services")
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 4, f"Expected at least 4 services, got {len(data)}"
        print(f"✓ Services returns list with {len(data)} services")
    
    def test_services_have_required_fields(self):
        """Each service should have required fields"""
        response = requests.get(f"{BASE_URL}/api/services")
        data = response.json()
        required_fields = ['service_id', 'name', 'description', 'duration', 'price', 'included_services']
        for service in data:
            for field in required_fields:
                assert field in service, f"Service missing field: {field}"
        print("✓ All services have required fields")
    
    def test_services_have_correct_names(self):
        """Services should include the 4 expected service names"""
        response = requests.get(f"{BASE_URL}/api/services")
        data = response.json()
        service_names = [s['name'] for s in data]
        expected_names = ['Signature Bath', 'Express Trim', 'Signature Trim', 'Pro Bath']
        for name in expected_names:
            assert any(name in sn for sn in service_names), f"Missing service: {name}"
        print("✓ All 4 expected services found")


# ==================== Admin Login Tests ====================
class TestAdminLogin:
    """Test admin login endpoint"""
    
    def test_admin1_login_success(self):
        """Admin 1 (Ashwath) should be able to login"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN_1_PHONE,
            "password": ADMIN_1_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'token' in data
        assert data['admin']['name'] == 'Ashwath'
        print(f"✓ Admin 1 (Ashwath) login successful")
    
    def test_admin2_login_success(self):
        """Admin 2 should be able to login"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN_2_PHONE,
            "password": ADMIN_2_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'token' in data
        print(f"✓ Admin 2 login successful")
    
    def test_admin_login_invalid_credentials(self):
        """Invalid credentials should be rejected"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": "1234567890",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")


# ==================== Admin Dashboard Tests ====================
class TestAdminDashboard:
    """Test admin dashboard endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN_1_PHONE,
            "password": ADMIN_1_PASSWORD
        })
        return response.json()['token']
    
    def test_dashboard_returns_200(self, admin_token):
        """Dashboard should return 200 with auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print("✓ Admin dashboard returns 200")
    
    def test_dashboard_has_required_fields(self, admin_token):
        """Dashboard should have required fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        expected_fields = ['total_customers', 'total_bookings', 'total_services']
        for field in expected_fields:
            assert field in data, f"Dashboard missing field: {field}"
        print("✓ Dashboard has required fields")
    
    def test_dashboard_requires_auth(self):
        """Dashboard should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 401
        print("✓ Dashboard correctly requires authentication")


# ==================== Admin Bookings Tests ====================
class TestAdminBookings:
    """Test admin bookings endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN_1_PHONE,
            "password": ADMIN_1_PASSWORD
        })
        return response.json()['token']
    
    def test_bookings_returns_200(self, admin_token):
        """Bookings endpoint should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/admin/bookings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print("✓ Admin bookings returns 200")
    
    def test_bookings_returns_list(self, admin_token):
        """Bookings should return a list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/bookings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Bookings returns list with {len(data)} items")


# ==================== Admin Customers Tests ====================
class TestAdminCustomers:
    """Test admin customers endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN_1_PHONE,
            "password": ADMIN_1_PASSWORD
        })
        return response.json()['token']
    
    def test_customers_returns_200(self, admin_token):
        """Customers endpoint should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/admin/customers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print("✓ Admin customers returns 200")
    
    def test_customers_returns_list(self, admin_token):
        """Customers should return a list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/customers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Customers returns list with {len(data)} items")


# ==================== Admin Services Tests ====================
class TestAdminServices:
    """Test admin services endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN_1_PHONE,
            "password": ADMIN_1_PASSWORD
        })
        return response.json()['token']
    
    def test_admin_services_returns_200(self, admin_token):
        """Admin services endpoint should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/admin/services",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print("✓ Admin services returns 200")
    
    def test_admin_services_returns_4_services(self, admin_token):
        """Admin services should return at least 4 services"""
        response = requests.get(
            f"{BASE_URL}/api/admin/services",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 4
        print(f"✓ Admin services returns {len(data)} services")


# ==================== Availability Tests ====================
class TestAvailabilityEndpoints:
    """Test availability/blocked slots endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN_1_PHONE,
            "password": ADMIN_1_PASSWORD
        })
        return response.json()['token']
    
    def test_blocked_slots_returns_200(self, admin_token):
        """Blocked slots endpoint should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/admin/availability/blocked",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print("✓ Blocked slots returns 200")
    
    def test_blocked_dates_returns_200(self, admin_token):
        """Blocked dates endpoint should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/admin/availability/blocked-dates",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print("✓ Blocked dates returns 200")
    
    def test_block_unblock_slot(self, admin_token):
        """Block and unblock a slot should work"""
        # Block a slot
        block_response = requests.post(
            f"{BASE_URL}/api/admin/availability/block",
            json={"date": "2026-12-31", "time": "10:30"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert block_response.status_code == 200
        
        # Unblock it
        unblock_response = requests.post(
            f"{BASE_URL}/api/admin/availability/unblock",
            json={"date": "2026-12-31", "time": "10:30"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert unblock_response.status_code == 200
        print("✓ Block/unblock slot works correctly")


# ==================== Admin Notifications Tests ====================
class TestAdminNotifications:
    """Test admin notifications endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "phone": ADMIN_1_PHONE,
            "password": ADMIN_1_PASSWORD
        })
        return response.json()['token']
    
    def test_notifications_returns_200(self, admin_token):
        """Notifications endpoint should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/admin/notifications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print("✓ Admin notifications returns 200")
    
    def test_unread_count_returns_200(self, admin_token):
        """Unread count endpoint should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/admin/notifications/unread-count",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert 'count' in data
        print(f"✓ Unread count: {data['count']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
