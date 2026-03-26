from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ CORS (IMPORTANT for frontend connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change later for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Root route
@app.get("/")
def root():
    return {"message": "Pet Grooming API running 🚀"}


# ============================
# 🔐 ADMIN LOGIN
# ============================
@app.post("/api/admin/login")
async def admin_login(data: dict):
    phone = data.get("phone")
    password = data.get("password")

    if phone == "8778454723" and password == "admin123":
        return {
            "success": True,
            "token": "admin-token",
            "admin": {
                "phone": phone
            }
        }

    raise HTTPException(status_code=401, detail="Invalid credentials")


# ============================
# 📦 SERVICES (DUMMY DATA)
# ============================
@app.get("/api/services")
def get_services():
    return [
        {"id": 1, "name": "Bath & Grooming", "price": 499},
        {"id": 2, "name": "Hair Trimming", "price": 299},
        {"id": 3, "name": "Nail Clipping", "price": 199},
    ]


# ============================
# 📅 BOOKINGS (DUMMY DATA)
# ============================
@app.get("/api/admin/bookings")
def get_bookings():
    return [
        {
            "id": 1,
            "customer": "Rahul",
            "service": "Bath & Grooming",
            "date": "2026-03-27",
            "time": "10:00 AM",
        }
    ]


# ============================
# 👤 CUSTOMERS (DUMMY DATA)
# ============================
@app.get("/api/admin/customers")
def get_customers():
    return [
        {
            "id": 1,
            "name": "Rahul",
            "phone": "9876543210"
        }
    ]


# ============================
# 🕒 BOOKED SLOTS (FIX 404 ERROR)
# ============================
@app.get("/api/booked-slots")
def get_booked_slots():
    return [
        {"date": "2026-03-27", "slots": ["10:00 AM", "11:00 AM"]}
    ]


# ============================
# 🧪 TEST ROUTE
# ============================
@app.get("/api/test")
def test():
    return {"status": "API working ✅"}
