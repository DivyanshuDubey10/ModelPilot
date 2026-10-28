import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CaretRight, List, X } from '@phosphor-icons/react';
import { checkHealth } from '../../api/endpoints';
import { getApiBaseUrl } from '../../api/client';

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/experiments/new': 'New Experiment',
  '/history': 'Experiment History',
};

function getBreadcrumbs(pathname: string): { label: string; path: string }[] {
  const crumbs = [{ label: 'ModelPilot', path: '/' }];

  // Experiment detail pages: /experiments/:id
  if (pathname.startsWith('/experiments/') && pathname !== '/experiments/new') {
    crumbs.push({ label: 'Experiments', path: '/history' });
    const id = pathname.split('/')[2];
    // Check if it's a report page
    if (pathname.endsWith('/report')) {
      crumbs.push({ label: `Experiment ${id.slice(0, 8)}`, path: `/experiments/${id}` });
      crumbs.push({ label: 'Report', path: pathname });
    } else {
      crumbs.push({ label: `Experiment ${id.slice(0, 8)}`, path: pathname });
    }
  } else if (routeNames[pathname]) {
    crumbs.push({ label: routeNames[pathname], path: pathname });
  }

  return crumbs;
}

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function Header({ onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let mounted = true;

    function verifyApi() {
      checkHealth()
        .then(res => {
          if (mounted && res?.status === 'healthy') {
            setApiStatus('online');
          } else if (mounted) {
            setApiStatus('offline');
          }
        })
        .catch(() => {
          if (mounted) setApiStatus('offline');
        });
    }

    verifyApi();
    const timer = setInterval(verifyApi, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const activeUrl = getApiBaseUrl();

  return (
    <header className="header">
      <div className="header-left">
        {onToggleSidebar && (
          <button
            id="mobile-menu-btn"
            className="header-menu-btn"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            type="button"
          >
            {isSidebarOpen ? (
              <X size={18} weight="bold" aria-hidden="true" />
            ) : (
              <List size={18} weight="bold" aria-hidden="true" />
            )}
          </button>
        )}
        <nav className="header-breadcrumb" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.path}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              {index > 0 && (
                <CaretRight
                  size={12}
                  className="header-breadcrumb-separator"
                  aria-hidden="true"
                />
              )}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? 'header-breadcrumb-current'
                    : ''
                }
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 99,
            fontSize: 12,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
          title={
            apiStatus === 'online'
              ? `Backend Connected: ${activeUrl || 'http://localhost:8000'}`
              : apiStatus === 'checking'
              ? 'Connecting to backend (server may be waking up from sleep)…'
              : 'Backend unreachable. Check server status or run uvicorn locally.'
          }
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor:
                apiStatus === 'online'
                  ? 'var(--color-success, #10b981)'
                  : apiStatus === 'checking'
                  ? 'var(--color-warning, #f59e0b)'
                  : 'var(--color-destructive, #ef4444)',
              boxShadow:
                apiStatus === 'online'
                  ? '0 0 6px rgba(16, 185, 129, 0.5)'
                  : apiStatus === 'checking'
                  ? '0 0 6px rgba(245, 158, 11, 0.5)'
                  : 'none',
            }}
          />
          <span style={{ color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 500 }}>
            {apiStatus === 'online'
              ? 'API Online'
              : apiStatus === 'checking'
              ? 'Connecting…'
              : 'API Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}
