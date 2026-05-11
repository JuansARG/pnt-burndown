import { useState } from 'react';
import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { useBurndownList } from '../../application/useBurndownList';
import { useWorkspaces } from '../../application/useWorkspaces';

export function WorkspacePage() {
  const { wid } = useParams({ from: '/workspace/$wid' });
  const navigate = useNavigate();
  const { workspaces } = useWorkspaces();
  const { burndowns, create, remove } = useBurndownList(wid);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const workspace = workspaces.find(w => w.id === wid);

  function handleCreate() {
    const name = newName.trim();
    if (!name) { setError('Burndown name is required'); return; }
    const bd = create(name);
    setNewName('');
    setError('');
    navigate({ to: '/workspace/$wid/burndown/$bid', params: { wid, bid: bd.id } });
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__left">
          <span className="page-header__tag">WORKSPACE</span>
          <h1 className="page-header__title">{workspace?.name ?? 'Workspace'}</h1>
        </div>
        <div className="page-header__right">
          <Link to="/" className="btn btn--ghost">← Workspaces</Link>
        </div>
      </header>

      <section className="section">
        <div className="entries-panel">
          <div className="entries-panel__header">
            <span className="entries-panel__label-tag">BURNDOWNS</span>
            <span className="entries-count">{burndowns.length} burndown{burndowns.length !== 1 ? 's' : ''}</span>
          </div>

          {burndowns.length === 0 && (
            <p style={{ padding: '1rem', color: 'var(--color-muted)' }}>
              No burndowns yet. Create one below.
            </p>
          )}

          <div className="entries-list">
            {burndowns.map(bd => (
              <div key={bd.id} className="entry-row">
                <Link
                  to="/workspace/$wid/burndown/$bid"
                  params={{ wid, bid: bd.id }}
                  className="entry-row__date entry-row__date--btn"
                  style={{ textDecoration: 'none' }}
                >
                  {bd.name}
                </Link>
                <button
                  className="entry-row__delete-btn"
                  title="Delete burndown"
                  onClick={() => remove(bd.id)}
                  aria-label={`Delete burndown ${bd.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: 1, minWidth: 200 }}>
            <label className="field__label" htmlFor="bd-name">New burndown name</label>
            <input
              id="bd-name"
              className="field__input"
              type="text"
              placeholder="Sprint 42"
              value={newName}
              onChange={e => { setNewName(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            />
          </div>
          <button className="btn btn--primary" onClick={handleCreate}>
            Create
          </button>
        </div>
        {error && <p className="day-form__error">{error}</p>}
      </section>
    </div>
  );
}
