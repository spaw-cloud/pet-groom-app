<div style={{ padding: "20px" }}>
  <h2 style={{ color: "#fff" }}>Admin Dashboard</h2>

  <div style={{ display: "grid", gap: "15px" }}>
    {services.map((item, i) => (
      <div key={i} style={{
        background: "#fff",
        padding: "15px",
        borderRadius: "10px",
        boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
      }}>
        <b>{item.name}</b> ({item.pet})<br/>
        📞 {item.phone}<br/>
        🕒 {item.time}
      </div>
    ))}
  </div>
</div>