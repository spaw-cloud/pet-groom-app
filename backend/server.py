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

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_APP_PASSWORD = os.getenv("SMTP_APP_PASSWORD")

# ================== APP INIT ==================
app = FastAPI()

# ✅ ROOT ROUTE (fixes 404)
@app.get("/")
def root():
    return {"message": "Backend is running successfully 🚀"}

# ================== CORS ==================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== DATABASE ==================
if not MONGO_URL:
    raise Exception("❌ MONGO_URL is missing in .env")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ================== ROUTER ==================
api_router = APIRouter(prefix="/api")

# ================== SEND OTP ==================
@api_router.post("/auth/send-otp")
async def send_otp(request: Request):
    data = await request.json()
    email = data.get("email")

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    otp = str(random.randint(100000, 999999))

    # delete old OTPs
    await db.otp_codes.delete_many({"email": email})

    # save new OTP
    await db.otp_codes.insert_one({
        "email": email,
        "otp": otp,
        "created_at": datetime.now(timezone.utc)
    })

    # ================== EMAIL SENDING ==================
    if os.getenv("SKIP_EMAIL") == "1":
        print(f"🔐 OTP for {email}: {otp}")
    else:
        try:
            msg = MIMEMultipart()
            msg["From"] = SMTP_EMAIL
            msg["To"] = email
            msg["Subject"] = "Your OTP Code"

            msg.attach(MIMEText(f"Your OTP is: {otp}", "plain"))

            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_APP_PASSWORD)
            server.send_message(msg)
            server.quit()

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Email failed: {str(e)}")

    return {"message": "OTP sent successfully"}

# ================== VERIFY OTP ==================
@api_router.post("/auth/verify-otp")
async def verify_otp(request: Request):
    data = await request.json()
    email = data.get("email")
    otp = data.get("otp")

    if not email or not otp:
        raise HTTPException(status_code=400, detail="Email and OTP required")

    record = await db.otp_codes.find_one({"email": email})

    if not record:
        raise HTTPException(status_code=400, detail="OTP not found")

    # ✅ FIX: convert both to string before comparing
    if str(record["otp"]) != str(otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # ✅ expiry check (5 minutes)
    if datetime.now(timezone.utc) - record["created_at"] > timedelta(minutes=5):
        raise HTTPException(status_code=400, detail="OTP expired")

    # delete after success
    await db.otp_codes.delete_many({"email": email})

    return {"message": "OTP verified successfully"}

# ================== INCLUDE ROUTER ==================
app.include_router(api_router)

# ================== RUN ==================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port)
