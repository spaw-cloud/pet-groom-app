from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SMTP_EMAIL = os.environ.get("SMTP_EMAIL")
SMTP_APP_PASSWORD = os.environ.get("SMTP_APP_PASSWORD")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== Models ====================

class User(BaseModel):
    user_id: str
    phone: Optional[str] = None
    name: str
    email: Optional[str] = None
    picture: Optional[str] = None
    created_at: datetime

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class Pet(BaseModel):
    pet_id: str
    user_id: str
    name: str
    breed: str
    age: Optional[int] = None
    weight: Optional[str] = None
    photo_base64: Optional[str] = None
    special_notes: Optional[str] = None
    created_at: datetime

class PetCreate(BaseModel):
    name: str
    breed: str
    age: Optional[int] = None
    weight: Optional[str] = None
    photo_base64: Optional[str] = None
    special_notes: Optional[str] = None

class PetUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[str] = None
    photo_base64: Optional[str] = None
    special_notes: Optional[str] = None

class Service(BaseModel):
    service_id: str
    name: str
    description: str
    duration: str  # e.g., "1 hour"
    price: float
    icon: Optional[str] = None
    image_url: Optional[str] = None
    included_services: List[str] = []

class Booking(BaseModel):
    booking_id: str
    user_id: str
    pet_id: str
    service_id: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    address: str
    status: str  # pending, confirmed, completed, cancelled
    payment_status: str  # unpaid, paid, refunded
    payment_type: Optional[str] = None  # upfront, post_service
    payment_transaction_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

class BookingCreate(BaseModel):
    pet_id: str
    service_id: str
    date: str
    time: str
    address: str
    payment_type: str  # upfront or post_service
    notes: Optional[str] = None

class BookingUpdate(BaseModel):
    status: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

# ==================== Admin Models ====================

class AdminLogin(BaseModel):
    phone: str
    password: str

class AdminServiceCreate(BaseModel):
    name: str
    description: str
    duration: str
    price: float
    icon: Optional[str] = None
    image_url: Optional[str] = None
    included_services: List[str] = []

class AdminServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[str] = None
    price: Optional[float] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    included_services: Optional[List[str]] = None

class AdminBookingStatusUpdate(BaseModel):
    status: str
    payment_status: Optional[str] = None

# ==================== Notification Helper ====================

async def create_notification(recipient_type: str, recipient_id: str, title: str, message: str, booking_id: Optional[str] = None):
    """Create a notification. recipient_type: 'user' or 'admin'"""
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "recipient_type": recipient_type,
        "recipient_id": recipient_id,
        "title": title,
        "message": message,
        "booking_id": booking_id,
        "read": False,
        "created_at": datetime.now(timezone.utc),
    })

class Address(BaseModel):
    address_id: str
    user_id: str
    house_number: str
    street: str
    area: str
    city: str
    landmark: Optional[str] = None
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    additional_instructions: Optional[str] = None
    is_default: bool = False
    created_at: datetime

class AddressCreate(BaseModel):
    house_number: str
    street: str
    area: str
    city: str
    landmark: Optional[str] = None
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    additional_instructions: Optional[str] = None
    is_default: bool = False

class AddressUpdate(BaseModel):
    house_number: Optional[str] = None
    street: Optional[str] = None
    area: Optional[str] = None
    city: Optional[str] = None
    landmark: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    additional_instructions: Optional[str] = None
    is_default: Optional[bool] = None

# ==================== Authentication Helper ====================

async def get_current_user(request: Request, session_token: Optional[str] = Cookie(None)) -> User:
    """Get current user from session token (cookie or header)"""
    # Try to get token from cookie first
    token = session_token
    
    # If not in cookie, try Authorization header
    if not token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '')
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session in database
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

# ==================== Auth Routes ====================

def send_otp_email(to_email: str, otp_code: str):
    """Send OTP via Gmail SMTP"""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Spaw Group - Your Login OTP: {otp_code}"
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f172a;border-radius:16px">
      <h2 style="color:#8B5CF6;margin:0 0 8px">Spaw Group</h2>
      <p style="color:#e2e8f0;font-size:15px;margin:0 0 20px">Your one-time verification code is:</p>
      <div style="background:#1e293b;border-radius:12px;padding:20px;text-align:center;margin:0 0 20px">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#8B5CF6">{otp_code}</span>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0">This code expires in 5 minutes. Do not share it with anyone.</p>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

import smtplib

print("✅ OTP (mock):", otp_code)
return True


