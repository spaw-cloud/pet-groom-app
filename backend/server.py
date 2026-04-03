from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os

app = FastAPI()

# ✅ CORS (IMPORTANT for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ ENV (Render / Local)
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise Exception("❌ MONGO_URI not set in environment variables")

# ✅ MongoDB connection
client = MongoClient(MONGO_URI)
db = client["spaw_db"]

print("✅ MongoDB Connected")

# ============================================
# 🔥 TEMP DATA (for frontend testing)
# ============================================

services_data = [
    {"id": 1, "name": "Basic Grooming", "price": 499},
    {"id": 2, "name": "Full Grooming", "price": 999},
    {"id": 3, "name": "Hair Cut", "price": 299},
]

pets_data = []

# ============================================
# ✅ ROUTES
# ============================================

# 🔹 Root check
@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}

# 🔹 SERVICES
@app.get("/services")
def get_services():
    return services_data

# 🔹 PETS
@app.get("/pets")
def get_pets():
    return pets_data

# 🔹 DELETE PET
@app.delete("/pets/{pet_id}")
def delete_pet(pet_id: int):
    global pets_data
    pets_data = [p for p in pets_data if p.get("id") != pet_id]
    return {"message": "Pet deleted"}