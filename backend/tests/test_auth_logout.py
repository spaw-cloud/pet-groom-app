"""
Tests for Spaw Group Authentication and Logout functionality
Focus: Logout button fix (Alert.alert → Modal) and backend logout with Authorization header
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://pet-groom-react.preview.emergentagent.com')

# Test credentials
TEST_CREDENTIALS = {
    "email": "newuser@test.com",
    "phone": "9876543210",
    "name": "newuser"
}


class TestAuthLogin:
    """Test login functionality"""
    
    def test_login_existing_user_success(self):
        """Test direct login for existing user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_CREDENTIALS["email"], "phone": TEST_CREDENTIALS["phone"]}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "session_token" in data, "session_token missing from response"
        assert "user_id" in data, "user_id missing from response"
        assert data["email"] == TEST_CREDENTIALS["email"]
        print(f"✓ Login successful, got session_token")
    
    def test_login_new_user_returns_404(self):
        """Test that non-existing user gets NEW_USER error"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@test.com", "phone": "0000000000"}
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "NEW_USER"
        print(f"✓ NEW_USER correctly returned for non-existing user")


class TestAuthLogout:
    """Test logout functionality with Authorization Bearer header (the fix)"""
    
    def get_valid_session_token(self):
        """Helper to get a valid session token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_CREDENTIALS["email"], "phone": TEST_CREDENTIALS["phone"]}
        )
        assert response.status_code == 200
        return response.json()["session_token"]
    
    def test_logout_with_authorization_header(self):
        """Test logout using Authorization Bearer header (key fix)"""
        token = self.get_valid_session_token()
        
        # Verify token is valid
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200, "Token should be valid before logout"
        
        # Perform logout with Authorization header
        logout_response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert logout_response.status_code == 200
        assert logout_response.json()["message"] == "Logged out successfully"
        print(f"✓ Logout successful with Authorization header")
        
        # Verify session is invalidated
        verify_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert verify_response.status_code == 401, "Session should be invalid after logout"
        assert verify_response.json()["detail"] == "Invalid session"
        print(f"✓ Session correctly invalidated after logout")
    
    def test_logout_without_token(self):
        """Test logout without token returns success (graceful handling)"""
        response = requests.post(f"{BASE_URL}/api/auth/logout")
        assert response.status_code == 200
        assert response.json()["message"] == "Logged out successfully"
        print(f"✓ Logout without token returns success gracefully")
    
    def test_logout_with_invalid_token(self):
        """Test logout with invalid token still succeeds"""
        response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        assert response.status_code == 200
        print(f"✓ Logout with invalid token handled gracefully")


class TestAuthMe:
    """Test /auth/me endpoint"""
    
    def test_auth_me_with_valid_token(self):
        """Test getting user info with valid token"""
        # Login first
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_CREDENTIALS["email"], "phone": TEST_CREDENTIALS["phone"]}
        )
        token = login_response.json()["session_token"]
        
        # Get user info
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == TEST_CREDENTIALS["email"]
        print(f"✓ /auth/me returns correct user info")
    
    def test_auth_me_without_token(self):
        """Test /auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print(f"✓ /auth/me without token returns 401")


class TestBookingsEndpoint:
    """Test bookings endpoint (useFocusEffect auto-refresh)"""
    
    def test_get_bookings_authenticated(self):
        """Test getting bookings with valid auth"""
        # Login first
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_CREDENTIALS["email"], "phone": TEST_CREDENTIALS["phone"]}
        )
        token = login_response.json()["session_token"]
        
        # Get bookings
        response = requests.get(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✓ Bookings endpoint returns list (count: {len(response.json())})")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