def send_booking_confirmation_email(
    client_email: str,
    client_name: str,
    service_name: str,
    pet_name: str,
    date: str,
    time: str,
    booking_id: str
):
    """Send booking confirmation email to both client and Spaw Group"""
    # Email to client
    client_html = f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#0f172a;border-radius:16px">
      <h2 style="color:#8B5CF6;margin:0 0 4px;font-size:22px">Spaw Group</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 24px">Professional Pet Grooming at Your Doorstep</p>
      <div style="background:#1e293b;border-radius:12px;padding:24px;margin:0 0 20px;border:1px solid #334155">
        <h3 style="color:#22c55e;margin:0 0 16px;font-size:18px">Booking Confirmed!</h3>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px">Service</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;text-align:right;font-weight:600">{service_name}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px">Pet</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;text-align:right;font-weight:600">{pet_name}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px">Date</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;text-align:right;font-weight:600">{date}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px">Time</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;text-align:right;font-weight:600">{time}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px">Booking ID</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;text-align:right;font-weight:600">{booking_id}</td></tr>
        </table>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0">Our groomer will arrive at your doorstep as scheduled. For any changes, please update through the app or contact us.</p>
    </div>
    """
    client_msg = MIMEMultipart("alternative")
    client_msg["Subject"] = f"Booking Confirmed - {service_name} for {pet_name} | Spaw Group"
    client_msg["From"] = SMTP_EMAIL
    client_msg["To"] = client_email
    client_msg.attach(MIMEText(client_html, "html"))

    # Email to Spaw Group admin
    admin_html = f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#0f172a;border-radius:16px">
      <h2 style="color:#8B5CF6;margin:0 0 4px;font-size:22px">New Booking Confirmed</h2>
      <div style="background:#1e293b;border-radius:12px;padding:24px;margin:16px 0;border:1px solid #334155">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px">Client</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;text-align:right;font-weight:600">{client_name}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px">Email</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;text-align:right;font-weight:600">{client_email}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px">Service</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;text-align:right;font-weight:600">{service_name}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px">Pet</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;text-align:right;font-weight:600">{pet_name}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px">Date</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;text-align:right;font-weight:600">{date}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px">Time</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;text-align:right;font-weight:600">{time}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px">Booking ID</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;text-align:right;font-weight:600">{booking_id}</td></tr>
        </table>
      </div>
    </div>
    """
    admin_msg = MIMEMultipart("alternative")
    admin_msg["Subject"] = f"New Booking - {client_name} | {service_name} for {pet_name}"
    admin_msg["From"] = SMTP_EMAIL
    admin_msg["To"] = SMTP_EMAIL
    admin_msg.attach(MIMEText(admin_html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SMTP_EMAIL, SMTP_APP_PASSWORD)
            server.sendmail(SMTP_EMAIL, client_email, client_msg.as_string())
            server.sendmail(SMTP_EMAIL, SMTP_EMAIL, admin_msg.as_string())
        logger.info(f"Booking confirmation emails sent for {booking_id}")
    except Exception as e:
        logger.error(f"Failed to send booking confirmation emails: {e}")

@api_router.post("/auth/login")
async def direct_login(request: Request, response: Response):
    """Direct login for returning users — no OTP needed if email+phone match"""
    body = await request.json()
    email = body.get('email', '').strip().lower()
    phone = body.get('phone', '').strip()

    if not email or not phone:
        raise HTTPException(status_code=400, detail="Email and phone required")

    existing_user = await db.users.find_one(
        {"email": email, "phone": phone}, {"_id": 0}
    )
    if not existing_user:
        raise HTTPException(status_code=404, detail="NEW_USER")

    user_id = existing_user["user_id"]
    session_token = f"session_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(days=30)
    })
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )

    response.set_cookie(key="session_token", value=session_token, httponly=True, max_age=30*86400)
    return {
        "user_id": existing_user.get("user_id"),
        "phone": existing_user.get("phone"),
        "name": existing_user.get("name"),
        "email": existing_user.get("email"),
        "picture": existing_user.get("picture"),
        "session_token": session_token
    }

@api_router.post("/auth/send-otp")
async def send_otp(request: Request):
    """Send OTP to email via Gmail SMTP"""
    body = await request.json()
    email = body.get('email', '').strip().lower()

    if not email or '@' not in email:
        raise HTTPException(status_code=400, detail="Valid email address required")

    if not SMTP_EMAIL or not SMTP_APP_PASSWORD:
        raise HTTPException(status_code=500, detail="Email service not configured")

    # Rate limit: max 3 OTP sends per email in 10 minutes
    ten_min_ago = datetime.now(timezone.utc) - timedelta(minutes=10)
    recent_count = await db.otp_requests.count_documents({
        "email": email, "created_at": {"$gte": ten_min_ago}
    })
    if recent_count >= 3:
        raise HTTPException(status_code=429, detail="Too many OTP requests. Please wait 10 minutes before trying again.")

    # Cooldown: 60s between sends
    one_min_ago = datetime.now(timezone.utc) - timedelta(seconds=60)
    last_request = await db.otp_requests.find_one(
        {"email": email, "created_at": {"$gte": one_min_ago}}, {"_id": 0}
    )
    if last_request:
        raise HTTPException(status_code=429, detail="Please wait 60 seconds before requesting a new OTP.")

    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))

    try:
        send_otp_email(email, otp_code)
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {e}")
        raise HTTPException(status_code=502, detail="Failed to send OTP email. Please try again.")

    # Store OTP in DB with 5-min expiry
    await db.otp_codes.delete_many({"email": email})
    await db.otp_codes.insert_one({
        "email": email,
        "otp": otp_code,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
    })
    await db.otp_requests.insert_one({
        "email": email, "created_at": datetime.now(timezone.utc)
    })

    remaining = 3 - recent_count - 1
    logger.info(f"OTP sent to {email}")
    return {"success": True, "message": "OTP sent to your email", "attempts_remaining": remaining}

