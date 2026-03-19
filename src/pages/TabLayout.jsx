import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { IoHome, IoCalendar, IoPaw, IoPerson } from 'react-icons/io5';

const tabs = [
  { path: '/tabs', icon: IoHome, label: 'Services' },
  { path: '/tabs/bookings', icon: IoCalendar, label: 'Bookings' },
  { path: '/tabs/pets', icon: IoPaw, label: 'My Pets' },
  { path: '/tabs/profile', icon: IoPerson, label: 'Profile' },
];

export default function TabLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="page" data-testid="tab-layout">
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
      <div className="tab-bar">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path || (path !== '/tabs' && location.pathname.startsWith(path));
          return (
            <button key={path} className={`tab-item ${active ? 'active' : ''}`} onClick={() => navigate(path)} data-testid={`tab-${label.toLowerCase().replace(/ /g, '-')}`}>
              <Icon size={24} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
