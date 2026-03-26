from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from jose import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import random
import smtplib
from email.mime.text import MIMEText

# ---------------- CONFIG ----------------
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"

MONGO_URI = "mongodb+srv://spawcbe_db_user:Spawappleid2026@cluster0.rtqzjmi.mongodb.net/?appName=Cluster0"

# 🔴 REPLACE THESE WITH YOUR GMAIL DETAILS
EMAIL = "spawcbe@gmail.com"
PASSWORD = "mqnbdhwotsrqmjrk"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATABASE ----------------
client = MongoClient(MONGO_URI)
db = client["petgroom"]

services_col = db["services"]
users_col = db["users"]
bookings_col = db["bookings"]

# ---------------- SECURITY ----------------
security = HTTPBearer()

def create_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        raise HTTPException(status_code=401, detail="Unauthorized")

# ---------------- ADMIN AUTO CREATE ----------------
def create_admin():
    existing = users_col.find_one({"phone": "8778454723"})
    if not existing:
        users_col.insert_one({
            "phone": "8778454723",
            "password": "admin123"
        })

create_admin()

# ---------------- ADMIN LOGIN ----------------
@app.post("/api/admin/login")
def login(data: dict):
    user = users_col.find_one({"phone": data.get("phone")})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.get("password") != user["password"]:
        raise HTTPException(status_code=401, detail="Wrong password")

    token = create_token({"phone": user["phone"]})
    return {"success": True, "token": token}

# =========================================================
# 🔥 OTP AUTH (NEW - DOES NOT AFFECT ADMIN)
# =========================================================

otp_store = {}

def send_otp_email(email, otp):
    msg = MIMEText(f"Your OTP is {otp}")
    msg["Subject"] = "Spaw Group Login OTP"
    msg["From"] = EMAIL
    msg["To"] = email

    try:
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(EMAIL, PASSWORD)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print("Email error:", e)
        raise HTTPException(status_code=500, detail="Failed to send OTP")

@app.post("/api/auth/send-otp")
def send_otp(data: dict):
    email = data.get("email")

    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    otp = str(random.randint(100000, 999999))
    otp_store[email] = otp

    send_otp_email(email, otp)

    return {"message": "OTP sent successfully"}

@app.post("/api/auth/verify-otp")
def verify_otp(data: dict):
    email = data.get("email")
    otp = data.get("otp")

    if otp_store.get(email) != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = users_col.find_one({"email": email})

    if not user:
        users_col.insert_one({"email": email})

    token = create_token({"email": email})

    return {"success": True, "token": token}

# =========================================================
# SERVICES (UNCHANGED)
# =========================================================

@app.get("/api/services")
def get_services(user=Depends(verify_token)):
    return list(services_col.find({}, {"_id": 0}))

@app.post("/api/services")
def add_service(data: dict, user=Depends(verify_token)):
    new_service = {
        "id": int(services_col.count_documents({}) + 1),
        "name": data.get("name"),
        "price": data.get("price"),
    }
    services_col.insert_one(new_service)
    return new_service

@app.delete("/api/services/{service_id}")
def delete_service(service_id: int, user=Depends(verify_token)):
    services_col.delete_one({"id": service_id})
    return {"message": "Deleted"}

# =========================================================
# BOOKINGS (NOW REAL)
# =========================================================

@app.post("/api/bookings")
def create_booking(data: dict, user=Depends(verify_token)):
    booking = {
        "id": int(bookings_col.count_documents({}) + 1),
        "email": user.get("email"),
        "service": data.get("service"),
        "date": data.get("date"),
        "time": data.get("time"),
    }

    bookings_col.insert_one(booking)
    return booking

@app.get("/api/admin/bookings")
def get_bookings(user=Depends(verify_token)):
    return list(bookings_col.find({}, {"_id": 0}))

# =========================================================
# CUSTOMERS
# =========================================================

@app.get("/api/admin/customers")
def get_customers(user=Depends(verify_token)):
    return list(users_col.find({}, {"_id": 0}))

# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"message": "API running 🚀"}