@api_router.post("/auth/resend-otp")
async def resend_otp(request: Request):
    """Resend OTP to email"""
    body = await request.json()
    email = body.get('email', '').strip().lower()

    if not email or '@' not in email:
        raise HTTPException(status_code=400, detail="Valid email address required")

    # Rate limit
    ten_min_ago = datetime.now(timezone.utc) - timedelta(minutes=10)
    recent_count = await db.otp_requests.count_documents({
        "email": email, "created_at": {"$gte": ten_min_ago}
    })
    if recent_count >= 3:
        raise HTTPException(status_code=429, detail="Too many OTP requests. Please wait 10 minutes.")

    one_min_ago = datetime.now(timezone.utc) - timedelta(seconds=60)
    last_request = await db.otp_requests.find_one(
        {"email": email, "created_at": {"$gte": one_min_ago}}, {"_id": 0}
    )
    if last_request:
        raise HTTPException(status_code=429, detail="Please wait 60 seconds before resending.")

    otp_code = str(random.randint(100000, 999999))

    try:
        send_otp_email(email, otp_code)
    except Exception as e:
        logger.error(f"Failed to resend OTP email to {email}: {e}")
        raise HTTPException(status_code=502, detail="Failed to send OTP email.")

    await db.otp_codes.delete_many({"email": email})
    await db.otp_codes.insert_one({
        "email": email, "otp": otp_code,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
    })
    await db.otp_requests.insert_one({
        "email": email, "created_at": datetime.now(timezone.utc)
    })

    remaining = 3 - recent_count - 1
    logger.info(f"OTP resent to {email}")
    return {"success": True, "message": "OTP resent to your email", "attempts_remaining": remaining}

