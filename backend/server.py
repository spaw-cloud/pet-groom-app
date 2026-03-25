import random
import smtplib
import os
from email.mime.text import MIMEText
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timedelta

router = APIRouter()

# Store OTPs (temporary)
otp_store = {}

# 🔐 ENV VARIABLES (SET IN RENDER)
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")


@router.post("/auth/send-otp")
async def send_otp(request: Request):
    body = await request.json()
    email = body.get("email", "").strip().lower()

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")

    # 🔢 Generate OTP
    otp = str(random.randint(100000, 999999))

    # Save OTP (valid for 5 minutes)
    otp_store[email] = {
        "otp": otp,
        "expires": datetime.utcnow() + timedelta(minutes=5)
    }

    try:
        msg = MIMEText(f"Your OTP is: {otp}")
        msg["Subject"] = "Your OTP Code"
        msg["From"] = EMAIL_USER
        msg["To"] = email

        # 🔥 Gmail SMTP
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
