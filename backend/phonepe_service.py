import os
import hashlib
import base64
import uuid
import requests
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

class PhonePeService:
    def __init__(self):
        self.merchant_id = os.getenv('PHONEPE_MERCHANT_ID', 'M1234567890')
        self.salt_key = os.getenv('PHONEPE_SALT_KEY', 'test_salt_key_12345')
        self.salt_index = os.getenv('PHONEPE_SALT_INDEX', '1')
        self.env = os.getenv('PHONEPE_ENV', 'SANDBOX')
        self.api_url = os.getenv('PHONEPE_API_URL', 'https://api-preprod.phonepe.com/apis/pg-sandbox')
    
    def generate_transaction_id(self) -> str:
        """Generate unique transaction ID"""
        return f"TXN{uuid.uuid4().hex[:20].upper()}"
    
    def calculate_checksum(self, payload_base64: str, endpoint: str) -> str:
        """Calculate X-VERIFY checksum for PhonePe API"""
        string_to_hash = payload_base64 + endpoint + self.salt_key
        sha256_hash = hashlib.sha256(string_to_hash.encode()).hexdigest()
        return sha256_hash + '###' + self.salt_index
    
    def create_payment_request(self, amount: int, user_id: str, callback_url: str, redirect_url: str) -> Dict[str, Any]:
        """
        Create PhonePe payment request
        amount: in paise (1 INR = 100 paise)
        """
        transaction_id = self.generate_transaction_id()
        
        payload = {
            "merchantId": self.merchant_id,
            "merchantTransactionId": transaction_id,
            "merchantUserId": user_id,
            "amount": amount,  # in paise
            "redirectUrl": redirect_url,
            "redirectMode": "REDIRECT",
            "callbackUrl": callback_url,
            "mobileNumber": "9999999999",  # Optional
            "paymentInstrument": {
                "type": "PAY_PAGE"
            }
        }
        
        # Base64 encode payload
        payload_json = str(payload).replace("'", '"')
        payload_base64 = base64.b64encode(payload_json.encode()).decode()
        
        # Calculate checksum
        endpoint = "/pg/v1/pay"
        checksum = self.calculate_checksum(payload_base64, endpoint)
        
        headers = {
            "Content-Type": "application/json",
            "X-VERIFY": checksum
        }
        
        request_data = {
            "request": payload_base64
        }
        
        return {
            "url": f"{self.api_url}{endpoint}",
            "headers": headers,
            "data": request_data,
            "transaction_id": transaction_id
        }
    
    def check_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        """Check payment status"""
        endpoint = f"/pg/v1/status/{self.merchant_id}/{transaction_id}"
        
        # Calculate checksum for status check
        string_to_hash = endpoint + self.salt_key
        sha256_hash = hashlib.sha256(string_to_hash.encode()).hexdigest()
        checksum = sha256_hash + '###' + self.salt_index
        
        headers = {
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
            "X-MERCHANT-ID": self.merchant_id
        }
        
        try:
            response = requests.get(
                f"{self.api_url}{endpoint}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"success": False, "error": "Status check failed"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def verify_webhook_checksum(self, payload_base64: str, received_checksum: str) -> bool:
        """Verify webhook checksum"""
        string_to_hash = payload_base64 + self.salt_key
        sha256_hash = hashlib.sha256(string_to_hash.encode()).hexdigest()
        calculated_checksum = sha256_hash + '###' + self.salt_index
        return calculated_checksum == received_checksum

phonepe_service = PhonePeService()
