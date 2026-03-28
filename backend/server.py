from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ CORS (VERY IMPORTANT for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Root route (fix 405 issue)
@app.get("/")
def home():
    return {"message": "Pet Groom API is running 🚀"}


# 🧠 Dummy DB (replace later with real DB)
services = [
    {"id": 1, "name": "Signature Bath", "price": 999},
    {"id": 2, "name": "Express Trim", "price": 1199},
    {"id": 3, "name": "Full Groom", "price": 1999},
]

bookings = []


# ✅ Get services
@app.get("/services")
def get_services():
    return services


# ✅ Create booking
@app.post("/bookings")
def create_booking(data: dict):
    # Prevent double booking
    for b in bookings:
        if b["date"] == data["date"] and b["time"] == data["time"]:
            raise HTTPException(status_code=400, detail="Slot already booked")

    bookings.append(data)
    return {"message": "Booking successful", "data": data}


# ✅ Get booked slots
@app.get("/bookings/slots")
def get_slots(date: str):
    slots = [b["time"] for b in bookings if b["date"] == date]
    return slots


# ✅ Get all bookings (admin)
@app.get("/bookings")
def get_all_bookings():
    return bookings
