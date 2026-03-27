import React from "react";

const Dashboard = () => {
  return (
    <div className="p-6 text-white min-h-screen bg-gray-900">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-gray-800 p-5 rounded-2xl shadow">
          <h2 className="text-lg text-gray-300">Total Bookings</h2>
          <p className="text-2xl font-bold mt-2">--</p>
        </div>

        {/* Card 2 */}
        <div className="bg-gray-800 p-5 rounded-2xl shadow">
          <h2 className="text-lg text-gray-300">Customers</h2>
          <p className="text-2xl font-bold mt-2">--</p>
        </div>

        {/* Card 3 */}
        <div className="bg-gray-800 p-5 rounded-2xl shadow">
          <h2 className="text-lg text-gray-300">Revenue</h2>
          <p className="text-2xl font-bold mt-2">₹0</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