@api_router.post("/auth/verify-otp")
async def verify_otp(request: Request, response: Response):
    """Verify email OTP and create session"""
    body = await request.json()
    email = body.get('email', '').strip().lower()
    otp = body.get('otp', '').strip()
    phone = body.get('phone', '').strip()
    name = body.get('name', '').strip()

    if not email or not otp:
        raise HTTPException(status_code=400, detail="Email and OTP required")

    # Look up stored OTP
    stored = await db.otp_codes.find_one({"email": email}, {"_id": 0})
    if not stored:
        raise HTTPException(status_code=401, detail="No OTP found. Please request a new one.")
    if stored["otp"] != otp:
        raise HTTPException(status_code=401, detail="Invalid OTP. Please check and try again.")
    if datetime.now(timezone.utc) > stored["expires_at"].replace(tzinfo=timezone.utc):
        await db.otp_codes.delete_many({"email": email})
        raise HTTPException(status_code=401, detail="OTP expired. Please request a new one.")

    # OTP valid — clean up
    await db.otp_codes.delete_many({"email": email})
    
    # Create or get user by email
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        update_data = {"last_login": datetime.now(timezone.utc)}
        if phone:
            update_data["phone"] = phone
        if name:
            update_data["name"] = name
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
    else:
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "phone": phone or None,
            "name": name or email.split('@')[0],
            "picture": None,
            "created_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc)
        })
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=30 * 24 * 60 * 60  # 30 days
    )
    
    # Get full user data
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    user_data = User(**user_doc).model_dump()
    
    # Return session token in response body for mobile apps
    return {
        **user_data,
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_me(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get current user info"""
    user = await get_current_user(request, session_token)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user"""
    token = session_token
    if not token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '')
    
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== Services Routes ====================

@api_router.get("/services", response_model=List[Service])
async def get_services():
    """Get all available services"""
    services = await db.services.find({}, {"_id": 0}).to_list(100)
    if not services:
        # Initialize services for DOGS with branded images and exact service lists
        default_services = [
            {
                "service_id": f"service_{uuid.uuid4().hex[:8]}",
                "name": "Signature Bath (For Dogs)",
                "description": "Soft on skin, tough on dirt - Complete bathing service",
                "duration": "45 mins",
                "price": 999,
                "icon": "🛁",
                "image_url": "https://customer-assets.emergentagent.com/job_pawsatdoor/artifacts/ruq6t2by_SIGNATURE%20BATH.png",
                "included_services": [
                    "Full body wash",
                    "Anal gland cleaning",
                    "Nail clipping",
                    "Ear & eye cleaning",
                    "Complete blow dry",
                    "Brushing/Combing",
                    "Paw balms",
                    "Organic perfume",
                    "Teeth wash"
                ]
            },
            {
                "service_id": f"service_{uuid.uuid4().hex[:8]}",
                "name": "Express Trim (For Dogs)",
                "description": "A little trim, A lot of comfort - Quick grooming service",
                "duration": "60 mins",
                "price": 1199,
                "icon": "✂️",
                "image_url": "https://customer-assets.emergentagent.com/job_pawsatdoor/artifacts/h9659cx7_express%20trimm.png",
                "included_services": [
                    "Complete body trim",
                    "No-itch oils",
                    "Nail clipping",
                    "Ear & eye cleaning",
                    "Complete blow dry",
                    "Brushing/Combing",
                    "Paw balms",
                    "Organic perfume",
                    "Anal gland cleaning",
                    "Teeth wash"
                ]
            },
            {
                "service_id": f"service_{uuid.uuid4().hex[:8]}",
                "name": "Signature Trim (For Dogs)",
                "description": "From bath to trim - Complete care package",
                "duration": "90 mins",
                "price": 1999,
                "icon": "💇",
                "image_url": "https://customer-assets.emergentagent.com/job_pawsatdoor/artifacts/j2didhjw_signature%20trim.png",
                "included_services": [
                    "Complete body trim",
                    "No-itch oils",
                    "Body wash",
                    "Ear & eye cleaning",
                    "Complete blow dry",
                    "Brushing/Combing",
                    "Paw balms",
                    "Organic perfume",
                    "Anal gland cleaning",
                    "Nail clipping",
                    "Teeth wash"
                ]
            },
            {
                "service_id": f"service_{uuid.uuid4().hex[:8]}",
                "name": "Pro Bath Membership (For Dogs)",
                "description": "Fresh & clean, every week - 3 services per month",
                "duration": "Weekly",
                "price": 830,
                "icon": "👑",
                "image_url": "https://customer-assets.emergentagent.com/job_pawsatdoor/artifacts/yb2veau0_PRO%20BATH%20.PNG",
                "included_services": [
                    "Full body wash",
                    "Nail clipping",
                    "Anal gland cleaning",
                    "Brushing/Combing",
                    "Complete blow dry",
                    "Ear & eye cleaning",
                    "Paw balms",
                    "Organic perfume",
                    "Teeth wash"
                ]
            }
        ]
        await db.services.insert_many(default_services)
        services = default_services
    
    return [Service(**s) for s in services]

# ==================== Pets Routes ====================

@api_router.get("/pets", response_model=List[Pet])
async def get_pets(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get all pets for current user"""
    user = await get_current_user(request, session_token)
    pets = await db.pets.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    return [Pet(**p) for p in pets]

@api_router.post("/pets", response_model=Pet)
async def create_pet(pet_data: PetCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Create a new pet"""
    user = await get_current_user(request, session_token)
    
    pet_id = f"pet_{uuid.uuid4().hex[:12]}"
    pet_dict = pet_data.model_dump()
    pet_dict["pet_id"] = pet_id
    pet_dict["user_id"] = user.user_id
    pet_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.pets.insert_one(pet_dict)
    
    pet_doc = await db.pets.find_one({"pet_id": pet_id}, {"_id": 0})
    return Pet(**pet_doc)

@api_router.put("/pets/{pet_id}", response_model=Pet)
async def update_pet(pet_id: str, pet_data: PetUpdate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Update a pet"""
    user = await get_current_user(request, session_token)
    
    # Check if pet belongs to user
    pet = await db.pets.find_one({"pet_id": pet_id, "user_id": user.user_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Update pet
    update_data = {k: v for k, v in pet_data.model_dump().items() if v is not None}
    if update_data:
        await db.pets.update_one(
            {"pet_id": pet_id},
            {"$set": update_data}
        )
    
    pet_doc = await db.pets.find_one({"pet_id": pet_id}, {"_id": 0})
    return Pet(**pet_doc)

@api_router.delete("/pets/{pet_id}")
async def delete_pet(pet_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Delete a pet"""
    user = await get_current_user(request, session_token)
    
    result = await db.pets.delete_one({"pet_id": pet_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    return {"message": "Pet deleted successfully"}

# ==================== Bookings Routes ====================

@api_router.get("/bookings")
async def get_bookings(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get all bookings for current user with service and pet names"""
    user = await get_current_user(request, session_token)
    bookings = await db.bookings.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Batch fetch services and pets to avoid N+1 queries
    service_ids = list(set(b.get("service_id") for b in bookings if b.get("service_id")))
    pet_ids = list(set(b.get("pet_id") for b in bookings if b.get("pet_id")))
    
    services = await db.services.find({"service_id": {"$in": service_ids}}, {"_id": 0, "service_id": 1, "name": 1, "price": 1}).to_list(100)
    pets = await db.pets.find({"pet_id": {"$in": pet_ids}}, {"_id": 0, "pet_id": 1, "name": 1, "breed": 1}).to_list(100)
    
    svc_map = {s["service_id"]: s for s in services}
    pet_map = {p["pet_id"]: p for p in pets}
    
    enriched = []
    for b in bookings:
        svc = svc_map.get(b.get("service_id"), {})
        pet = pet_map.get(b.get("pet_id"), {})
        enriched.append({
            **b,
            "service_name": svc.get("name", "Unknown"),
            "service_price": svc.get("price", 0),
            "pet_name": pet.get("name", "Unknown"),
            "pet_breed": pet.get("breed", ""),
        })
    return enriched

@api_router.get("/bookings/booked-slots")
async def get_booked_slots(date: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Get already booked time slots for a given date, including admin-blocked slots"""
    await get_current_user(request, session_token)
    
    # Check if entire day is blocked by admin
    day_block = await db.blocked_slots.find_one({"date": date, "time": None}, {"_id": 0})
    if day_block:
        return {"date": date, "booked_slots": [], "day_blocked": True}
    
    # Get bookings
    bookings = await db.bookings.find(
        {"date": date, "status": {"$nin": ["cancelled"]}},
        {"_id": 0, "time": 1}
    ).to_list(100)
    booked_times = [b["time"] for b in bookings]
    
    # Get admin-blocked time slots
    blocked = await db.blocked_slots.find({"date": date, "time": {"$ne": None}}, {"_id": 0, "time": 1}).to_list(100)
    blocked_times = [b["time"] for b in blocked]
    
    all_unavailable = list(set(booked_times + blocked_times))
    return {"date": date, "booked_slots": all_unavailable, "day_blocked": False}

@api_router.get("/availability/blocked-dates")
async def get_public_blocked_dates(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get list of fully blocked dates for client booking calendar"""
    await get_current_user(request, session_token)
    day_blocks = await db.blocked_slots.find({"time": None}, {"_id": 0, "date": 1}).to_list(500)
    return [b["date"] for b in day_blocks]

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Create a new booking"""
    user = await get_current_user(request, session_token)
    
    # Verify pet belongs to user
    pet = await db.pets.find_one({"pet_id": booking_data.pet_id, "user_id": user.user_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Verify service exists
    service = await db.services.find_one({"service_id": booking_data.service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    booking_dict = booking_data.model_dump()
    booking_dict["booking_id"] = booking_id
    booking_dict["user_id"] = user.user_id
    booking_dict["status"] = "pending"
    booking_dict["payment_status"] = "unpaid" if booking_data.payment_type == "post_service" else "pending"
    booking_dict["payment_transaction_id"] = None
    booking_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.bookings.insert_one(booking_dict)
    
    # Notify all admins about new booking
    service_name = service.get("name", "Unknown Service")
    pet_name = pet.get("name", "Unknown Pet")
    admins = await db.admins.find({}, {"_id": 0, "admin_id": 1}).to_list(10)
    for a in admins:
        await create_notification("admin", a["admin_id"],
            "New Booking",
            f"{user.name} booked {service_name} for {pet_name} on {booking_data.date} at {booking_data.time}",
            booking_id)
    
    # Send confirmation emails to client and admin
    try:
        send_booking_confirmation_email(
            client_email=user.email or "",
            client_name=user.name or "Customer",
            service_name=service_name,
            pet_name=pet_name,
            date=booking_data.date,
            time=booking_data.time,
            booking_id=booking_id
        )
    except Exception as e:
        logger.error(f"Error sending booking email: {e}")
    
    booking_doc = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    return Booking(**booking_doc)

@api_router.put("/bookings/{booking_id}", response_model=Booking)
async def update_booking(booking_id: str, booking_data: BookingUpdate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Update a booking"""
    user = await get_current_user(request, session_token)
    
    # Check if booking belongs to user
    booking = await db.bookings.find_one({"booking_id": booking_id, "user_id": user.user_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Update booking
    update_data = {k: v for k, v in booking_data.model_dump().items() if v is not None}
    if update_data:
        await db.bookings.update_one(
            {"booking_id": booking_id},
            {"$set": update_data}
        )
    
    booking_doc = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    return Booking(**booking_doc)

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Cancel a booking — only allowed at least 2 hours before appointment"""
    user = await get_current_user(request, session_token)

    booking = await db.bookings.find_one(
        {"booking_id": booking_id, "user_id": user.user_id}, {"_id": 0}
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.get("status") == "cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")

    # Check 2-hour cancellation window
    try:
        appt_str = f"{booking['date']}T{booking['time']}:00"
        appt_time = datetime.fromisoformat(appt_str).replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        if (appt_time - now).total_seconds() < 2 * 3600:
            raise HTTPException(
                status_code=400,
                detail="Cancellations are only allowed at least 2 hours before the appointment time."
            )
    except (KeyError, ValueError):
        pass  # If date/time parsing fails, allow cancellation

    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"status": "cancelled"}}
    )
    return {"message": "Booking cancelled successfully"}

# ==================== User Profile Routes ====================

@api_router.put("/user/profile", response_model=User)
async def update_profile(profile_data: UserProfileUpdate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Update user profile"""
    user = await get_current_user(request, session_token)
    
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": update_data}
        )
    
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return User(**user_doc)

# ==================== Address Routes ====================

@api_router.get("/addresses", response_model=List[Address])
async def get_addresses(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get all addresses for current user"""
    user = await get_current_user(request, session_token)
    addresses = await db.addresses.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    return [Address(**a) for a in addresses]

@api_router.post("/addresses", response_model=Address)
async def create_address(address_data: AddressCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Create a new address"""
    user = await get_current_user(request, session_token)
    
    address_id = f"addr_{uuid.uuid4().hex[:12]}"
    address_dict = address_data.model_dump()
    address_dict["address_id"] = address_id
    address_dict["user_id"] = user.user_id
    address_dict["created_at"] = datetime.now(timezone.utc)
    
    # If this is set as default, unset other defaults
    if address_data.is_default:
        await db.addresses.update_many(
            {"user_id": user.user_id},
            {"$set": {"is_default": False}}
        )
    
    await db.addresses.insert_one(address_dict)
    
    address_doc = await db.addresses.find_one({"address_id": address_id}, {"_id": 0})
    return Address(**address_doc)

@api_router.put("/addresses/{address_id}", response_model=Address)
async def update_address(address_id: str, address_data: AddressUpdate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Update an address"""
    user = await get_current_user(request, session_token)
    
    # Check if address belongs to user
    address = await db.addresses.find_one({"address_id": address_id, "user_id": user.user_id}, {"_id": 0})
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    
    # If this is set as default, unset other defaults
    if address_data.is_default:
        await db.addresses.update_many(
            {"user_id": user.user_id, "address_id": {"$ne": address_id}},
            {"$set": {"is_default": False}}
        )
    
    # Update address
    update_data = {k: v for k, v in address_data.model_dump().items() if v is not None}
    if update_data:
        await db.addresses.update_one(
            {"address_id": address_id},
            {"$set": update_data}
        )
    
    address_doc = await db.addresses.find_one({"address_id": address_id}, {"_id": 0})
    return Address(**address_doc)

@api_router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Delete an address"""
    user = await get_current_user(request, session_token)
    
    result = await db.addresses.delete_one({"address_id": address_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    
    return {"message": "Address deleted successfully"}

# ==================== Payment Routes ====================

from backend.phonepe_service import phonepe_service
import requests

class PaymentInitRequest(BaseModel):
    booking_id: str

@api_router.post("/payments/initiate")
async def initiate_payment(payment_request: PaymentInitRequest, request: Request, session_token: Optional[str] = Cookie(None)):
    """Initiate PhonePe payment for a booking"""
    user = await get_current_user(request, session_token)
    
    # Get booking
    booking = await db.bookings.find_one({"booking_id": payment_request.booking_id, "user_id": user.user_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Get service to get amount
    service = await db.services.find_one({"service_id": booking["service_id"]}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    amount_in_paise = int(service["price"] * 100)  # Convert rupees to paise
    
    # Generate PhonePe payment request
    callback_url = f"{os.environ['EXPO_PUBLIC_BACKEND_URL']}/api/payments/callback"
    redirect_url = f"{os.environ['EXPO_PUBLIC_BACKEND_URL']}/api/payments/status/{payment_request.booking_id}"
    
    payment_data = phonepe_service.create_payment_request(
        amount=amount_in_paise,
        user_id=user.user_id,
        callback_url=callback_url,
        redirect_url=redirect_url
    )
    
    # Store transaction ID in booking
    await db.bookings.update_one(
        {"booking_id": payment_request.booking_id},
        {"$set": {"payment_transaction_id": payment_data["transaction_id"]}}
    )
    
    # Note: In sandbox/test mode, we simulate payment
    # In production, you would make actual API call to PhonePe
    return {
        "success": True,
        "transaction_id": payment_data["transaction_id"],
        "payment_url": f"{payment_data['url']}",  # This would be the actual PhonePe payment URL
        "message": "Payment initiated. In test mode, payments are simulated."
    }

@api_router.post("/payments/callback")
async def payment_callback(request: Request):
    """Handle PhonePe payment callback"""
    try:
        body = await request.json()
        # In production, verify webhook signature here
        
        transaction_id = body.get("transaction_id")
        status = body.get("status", "SUCCESS")  # SUCCESS, FAILED, PENDING
        
        # Update booking payment status
        if transaction_id:
            payment_status = "paid" if status == "SUCCESS" else "unpaid"
            await db.bookings.update_one(
                {"payment_transaction_id": transaction_id},
                {"$set": {"payment_status": payment_status}}
            )
        
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.get("/payments/status/{booking_id}")
async def check_payment_status(booking_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Check payment status for a booking"""
    user = await get_current_user(request, session_token)
    
    booking = await db.bookings.find_one({"booking_id": booking_id, "user_id": user.user_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    transaction_id = booking.get("payment_transaction_id")
    if not transaction_id:
        return {
            "booking_id": booking_id,
            "payment_status": booking.get("payment_status", "unpaid"),
            "message": "No transaction initiated"
        }
    
    # In sandbox mode, we simulate status
    # In production, call phonepe_service.check_payment_status(transaction_id)
    return {
        "booking_id": booking_id,
        "transaction_id": transaction_id,
        "payment_status": booking.get("payment_status", "unpaid"),
        "message": "Test mode - payment status"
    }

@api_router.post("/payments/mark-paid/{booking_id}")
async def mark_booking_paid(booking_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Mark booking as paid (for post-service payments)"""
    user = await get_current_user(request, session_token)
    
    booking = await db.bookings.find_one({"booking_id": booking_id, "user_id": user.user_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"payment_status": "paid"}}
    )
    
    return {"success": True, "message": "Booking marked as paid"}

# ==================== Customer Notification Routes ====================
@api_router.get("/notifications")
async def get_notifications(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    notifs = await db.notifications.find(
        {"recipient_type": "user", "recipient_id": user.user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    for n in notifs:
        if isinstance(n.get("created_at"), datetime):
            n["created_at"] = n["created_at"].isoformat()
    return notifs

@api_router.get("/notifications/unread-count")
async def get_unread_count(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    count = await db.notifications.count_documents(
        {"recipient_type": "user", "recipient_id": user.user_id, "read": False}
    )
    return {"count": count}

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    await db.notifications.update_one(
        {"notification_id": notification_id, "recipient_id": user.user_id},
        {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_read(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    await db.notifications.update_many(
        {"recipient_type": "user", "recipient_id": user.user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All marked as read"}

# Include the router in the main app
app.include_router(api_router)

# ==================== Admin Router ====================
admin_router = APIRouter(prefix="/api/admin")

# Admin credentials (hashed at startup)
ADMIN_ACCOUNTS = [
    {"phone": "8778454723", "password": "Sp@wappleid2026", "name": "Ashwath"},
    {"phone": "9361011959", "password": "Sp@wappleid2026", "name": "Admin 2"},
]

async def initialize_admins():
    """Create admin accounts if they don't exist"""
    for admin in ADMIN_ACCOUNTS:
        existing = await db.admins.find_one({"phone": admin["phone"]})
        if not existing:
            hashed = bcrypt.hashpw(admin["password"].encode(), bcrypt.gensalt())
            await db.admins.insert_one({
                "admin_id": f"admin_{uuid.uuid4().hex[:8]}",
                "phone": admin["phone"],
                "password_hash": hashed.decode(),
                "name": admin["name"],
                "created_at": datetime.now(timezone.utc),
            })
            logger.info(f"Admin account created for {admin['phone']}")

@app.on_event("startup")
async def startup_event():
    await initialize_admins()

async def get_current_admin(request: Request):
    """Verify admin token from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Admin authentication required")
    token = auth_header.replace('Bearer ', '')
    session = await db.admin_sessions.find_one({"token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid admin session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Admin session expired")
    admin = await db.admins.find_one({"admin_id": session["admin_id"]}, {"_id": 0, "password_hash": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin

@admin_router.post("/login")
async def admin_login(login_data: AdminLogin):
    """Admin login with phone + password"""
    admin = await db.admins.find_one({"phone": login_data.phone}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(login_data.password.encode(), admin["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = f"admin_{uuid.uuid4().hex}"
    await db.admin_sessions.insert_one({
        "admin_id": admin["admin_id"],
        "token": token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc),
    })
    return {
        "success": True,
        "token": token,
        "admin": {"admin_id": admin["admin_id"], "phone": admin["phone"], "name": admin["name"]},
    }

@admin_router.get("/me")
async def admin_me(request: Request):
    admin = await get_current_admin(request)
    return admin

@admin_router.get("/dashboard")
async def admin_dashboard(request: Request):
    """Dashboard overview with stats"""
    await get_current_admin(request)
    total_customers = await db.users.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    pending_bookings = await db.bookings.count_documents({"status": "pending"})
    confirmed_bookings = await db.bookings.count_documents({"status": "confirmed"})
    completed_bookings = await db.bookings.count_documents({"status": "completed"})
    cancelled_bookings = await db.bookings.count_documents({"status": "cancelled"})
    total_pets = await db.pets.count_documents({})
    total_services = await db.services.count_documents({})
    # Revenue calc
    paid_bookings = await db.bookings.find({"payment_status": "paid"}, {"_id": 0, "service_id": 1}).to_list(1000)
    revenue = 0.0
    if paid_bookings:
        service_ids = [b["service_id"] for b in paid_bookings]
        services = await db.services.find({"service_id": {"$in": service_ids}}, {"_id": 0, "service_id": 1, "price": 1}).to_list(100)
        price_map = {s["service_id"]: s["price"] for s in services}
        revenue = sum(price_map.get(b["service_id"], 0) for b in paid_bookings)
    # Recent bookings
    recent = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    return {
        "total_customers": total_customers,
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "confirmed_bookings": confirmed_bookings,
        "completed_bookings": completed_bookings,
        "cancelled_bookings": cancelled_bookings,
        "total_pets": total_pets,
        "total_services": total_services,
        "total_revenue": revenue,
        "recent_bookings": recent,
    }

@admin_router.get("/bookings")
async def admin_get_bookings(request: Request, status: Optional[str] = None):
    """Get all bookings with customer and service details"""
    await get_current_admin(request)
    query = {}
    if status:
        query["status"] = status
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Batch fetch users, services, pets to avoid N+1 queries
    user_ids = list(set(b["user_id"] for b in bookings))
    service_ids = list(set(b["service_id"] for b in bookings))
    pet_ids = list(set(b["pet_id"] for b in bookings))
    
    users = await db.users.find({"user_id": {"$in": user_ids}}, {"_id": 0, "user_id": 1, "name": 1, "phone": 1}).to_list(500)
    services = await db.services.find({"service_id": {"$in": service_ids}}, {"_id": 0, "service_id": 1, "name": 1, "price": 1}).to_list(100)
    pets = await db.pets.find({"pet_id": {"$in": pet_ids}}, {"_id": 0, "pet_id": 1, "name": 1, "breed": 1}).to_list(500)
    
    user_map = {u["user_id"]: u for u in users}
    svc_map = {s["service_id"]: s for s in services}
    pet_map = {p["pet_id"]: p for p in pets}
    
    enriched = []
    for b in bookings:
        enriched.append({
            **b,
            "customer": user_map.get(b["user_id"], {}),
            "service_details": svc_map.get(b["service_id"], {}),
            "pet_details": pet_map.get(b["pet_id"], {}),
        })
    return enriched

@admin_router.put("/bookings/{booking_id}/status")
async def admin_update_booking_status(booking_id: str, data: AdminBookingStatusUpdate, request: Request):
    """Update booking status"""
    admin = await get_current_admin(request)
    update = {"status": data.status}
    if data.payment_status:
        update["payment_status"] = data.payment_status
    result = await db.bookings.update_one({"booking_id": booking_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    # Notify customer about status change
    status_messages = {
        "confirmed": "Your booking has been confirmed! Our groomer will arrive on schedule.",
        "completed": "Your grooming session is complete! We hope your pet enjoyed it.",
        "cancelled": "Your booking has been cancelled. Please contact us for any questions.",
        "pending": "Your booking status has been updated to pending.",
    }
    msg = status_messages.get(data.status, f"Your booking status has been updated to {data.status}.")
    await create_notification("user", booking["user_id"],
        f"Booking {data.status.capitalize()}", msg, booking_id)
    
    # Send confirmation emails when booking is confirmed
    if data.status == "confirmed":
        try:
            user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0})
            service = await db.services.find_one({"service_id": booking.get("service_id")}, {"_id": 0})
            pet = await db.pets.find_one({"pet_id": booking.get("pet_id")}, {"_id": 0})
            if user and user.get("email"):
                send_booking_confirmation_email(
                    client_email=user["email"],
                    client_name=user.get("name", "Customer"),
                    service_name=service.get("name", "Grooming Service") if service else "Grooming Service",
                    pet_name=pet.get("name", "Pet") if pet else "Pet",
                    date=booking.get("date", ""),
                    time=booking.get("time", ""),
                    booking_id=booking_id
                )
        except Exception as e:
            logger.error(f"Error sending confirmation email: {e}")
    
    return booking

@admin_router.delete("/bookings/{booking_id}")
async def admin_delete_booking(booking_id: str, request: Request):
    """Delete a booking permanently"""
    await get_current_admin(request)
    result = await db.bookings.delete_one({"booking_id": booking_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": "Booking deleted successfully"}


# ==================== Availability Management ====================

class BlockSlotRequest(BaseModel):
    date: str
    time: Optional[str] = None  # None = block entire day

@admin_router.get("/availability/blocked")
async def get_blocked_slots(request: Request):
    """Get all blocked dates and time slots"""
    await get_current_admin(request)
    blocked = await db.blocked_slots.find({}, {"_id": 0}).to_list(500)
    return blocked

@admin_router.post("/availability/block")
async def block_slot(data: BlockSlotRequest, request: Request):
    """Block a date or specific time slot"""
    admin = await get_current_admin(request)
    
    # Check if already blocked
    query = {"date": data.date, "time": data.time}
    existing = await db.blocked_slots.find_one(query)
    if existing:
        return {"message": "Already blocked"}
    
    # If blocking entire day, remove individual time blocks for that day
    if data.time is None:
        await db.blocked_slots.delete_many({"date": data.date, "time": {"$ne": None}})
    
    await db.blocked_slots.insert_one({
        "date": data.date,
        "time": data.time,
        "blocked_by": admin["admin_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": f"Blocked {'entire day' if data.time is None else data.time} on {data.date}"}

@admin_router.post("/availability/unblock")
async def unblock_slot(data: BlockSlotRequest, request: Request):
    """Unblock a date or specific time slot"""
    await get_current_admin(request)
    
    if data.time is None:
        # Unblock entire day (remove day block and all time blocks for that day)
        result = await db.blocked_slots.delete_many({"date": data.date})
    else:
        result = await db.blocked_slots.delete_one({"date": data.date, "time": data.time})
    
    return {"message": f"Unblocked {'entire day' if data.time is None else data.time} on {data.date}"}

@admin_router.get("/availability/blocked-dates")
async def get_blocked_dates(request: Request):
    """Get list of fully blocked dates (for calendar)"""
    await get_current_admin(request)
    day_blocks = await db.blocked_slots.find({"time": None}, {"_id": 0, "date": 1}).to_list(500)
    return [b["date"] for b in day_blocks]


@admin_router.get("/customers")
async def admin_get_customers(request: Request):
    """Get all customers"""
    await get_current_admin(request)
    users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    enriched = []
    for u in users:
        booking_count = await db.bookings.count_documents({"user_id": u["user_id"]})
        pet_count = await db.pets.count_documents({"user_id": u["user_id"]})
        enriched.append({**u, "booking_count": booking_count, "pet_count": pet_count})
    return enriched

@admin_router.get("/customers/{user_id}")
async def admin_get_customer_detail(user_id: str, request: Request):
    """Get customer details with pets and bookings"""
    await get_current_admin(request)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    pets = await db.pets.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    bookings = await db.bookings.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    addresses = await db.addresses.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return {"user": user, "pets": pets, "bookings": bookings, "addresses": addresses}

@admin_router.get("/services")
async def admin_get_services(request: Request):
    await get_current_admin(request)
    services = await db.services.find({}, {"_id": 0}).to_list(100)
    return services

@admin_router.post("/services")
async def admin_create_service(data: AdminServiceCreate, request: Request):
    await get_current_admin(request)
    service_id = f"service_{uuid.uuid4().hex[:8]}"
    doc = data.model_dump()
    doc["service_id"] = service_id
    await db.services.insert_one(doc)
    svc = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    return svc

@admin_router.put("/services/{service_id}")
async def admin_update_service(service_id: str, data: AdminServiceUpdate, request: Request):
    await get_current_admin(request)
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.services.update_one({"service_id": service_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    svc = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    return svc

@admin_router.delete("/services/{service_id}")
async def admin_delete_service(service_id: str, request: Request):
    await get_current_admin(request)
    result = await db.services.delete_one({"service_id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted"}

# Admin notification endpoints
@admin_router.get("/notifications")
async def admin_get_notifications(request: Request):
    admin = await get_current_admin(request)
    notifs = await db.notifications.find(
        {"recipient_type": "admin", "recipient_id": admin["admin_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    for n in notifs:
        if isinstance(n.get("created_at"), datetime):
            n["created_at"] = n["created_at"].isoformat()
    return notifs

@admin_router.get("/notifications/unread-count")
async def admin_unread_count(request: Request):
    admin = await get_current_admin(request)
    count = await db.notifications.count_documents(
        {"recipient_type": "admin", "recipient_id": admin["admin_id"], "read": False}
    )
    return {"count": count}

@admin_router.put("/notifications/{notification_id}/read")
async def admin_mark_read(notification_id: str, request: Request):
    admin = await get_current_admin(request)
    await db.notifications.update_one(
        {"notification_id": notification_id, "recipient_id": admin["admin_id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}

@admin_router.put("/notifications/read-all")
async def admin_mark_all_read(request: Request):
    admin = await get_current_admin(request)
    await db.notifications.update_many(
        {"recipient_type": "admin", "recipient_id": admin["admin_id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All marked as read"}

app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Serve logo
@app.get("/logo.png")
async def serve_logo():
    return FileResponse(ROOT_DIR / "logo.png", media_type="image/png")
