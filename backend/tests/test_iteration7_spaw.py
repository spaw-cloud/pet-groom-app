"""
Iteration 7 - Backend API Tests for Spaw Group Pet Grooming App (React Migration)
Tests: Services API, Admin Login, Booked Slots, Admin Dashboard, Availability
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-groom-react.preview.emergentagent.com')

# Test credentials
ADMIN_CREDS = {
    "admin1": {"phone": "8778454723", "password": "Sp@wappleid2026"},
    "admin2": {"phone": "9361011959", "password": "Sp@wappleid2026"}
}


class TestServicesAPI:
    """Test /api/services endpoint"""
    
    def test_services_returns_200(self):
        """GET /api/services returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/services returned 200")
    
    def test_services_returns_list(self):
        """GET /api/services returns a list of services"""
        response = requests.get(f"{BASE_URL}/api/services")
        data = response.json()
        assert isinstance(data, list), "Services should be a list"
        assert len(data) >= 4, f"Expected at least 4 services, got {len(data)}"
        print(f"✓ GET /api/services returned {len(data)} services")
    
    def test_services_have_required_fields(self):
        """Each service should have required fields"""
        response = requests.get(f"{BASE_URL}/api/services")
        services = response.json()
        
        required_fields = ['service_id', 'name', 'description', 'duration', 'price']
        for service in services:
            for field in required_fields:
                assert field in service, f"Service missing field: {field}"
        print(f"✓ All services have required fields")
    
    def test_services_have_correct_names(self):
        """Services should include expected service names"""
        response = requests.get(f"{BASE_URL}/api/services")
        services = response.json()
        service_names = [s.get('name', '') for s in services]
        
        expected_names = [
            "Signature Bath (For Dogs)",
            "Express Trim (For Dogs)",
            "Signature Trim (For Dogs)",
            "Pro Bath Membership (For Dogs)"
        ]
        
        for name in expected_names:
            assert name in service_names, f"Missing service: {name}"
        print(f"✓ All expected services present")


class TestAdminLogin:
    """Test admin login endpoint"""
    
    def test_admin1_login_success(self):
        """Admin 1 (8778454723) can login successfully"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json=ADMIN_CREDS["admin1"]
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") == True, "Login should return success: true"
        assert "token" in data, "Login should return a token"
        assert data.get("admin", {}).get("name") == "Ashwath", "Admin name should be Ashwath"
        print(f"✓ Admin 1 login successful - Name: {data.get('admin', {}).get('name')}")
    
    def test_admin2_login_success(self):
        """Admin 2 (9361011959) can login successfully"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json=ADMIN_CREDS["admin2"]
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") == True, "Login should return success: true"
        assert "token" in data, "Login should return a token"
        print(f"✓ Admin 2 login successful - Name: {data.get('admin', {}).get('name')}")
    
    def test_admin_login_invalid_credentials(self):
        """Invalid credentials should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"phone": "1234567890", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Invalid credentials correctly rejected with 401")


class TestAdminDashboard:
    """Test admin dashboard endpoint (not stats)"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json=ADMIN_CREDS["admin1"]
        )
        return response.json().get("token")
    
    def test_admin_dashboard_returns_200(self, admin_token):
        """GET /api/admin/dashboard returns 200 OK with valid token"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/admin/dashboard returned 200")
    
    def test_admin_dashboard_structure(self, admin_token):
        """Dashboard should have expected fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        expected_fields = ['total_bookings', 'pending_bookings', 'confirmed_bookings', 'completed_bookings', 'total_customers', 'total_services']
        for field in expected_fields:
            assert field in data, f"Dashboard missing field: {field}"
        print(f"✓ Admin dashboard has all required fields")
    
    def test_admin_dashboard_requires_auth(self):
        """Dashboard should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Admin dashboard correctly requires authentication")


class TestAdminBookings:
    """Test admin bookings endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json=ADMIN_CREDS["admin1"]
        )
        return response.json().get("token")
    
    def test_admin_bookings_returns_200(self, admin_token):
        """GET /api/admin/bookings returns 200 OK"""
        response = requests.get(
            f"{BASE_URL}/api/admin/bookings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/admin/bookings returned 200")
    
    def test_admin_bookings_is_list(self, admin_token):
        """Admin bookings should return a list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/bookings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        assert isinstance(data, list), "Bookings should be a list"
        print(f"✓ Admin bookings returns list with {len(data)} items")


class TestAdminCustomers:
    """Test admin customers endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json=ADMIN_CREDS["admin1"]
        )
        return response.json().get("token")
    
    def test_admin_customers_returns_200(self, admin_token):
        """GET /api/admin/customers returns 200 OK"""
        response = requests.get(
            f"{BASE_URL}/api/admin/customers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/admin/customers returned 200")
    
    def test_admin_customers_is_list(self, admin_token):
        """Admin customers should return a list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/customers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        assert isinstance(data, list), "Customers should be a list"
        print(f"✓ Admin customers returns list with {len(data)} users")


class TestAdminServices:
    """Test admin services endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json=ADMIN_CREDS["admin1"]
        )
        return response.json().get("token")
    
    def test_admin_services_returns_200(self, admin_token):
        """GET /api/admin/services returns 200 OK"""
        response = requests.get(
            f"{BASE_URL}/api/admin/services",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/admin/services returned 200")
    
    def test_admin_services_returns_correct_count(self, admin_token):
        """Admin services should return at least 4 services"""
        response = requests.get(
            f"{BASE_URL}/api/admin/services",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        assert len(data) >= 4, f"Expected at least 4 services, got {len(data)}"
        print(f"✓ Admin services returns {len(data)} services")


class TestAvailabilityEndpoints:
    """Test availability/timer endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json=ADMIN_CREDS["admin1"]
        )
        return response.json().get("token")
    
    def test_admin_availability_blocked(self, admin_token):
        """GET /api/admin/availability/blocked returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/admin/availability/blocked",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/admin/availability/blocked returned 200")
    
    def test_admin_availability_blocked_dates(self, admin_token):
        """GET /api/admin/availability/blocked-dates returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/admin/availability/blocked-dates",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/admin/availability/blocked-dates returned 200")
    
    def test_block_and_unblock_slot(self, admin_token):
        """POST /api/admin/availability/block and unblock work"""
        # Block a test slot
        test_date = "2026-12-25"
        test_time = "10:30 AM"
        
        block_response = requests.post(
            f"{BASE_URL}/api/admin/availability/block",
            json={"date": test_date, "time": test_time},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert block_response.status_code == 200, f"Block: Expected 200, got {block_response.status_code}"
        print(f"✓ Block slot API working")
        
        # Unblock the slot
        unblock_response = requests.post(
            f"{BASE_URL}/api/admin/availability/unblock",
            json={"date": test_date, "time": test_time},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert unblock_response.status_code == 200, f"Unblock: Expected 200, got {unblock_response.status_code}"
        print(f"✓ Unblock slot API working")


class TestAdminNotifications:
    """Test admin notification endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json=ADMIN_CREDS["admin1"]
        )
        return response.json().get("token")
    
    def test_admin_notifications_returns_200(self, admin_token):
        """GET /api/admin/notifications returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/admin/notifications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/admin/notifications returned 200")
    
    def test_admin_notifications_unread_count(self, admin_token):
        """GET /api/admin/notifications/unread-count returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/admin/notifications/unread-count",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "count" in data, "Response should have count field"
        print(f"✓ Admin unread notifications count: {data.get('count', 0)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
