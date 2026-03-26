from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ CORS (VERY IMPORTANT for frontend connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Root test route
@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}


# ✅ ADMIN LOGIN ROUTE (THIS FIXES YOUR ERROR)
@app.post("/api/admin/login")
async def admin_login(data: dict):
    phone = data.get("phone")
    password = data.get("password")

    # 🔐 Change credentials if needed
    if phone == "8778454723" and password == "admin123":
        return {
            "success": True,
            "token": "admin-token",
            "admin": {
                "phone": phone
            }
        }

    raise HTTPException(status_code=401, detail="Invalid credentials")


# ✅ OPTIONAL: test API (to check frontend connection)
@app.get("/api/test")
def test():
    return {"status": "API working ✅"}
