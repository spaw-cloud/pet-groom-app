from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import uvicorn

# ================== LOAD ENV ==================
load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

SMTP_EMAIL = os.environ.get("SMTP_EMAIL")
SMTP_APP_PASSWORD = os.environ.get("SMTP_APP_PASSWORD")

# ================== DB ==================
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ================== APP ==================
app = FastAPI()

# 🔥 FIXED CORS (THIS IS THE KEY FIX)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ✅ allow all (fixes your issue immediately)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter(prefix="/api")

# ================== EMAIL ==================
def send_otp_email(to_email: str, otp: str):
    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_EMAIL
        msg["To"] = to_email
        msg["Subject"] = "Your OTP Code"

        body = f"Your OTP is: {otp}"
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_APP_PASSWORD)
        server.send_message(msg)
        server.quit()

    except Exception as e:
        print("EMAIL ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Email failed")

# ================== SEND OTP ==================
@router.post("/auth/send-otp")
async def send_otp(request: Request):
    body = await request.json()
    email = body.get("email", "").strip().lower()

    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    otp = str(random.randint(100000, 999999))

    print("GENERATED OTP:", otp)

    # send email
    send_otp_email(email, otp)

    # store in DB
    await db.otp_codes.delete_many({"email": email})

    await db.otp_codes.insert_one({
        "email": email,
        "otp": otp,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
    })

    return {"success": True}

# ================== VERIFY OTP ==================
@router.post("/auth/verify-otp")
async def verify_otp(request: Request):
    body = await request.json()

    email = body.get("email", "").strip().lower()
    otp = str(body.get("otp", "")).strip()

    if not email or not otp:
        raise HTTPException(status_code=400, detail="Missing data")

    record = await db.otp_codes.find_one({"email": email})

    if not record:
        raise HTTPException(status_code=400, detail="No OTP found")

    stored_otp = str(record.get("otp")).strip()
    expires_at = record.get("expires_at")

    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")

    if otp != stored_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    await db.otp_codes.delete_many({"email": email})

    return {
        "success": True,
        "message": "OTP verified"
    }

# ================== HEALTH CHECK ==================
@router.get("/")
async def root():
    return {"status": "API WORKING"}

# ================== REGISTER ROUTER ==================
app.include_router(router)

# ================== RUN ==================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port)
