from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = FastAPI()
router = APIRouter()

# ------------------ CORS ------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ DATABASE ------------------
MONGO_URL = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(MONGO_URL)
db = client["pet_groom"]

# ------------------ EMAIL CONFIG ------------------
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

def send_email(to_email, otp):
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_USER
        msg["To"] = to_email
        msg["Subject"] = "Your OTP Code"

        body = f"Your OTP is {otp}"
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print("Email error:", e)

# ------------------ SEND OTP ------------------
@router.post("/auth/send-otp")
async def send_otp(request: Request):
    try:
        body = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    email = str(body.get("email", "")).strip().lower()

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")

    otp = str(random.randint(100000, 999999))

    await db.otps.update_one(
        {"email": email},
        {
            "$set": {
                "otp": otp,
                "expires": datetime.now(timezone.utc) + timedelta(minutes=5)
            }
        },
        upsert=True
    )

    send_email(email, otp)

    return {"message": "OTP sent"}

# ------------------ VERIFY OTP ------------------
@router.post("/auth/verify-otp")
async def verify_otp(request: Request):
    try:
        body = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    email = str(body.get("email", "")).strip().lower()
    otp = str(body.get("otp", "")).strip()

    record = await db.otps.find_one({"email": email})

    if not record:
        raise HTTPException(status_code=400, detail="OTP not found")

    if record["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if record["expires"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")

    return {
        "message": "OTP verified successfully",
        "user": {"email": email}
    }

# ------------------ ROUTER ------------------
app.include_router(router, prefix="/api")

# ------------------ ROOT ------------------
@app.get("/")
def root():
    return {"status": "Backend running"}
