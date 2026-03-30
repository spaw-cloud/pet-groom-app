# server.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
import os

app = FastAPI()

# ✅ ENV (for deployment)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# ✅ MongoDB connection
client = MongoClient(MONGO_URI)
db = client["spaw_db"]
bookings_collection = db["bookings"]

# ✅ CORS (IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-vercel-app.vercel.app",  # change after deploy
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Model
class Booking(BaseModel):
    name: str
    phone: str
    address: str
    pet: str
    time: str

# ✅ Health check
@app.get("/")
def home():
    return {"message": "API running 🚀"}

# ✅ Create booking
@app.post("/bookings")
def create_booking(booking: Booking):
    try:
        bookings_collection.insert_one(booking.dict())
        return {"success": True, "message": "Booking saved ✅"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ✅ Get all bookings (for admin)
@app.get("/bookings")
def get_bookings():
    bookings = list(bookings_collection.find({}, {"_id": 0}))
    return bookings
