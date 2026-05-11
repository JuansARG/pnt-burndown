import { Link, useSearch } from '@tanstack/react-router';
import { shareUrlAdapter } from '../../infrastructure/sharing/shareUrlAdapter';
import { BurndownChart } from '../components/Chart/BurndownChart';
import { calculateIdealLine } from '../../domain/usecases/calculateIdealLine';

export function SharePage() {
  const search = useSearch({ from: '/share' });
  const data = (search as Record<string, string>)['data'];

  if (!data) {
    return (
      <div className="page">
        <header className="page-header">
          <div className="page-header__left">
            <span className="page-header__tag">BURNUP</span>
            <h1 className="page-header__title">Shared Burndown</h1>
          </div>
        </header>
        <p style={{ color: 'var(--color-muted)' }}>No data provided in URL.</p>
        <Link to="/" className="btn btn--ghost">← Go home</Link>
      </div>
    );
  }

  const sprint = shareUrlAdapter.decode(data);

  if (!sprint) {
    return (
      <div className="page">
        <header className="page-header">
          <div className="page-header__left">
            <span className="page-header__tag">BURNUP</span>
            <h1 className="page-header__title">Shared Burndown</h1>
          </div>
        </header>
        <p style={{ color: 'var(--color-error, red)' }}>
          Could not decode share data. The link may be invalid or corrupt.
        </p>
        <Link to="/" className="btn btn--ghost">← Go home</Link>
      </div>
    );
  }

  const idealLine = calculateIdealLine(sprint);

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__left">
          <span className="page-header__tag">SPRINT — READ ONLY</span>
          <h1 className="page-header__title">{sprint.name}</h1>
          <span className="page-header__dates">
            {sprint.startDate} → {sprint.endDate}
          </span>
        </div>
        <div className="page-header__right">
          <Link to="/" className="btn btn--ghost">← Go home</Link>
        </div>
      </header>

      <div className="stats-row">
        <div className="stats-card stats-card--total">
          <span className="stats-card__label">Total</span>
          <span className="stats-card__value">{sprint.totalPoints} pts</span>
        </div>
        <div className="stats-card stats-card--remaining">
          <span className="stats-card__label">Entries</span>
          <span className="stats-card__value">{sprint.entries.length} days</span>
        </div>
      </div>

      <section className="section">
        <BurndownChart sprint={sprint} idealLine={idealLine} axisMode="date" />
      </section>
    </div>
  );
}
