from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ CORS FIX
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # keep * for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ ROOT
@app.get("/")
def root():
    return {"message": "Backend running 🚀"}


# ============================
# 🔐 ADMIN LOGIN (MAIN FIX)
# ============================
@app.post("/api/admin/login")
async def admin_login(data: dict):
    phone = data.get("phone")
    password = data.get("password")

    if phone == "8778454723" and password == "admin123":
        return {
            "success": True,
            "token": "admin-token",
            "admin": {"phone": phone}
        }

    raise HTTPException(status_code=401, detail="Invalid credentials")


# ============================
# 📦 SERVICES
# ============================
@app.get("/api/services")
def get_services():
    return [
        {"id": 1, "name": "Bath & Grooming", "price": 499},
        {"id": 2, "name": "Hair Trimming", "price": 299},
    ]


# ============================
# 📅 BOOKINGS
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
# 👤 CUSTOMERS
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
# 🕒 BOOKED SLOTS
# ============================
@app.get("/api/booked-slots")
def get_slots():
    return [
        {"date": "2026-03-27", "slots": ["10:00 AM", "11:00 AM"]}
    ]


# ============================
# 🧪 TEST
# ============================
@app.get("/api/test")
def test():
    return {"status": "API working ✅"}
