from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import os

app = Flask(__name__)

# ✅ Allow frontend (Vercel) to access backend
CORS(app)

# ✅ MongoDB connection (set this in Render env)
MONGO_URI = os.environ.get("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["pet_grooming"]
collection = db["bookings"]

# ✅ Test route
@app.route("/")
def home():
    return "Backend is running 🚀"

# ✅ GET all bookings
@app.route("/bookings", methods=["GET"])
def get_bookings():
    bookings = []
    for b in collection.find().sort("_id", -1):  # latest first
        b["_id"] = str(b["_id"])
        bookings.append(b)
    return jsonify(bookings)

# ✅ CREATE booking
@app.route("/bookings", methods=["POST"])
def create_booking():
    data = request.json

    new_booking = {
        "name": data.get("name"),
        "pet": data.get("pet"),
        "phone": data.get("phone"),
        "time": data.get("time"),
        "address": data.get("address"),
        "status": "Pending"
    }

    result = collection.insert_one(new_booking)
    new_booking["_id"] = str(result.inserted_id)

    return jsonify(new_booking), 201

# ✅ UPDATE booking (status)
@app.route("/bookings/<id>", methods=["PUT"])
def update_booking(id):
    data = request.json

    collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": data.get("status")}}
    )

    return jsonify({"message": "Updated successfully"})

# ✅ DELETE booking
@app.route("/bookings/<id>", methods=["DELETE"])
def delete_booking(id):
    collection.delete_one({"_id": ObjectId(id)})
    return jsonify({"message": "Deleted successfully"})

# ✅ Run locally
if __name__ == "__main__":
    app.run(debug=True)
