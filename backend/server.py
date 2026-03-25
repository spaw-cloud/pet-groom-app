from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import random
import smtplib
import os
from email.mime.text import MIMEText

# ✅ CREATE APP (THIS WAS MISSING)
app = FastAPI()

# ✅ CORS (IMPORTANT FOR FRONTEND)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter()

# Temporary OTP store
otp_store = {}

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")


# 🔹 SEND OTP
@router.post("/auth/send-otp")
async def send_otp(request: Request):
    body = await request.json()
    email = body.get("email", "").strip().lower()

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")

    otp = str(random.randint(100000, 999999))

    otp_store[email] = {
        "otp": otp,
        "expires": datetime.utcnow() + timedelta(minutes=5)
    }

    try:
        msg = MIMEText(f"Your OTP is: {otp}")
        msg["Subject"] = "Your OTP Code"
        msg["From"] = EMAIL_USER
        msg["To"] = email

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.sendmail(EMAIL_USER, email, msg.as_string())
        server.quit()

        print("✅ OTP sent:", otp)

    except Exception as e:
        print("❌ Email error:", str(e))
        raise HTTPException(status_code=500, detail="Failed to send email")

    return {"message": "OTP sent successfully"}


# 🔹 VERIFY OTP
@router.post("/auth/verify-otp")
async def verify_otp(request: Request):
    body = await request.json()
    email = body.get("email", "").strip().lower()
    otp = body.get("otp")

    record = otp_store.get(email)

    if not record:
        raise HTTPException(status_code=400, detail="OTP not found")

    if datetime.utcnow() > record["expires"]:
        raise HTTPException(status_code=400, detail="OTP expired")

    if record["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    return {
        "message": "OTP verified",
        "user": {"email": email},
        "session_token": "demo_token"
    }


# ✅ INCLUDE ROUTER
app.include_router(router, prefix="/api")
