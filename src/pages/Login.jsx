import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../lib/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Enter username & password");
      return;
    }

    try {
      const res = await API.post("/login", {
        username,
        password,
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        alert("Login successful ✅");
        navigate("/admin/services");
      } else {
        alert("Invalid login ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Login failed ❌");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Login</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
