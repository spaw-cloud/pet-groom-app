from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os

app = FastAPI()

# CORS (allow frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URI = "mongodb+srv://spaw_db_user:Spawappleid2026@cluster0.rtqzjmi.mongodb.net/spaw"

client = MongoClient(MONGO_URI)
db = client["spaw"]

# Collections
services_collection = db["services"]

# Routes
@app.get("/")
def home():
    return {"message": "Backend is running 🚀"}

@app.get("/services")
def get_services():
    services = list(services_collection.find({}, {"_id": 0}))
    return services

@app.post("/services")
def add_service(service: dict):
    services_collection.insert_one(service)
    return {"message": "Service added successfully"}

@app.delete("/services/{name}")
def delete_service(name: str):
    services_collection.delete_one({"name": name})
    return {"message": "Service deleted"}
