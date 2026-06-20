import React from 'react';

export default function SidebarTab({ label, active, onClick }) {
  return (
    <button
      type="button"
      className={`sidebar-tab ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
