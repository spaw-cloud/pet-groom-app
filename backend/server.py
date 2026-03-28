import smtplib
from email.mime.text import MIMEText

@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    try:
        data = request.get_json()

        email = data.get("email")

        if not email:
            return jsonify({"error": "Email is required"}), 400

        otp = random.randint(1000, 9999)

        # EMAIL CONFIG
        sender_email = "yourgmail@gmail.com"
        sender_password = "your_app_password"

        msg = MIMEText(f"Your OTP is: {otp}")
        msg["Subject"] = "Your OTP Code"
        msg["From"] = sender_email
        msg["To"] = email

        # SEND EMAIL
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()

        print(f"OTP sent to {email}: {otp}")

        return jsonify({"message": "OTP sent successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
