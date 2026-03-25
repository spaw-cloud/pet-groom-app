from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
import random
from dotenv import load_dotenv
import uvicorn

# ================== LOAD ENV ==================
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

# ================== APP INIT ==================
app = FastAPI()

# ✅ ROOT ROUTE
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
    body = await request.json()
    email = body.get("email")

    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    otp = str(random.randint(100000, 999999))

    # save OTP in DB
    await db.otp_codes.delete_many({"email": email})
    await db.otp_codes.insert_one({
        "email": email,
        "otp": otp,
        "created_at": datetime.now(timezone.utc)
    })

    print("OTP:", otp)

    return {
        "message": "OTP generated successfully",
        "otp": otp   # ⚠️ remove this later in production
    }

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

    if str(record["otp"]) != str(otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.now(timezone.utc) - record["created_at"] > timedelta(minutes=5):
        raise HTTPException(status_code=400, detail="OTP expired")

    await db.otp_codes.delete_many({"email": email})

    return {"message": "OTP verified successfully"}

# ================== INCLUDE ROUTER ==================
app.include_router(api_router)

# ================== RUN ==================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port)
