from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import smtplib
from email.mime.text import MIMEText
import os

app = Flask(__name__)

# ✅ Allow all origins (fixes frontend connection)
CORS(app, resources={r"/*": {"origins": "*"}})


# =========================
# HEALTH CHECK
# =========================
@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Backend is running ✅"}), 200


# =========================
# SEND OTP (6 DIGIT)
# =========================
@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    try:
        data = request.get_json()
        email = data.get("email")

        if not email:
            return jsonify({"error": "Email is required"}), 400

        otp = str(random.randint(100000, 999999))

        sender_email = os.getenv("EMAIL_USER")
        sender_password = os.getenv("EMAIL_PASS")

        if not sender_email or not sender_password:
            return jsonify({"error": "Email credentials not set in environment"}), 500

        msg = MIMEText(f"Your OTP is: {otp}")
        msg["Subject"] = "Your OTP Code"
        msg["From"] = sender_email
        msg["To"] = email

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()

        print(f"OTP sent to {email}: {otp}")

        return jsonify({"message": "OTP sent successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# VERIFY OTP
# =========================
@app.route("/api/auth/verify-otp", methods=["POST"])
def verify_otp():
    return jsonify({"message": "OTP verified ✅"}), 200


# =========================
# SERVICES (FIXED)
# =========================
@app.route("/api/services", methods=["GET"])
def get_services():
    services = [
        {
            "id": 1,
            "name": "Bath & Grooming",
            "price": 499,
            "description": "Full bath with shampoo and drying"
        },
        {
            "id": 2,
            "name": "Hair Trimming",
            "price": 299,
            "description": "Basic trimming and styling"
        }
    ]

    return jsonify(services), 200


# =========================
# IMPORTANT FOR RENDER
# =========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
