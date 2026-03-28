from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

# =========================
# HEALTH CHECK (IMPORTANT)
# =========================
@app.route("/")
def home():
    return jsonify({"status": "Backend is running ✅"}), 200


# =========================
# SEND OTP ROUTE (FIXED)
# =========================
@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    try:
        data = request.get_json()

        phone = data.get("phone")

        if not phone:
            return jsonify({"error": "Phone number is required"}), 400

        # Generate OTP (mock)
        otp = random.randint(1000, 9999)

        print(f"📲 OTP for {phone}: {otp}")

        # NOTE: Here you can integrate Twilio later

        return jsonify({
            "message": "OTP sent successfully",
            "otp": otp  # REMOVE THIS IN PRODUCTION
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# VERIFY OTP (OPTIONAL)
# =========================
@app.route("/api/auth/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = request.get_json()

        otp = data.get("otp")

        if not otp:
            return jsonify({"error": "OTP is required"}), 400

        # MOCK verification
        return jsonify({"message": "OTP verified ✅"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# SERVICES (FOR FRONTEND FIX)
# =========================
@app.route("/api/services", methods=["GET"])
def get_services():
    services = [
        {"name": "Bath & Grooming", "price": 499},
        {"name": "Hair Trimming", "price": 299}
    ]
    return jsonify(services), 200


# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
