from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
MONGO_URI = "mongodb+srv://spaw_db_user:YOUR_PASSWORD@cluster0.rtqzjmi.mongodb.net/spaw"
client = MongoClient(MONGO_URI)
db = client["spaw"]

services_collection = db["services"]
bookings_collection = db["bookings"]

# Home
@app.get("/")
def home():
    return {"message": "Backend is running 🚀"}

# SERVICES APIs
@app.get("/services")
def get_services():
    return list(services_collection.find({}, {"_id": 0}))

@app.post("/services")
def add_service(service: dict):
    services_collection.insert_one(service)
    return {"message": "Service added"}

@app.delete("/services/{name}")
def delete_service(name: str):
    services_collection.delete_one({"name": name})
    return {"message": "Service deleted"}

# BOOKINGS APIs
@app.post("/bookings")
def create_booking(data: dict):
    existing = bookings_collection.find_one({
        "date": data.get("date"),
        "time": data.get("time")
    })

    if existing:
        return {"error": "Slot already booked ❌"}

    bookings_collection.insert_one(data)
    return {"message": "Booking created ✅"}

@app.get("/bookings")
def get_bookings():
    return list(bookings_collection.find({}, {"_id": 0}))

@app.delete("/bookings/{name}")
def delete_booking(name: str):
    bookings_collection.delete_one({"name": name})
    return {"message": "Booking deleted"}
