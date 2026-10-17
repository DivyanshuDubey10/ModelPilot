import { NavLink, useLocation } from 'react-router-dom';
import {
  House,
  Flask,
  ClockCounterClockwise,
  PlusCircle,
} from '@phosphor-icons/react';
import './Sidebar.css';

const navItems = [
  {
    section: 'Overview',
    links: [
      { to: '/', label: 'Dashboard', icon: House },
    ],
  },
  {
    section: 'Experiments',
    links: [
      { to: '/experiments/new', label: 'New experiment', icon: PlusCircle },
      { to: '/history', label: 'History', icon: ClockCounterClockwise },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-header">
        {/* Simple monochrome mark — no gradient tile */}
        <div className="sidebar-logo" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 1L11 3.5V8.5L6 11L1 8.5V3.5L6 1Z" fill="white" />
          </svg>
        </div>
        {/* Brand: sans font, no split color */}
        <span className="sidebar-brand">ModelPilot</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.links.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-link-icon">
                    <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
                  </span>
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-version">
          <Flask size={11} weight="regular" style={{ marginRight: 4, verticalAlign: 'middle' }} />
          v1.0
        </div>
      </div>
    </aside>
  );
}
