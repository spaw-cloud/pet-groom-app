from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import uuid

# ================= CONFIG =================

MONGO_URL = os.getenv("MONGO_URL")
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# ================= APP =================

app = FastAPI()
router = APIRouter()

# ✅ CORS FIX (VERY IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DATABASE =================

client = AsyncIOMotorClient(MONGO_URL)
db = client["spaw_db"]

# ================= EMAIL FUNCTION =================

def send_email(to_email, otp):
    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_EMAIL
        msg["To"] = to_email
        msg["Subject"] = "Your OTP Code"

        body = f"Your OTP is: {otp}"
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        server.quit()

        print("✅ Email sent")

    except Exception as e:
        print("❌ Email error:", str(e))


# ================= SEND OTP =================

@router.post("/api/auth/send-otp")
async def send_otp(request: Request):
    body = await request.json()
    email = body.get("email")

    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    otp = str(random.randint(100000, 999999))

    # delete old OTP
    await db.otp_codes.delete_many({"email": email})

    # store OTP
    await db.otp_codes.insert_one({
        "email": email,
        "otp": otp,
        "created_at": datetime.utcnow()
    })

    # send email
    send_email(email, otp)

    print("OTP:", otp)  # for debugging

    return {"message": "OTP generated successfully"}


# ================= VERIFY OTP =================

@router.post("/api/auth/verify-otp")
async def verify_otp(request: Request):
    body = await request.json()
    email = body.get("email")
    otp = body.get("otp")

    if not email or not otp:
        raise HTTPException(status_code=400, detail="Missing email or OTP")

    record = await db.otp_codes.find_one({"email": email})

    if not record:
        raise HTTPException(status_code=400, detail="OTP not found")

    if record["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # delete OTP after use
    await db.otp_codes.delete_many({"email": email})

    token = str(uuid.uuid4())

    return {
        "session_token": token,
        "user": {"email": email}
    }


# ================= LOGIN =================

@router.post("/api/auth/login")
async def login(request: Request):
    body = await request.json()
    email = body.get("email")

    # simulate user not found → trigger OTP
    raise HTTPException(status_code=404, detail="User not found")


# ================= ME =================

@router.get("/api/auth/me")
async def get_me():
    return {"email": "test@example.com"}


# ================= LOGOUT =================

@router.post("/api/auth/logout")
async def logout():
    return {"message": "Logged out"}


# ================= REGISTER ROUTES =================

app.include_router(router)
