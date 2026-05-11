import { useState } from 'react';
import { useWorkspaces } from '../../application/useWorkspaces';
import { Link } from '@tanstack/react-router';

export function WorkspaceListPage() {
  const { workspaces, create, rename, remove } = useWorkspaces();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  function handleCreate() {
    const name = newName.trim();
    if (!name) { setError('Workspace name is required'); return; }
    if (name.length > 80) { setError('Name must be 80 characters or less'); return; }
    create(name);
    setNewName('');
    setError('');
  }

  function handleRename(id: string) {
    const name = renameValue.trim();
    if (!name) return;
    rename(id, name);
    setRenamingId(null);
    setRenameValue('');
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__left">
          <span className="page-header__tag">BURNUP</span>
          <h1 className="page-header__title">Workspaces</h1>
        </div>
      </header>

      <section className="section">
        <div className="entries-panel">
          <div className="entries-panel__header">
            <span className="entries-panel__label-tag">WORKSPACES</span>
            <span className="entries-count">{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</span>
          </div>

          {workspaces.length === 0 && (
            <p style={{ padding: '1rem', color: 'var(--color-muted)' }}>
              No workspaces yet. Create one below.
            </p>
          )}

          <div className="entries-list">
            {workspaces.map(ws => (
              <div key={ws.id} className="entry-row">
                {renamingId === ws.id ? (
                  <input
                    className="entry-row__points-input"
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => handleRename(ws.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRename(ws.id);
                      if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
                    }}
                  />
                ) : (
                  <Link
                    to="/workspace/$wid"
                    params={{ wid: ws.id }}
                    className="entry-row__date entry-row__date--btn"
                    style={{ textDecoration: 'none' }}
                  >
                    {ws.name}
                  </Link>
                )}

                <button
                  className="btn btn--ghost"
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                  onClick={() => { setRenamingId(ws.id); setRenameValue(ws.name); }}
                  title="Rename workspace"
                >
                  Rename
                </button>

                <button
                  className="entry-row__delete-btn"
                  title="Delete workspace"
                  onClick={() => remove(ws.id)}
                  aria-label={`Delete workspace ${ws.name}`}
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
            <label className="field__label" htmlFor="ws-name">New workspace name</label>
            <input
              id="ws-name"
              className="field__input"
              type="text"
              placeholder="My Project"
              value={newName}
              onChange={e => { setNewName(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              maxLength={80}
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
