from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from jose import jwt
from passlib.context import CryptContext
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ---------------- CONFIG ----------------
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"

# ✅ YOUR MONGODB URI (ADDED)
MONGO_URI = "mongodb+srv://spawcbe_db_user:Spawappleid2026@cluster0.rtqzjmi.mongodb.net/?appName=Cluster0"

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

# ---------------- SECURITY ----------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
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


# ---------------- AUTO CREATE ADMIN ----------------
def create_admin():
    existing = users_col.find_one({"phone": "8778454723"})
    if not existing:
        users_col.insert_one({
            "phone": "8778454723",
            "password": pwd_context.hash("admin123")
        })
        print("✅ Admin user created")
    else:
        print("✅ Admin already exists")

create_admin()


# ---------------- ADMIN LOGIN ----------------
@app.post("/api/admin/login")
def login(data: dict):
    user = users_col.find_one({"phone": data.get("phone")})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not pwd_context.verify(data.get("password"), user["password"]):
        raise HTTPException(status_code=401, detail="Wrong password")

    token = create_token({"phone": user["phone"]})
    return {"success": True, "token": token}


# ---------------- SERVICES CRUD ----------------
@app.get("/api/services")
def get_services(user=Depends(verify_token)):
    return list(services_col.find({}, {"_id": 0}))


@app.post("/api/services")
def add_service(data: dict, user=Depends(verify_token)):
    new_service = {
        "id": int(data.get("id", 0)) or int(services_col.count_documents({}) + 1),
        "name": data.get("name"),
        "price": data.get("price"),
    }
    services_col.insert_one(new_service)
    return new_service


@app.delete("/api/services/{service_id}")
def delete_service(service_id: int, user=Depends(verify_token)):
    services_col.delete_one({"id": service_id})
    return {"message": "Deleted"}


# ---------------- BOOKINGS ----------------
@app.get("/api/admin/bookings")
def get_bookings(user=Depends(verify_token)):
    return [
        {
            "id": 1,
            "customer": "Rahul",
            "service": "Bath & Grooming",
            "date": "2026-03-27",
            "time": "10:00 AM",
        }
    ]


# ---------------- CUSTOMERS ----------------
@app.get("/api/admin/customers")
def get_customers(user=Depends(verify_token)):
    return [
        {
            "id": 1,
            "name": "Rahul",
            "phone": "9876543210"
        }
    ]


# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"message": "API running 🚀"}
