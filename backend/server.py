# backend/server.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
import os

app = FastAPI()

# =========================
# ✅ ENV (Render / Local)
# =========================
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise Exception("❌ MONGO_URI not set in environment variables")

# =========================
# ✅ MongoDB connection
# =========================
try:
    client = MongoClient(MONGO_URI)
    db = client["spaw_db"]
    bookings_collection = db["bookings"]

    # test connection
    client.admin.command("ping")
    print("✅ MongoDB Connected")

except Exception as e:
    print("❌ MongoDB Connection Failed:", e)
    raise e

# =========================
# ✅ CORS (IMPORTANT)
# =========================
origins = [
    "http://localhost:5173",
    "https://your-vercel-app.vercel.app",  # 🔁 CHANGE THIS AFTER DEPLOY
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# ✅ Model
# =========================
class Booking(BaseModel):
    name: str
    phone: str
    address: str
    pet: str
    time: str

# =========================
# ✅ ROOT ROUTE
# =========================
@app.get("/")
def home():
    return {"message": "API running 🚀"}

# =========================
# ✅ CREATE BOOKING
# =========================
@app.post("/bookings")
def create_booking(booking: Booking):
    try:
        bookings_collection.insert_one(booking.model_dump())
        return {
            "success": True,
            "message": "Booking saved ✅"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================
# ✅ GET BOOKINGS (ADMIN)
# =========================
@app.get("/bookings")
def get_bookings():
    try:
        bookings = list(bookings_collection.find({}, {"_id": 0}))
        return bookings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))