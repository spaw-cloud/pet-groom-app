# backend/server.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
import os

app = FastAPI()

# ✅ MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["spaw_db"]
bookings_collection = db["bookings"]

# ✅ CORS (IMPORTANT 🔥)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Models
class Booking(BaseModel):
    name: str
    phone: str
    address: str
    pet: str
    time: str

class LoginData(BaseModel):
    username: str
    password: str

# ✅ Root
@app.get("/")
def home():
    return {"message": "API running 🚀"}

# ✅ Login
@app.post("/login")
def login(data: LoginData):
    if data.username == "admin" and data.password == "admin":
        return {"success": True, "token": "admin-token"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

# ✅ Create Booking
@app.post("/bookings")
def create_booking(booking: Booking):
    try:
        bookings_collection.insert_one(booking.dict())
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ✅ Get Bookings
@app.get("/bookings")
def get_bookings():
    try:
        bookings = list(bookings_collection.find({}, {"_id": 0}))
        return bookings
    except Exception as e:
        return {"success": False, "error": str(e)}
