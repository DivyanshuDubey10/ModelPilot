import { NavLink, useLocation } from 'react-router-dom';
import {
  House,
  Flask,
  ClockCounterClockwise,
  PlusCircle,
  Compass,
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
      { to: '/experiments/new', label: 'New Experiment', icon: PlusCircle },
      { to: '/history', label: 'History', icon: ClockCounterClockwise },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Compass size={16} weight="bold" />
        </div>
        <div className="sidebar-brand">
          Model<span>Pilot</span>
        </div>
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
                    <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
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
          <Flask size={12} weight="regular" style={{ marginRight: 4, verticalAlign: 'middle' }} />
          v0.1.0 · Hackathon MVP
        </div>
      </div>
    </aside>
  );
}
