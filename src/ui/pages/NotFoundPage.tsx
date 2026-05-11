import { Link } from '@tanstack/react-router';

export function NotFoundPage() {
  return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div className="setup-card">
        <div className="setup-card__header">
          <span className="setup-card__tag">404</span>
          <h1 className="setup-card__title">Page Not Found</h1>
          <p className="setup-card__subtitle">
            The page you are looking for does not exist.
          </p>
        </div>
        <Link to="/" className="btn btn--primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
          ← Go home
        </Link>
      </div>
    </div>
  );
}
