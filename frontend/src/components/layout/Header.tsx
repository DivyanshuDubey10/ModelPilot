import { useLocation } from 'react-router-dom';
import { CaretRight } from '@phosphor-icons/react';

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

export default function Header() {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <header className="header">
      <div className="header-left">
        <nav className="header-breadcrumb" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
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

      <div className="header-right">
        <div className="header-status">
          <span className="header-status-dot" aria-hidden="true" />
          <span>API connected</span>
        </div>
      </div>
    </header>
  );
}
