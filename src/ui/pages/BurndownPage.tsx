import { useState, type FormEvent } from 'react';
import { useBurndown } from '../../application/useBurndown';
import type { Sprint } from '../../domain/entities/Sprint';
import { getWorkingDayEndDate, getWorkingDays } from '../../domain/usecases/workingDays';
import { BurndownChart } from '../components/Chart/BurndownChart';
import { DayForm } from '../components/DayForm/DayForm';
import { NoteModal } from '../components/NoteModal/NoteModal';
import { ShareButton } from '../components/ShareButton/ShareButton';
import './BurndownPage.css';

interface NoteTarget {
  date: string;
  note?: string;
}

interface EditingEntry {
  date: string;
  value: string;
}

export function BurndownPage() {
  const { sprint, idealLine, isSharing, shareUrl, setupSprint, logDay, deleteEntry, updateEntryDate, updateNote, share, reset } =
    useBurndown();

  const [noteTarget, setNoteTarget] = useState<NoteTarget | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);
  const [editingDateFor, setEditingDateFor] = useState<string | null>(null); // date key of the entry being date-edited
  const [dateError, setDateError] = useState<string | null>(null);
  const [axisMode, setAxisMode] = useState<'date' | 'day'>('date');

  if (!sprint || showEdit) {
    return (
      <SprintSetupForm
        onSetup={(updated) => { setupSprint({ ...updated, entries: sprint?.entries ?? [] }); setShowEdit(false); }}
        initial={sprint ?? undefined}
      />
    );
  }

  // Stats
  const lastEntry = sprint.entries.length
    ? [...sprint.entries].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;
  const progress = lastEntry
    ? Math.round(((sprint.totalPoints - lastEntry.remaining) / sprint.totalPoints) * 100)
    : 0;

  return (
    <div className="page">
      {/* Header */}
      <header className="page-header">
        <div className="page-header__left">
          <span className="page-header__tag">SPRINT</span>
          <h1 className="page-header__title">{sprint.name}</h1>
          <span className="page-header__dates">
            {sprint.startDate} → {sprint.endDate}
          </span>
        </div>
        <div className="page-header__right">
          <button className="btn btn--ghost" onClick={() => setShowEdit(true)}>Edit</button>
          <button className="btn btn--ghost" onClick={() => setShowReset(true)}>Reset</button>
        </div>
      </header>

      {/* Stats cards */}
      <div className="stats-row">
        <div className="stats-card stats-card--total">
          <span className="stats-card__label">Total</span>
          <span className="stats-card__value">{sprint.totalPoints} pts</span>
        </div>
        <div className="stats-card stats-card--remaining">
          <span className="stats-card__label">Remaining</span>
          <span className="stats-card__value">{lastEntry ? lastEntry.remaining : sprint.totalPoints} pts</span>
        </div>
        <div className="stats-card stats-card--done">
          <span className="stats-card__label">Done</span>
          <span className="stats-card__value">{progress}%</span>
        </div>
      </div>

      {/* Chart */}
      <section className="section">
        <div className="mode-toggle" style={{ marginBottom: 8 }}>
          <button
            type="button"
            className={`mode-toggle__btn${axisMode === 'date' ? ' mode-toggle__btn--active' : ''}`}
            onClick={() => setAxisMode('date')}
          >
            Date
          </button>
          <button
            type="button"
            className={`mode-toggle__btn${axisMode === 'day' ? ' mode-toggle__btn--active' : ''}`}
            onClick={() => setAxisMode('day')}
          >
            Day
          </button>
        </div>
        <BurndownChart sprint={sprint} idealLine={idealLine} axisMode={axisMode} />
      </section>

      {/* Bottom grid */}
      <div className="bottom-grid">
        {/* Log form */}
        <DayForm
          sprintStartDate={sprint.startDate}
          sprintEndDate={sprint.endDate}
          totalPoints={sprint.totalPoints}
          entries={sprint.entries}
          onSubmit={logDay}
        />

        {/* Entries table */}
        {sprint.entries.length > 0 && (
          <div className="entries-panel">
            <div className="entries-panel__header">
              <span className="entries-panel__label-tag">ENTRIES</span>
              <span className="entries-count">{sprint.entries.length} days logged</span>
            </div>
            <div className="entries-list">
              {[...sprint.entries]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(entry => (
                  <div key={entry.date} className="entry-row">
                    {/* DATE — editable */}
                    {editingDateFor === entry.date ? (
                      <input
                        className="entry-row__date-input"
                        type="date"
                        defaultValue={entry.date}
                        min={sprint.startDate}
                        max={sprint.endDate}
                        autoFocus
                        onChange={e => {
                          const newDate = e.target.value;
                          if (!newDate) return;
                          const ok = updateEntryDate(entry.date, newDate);
                          if (!ok) {
                            setDateError(`Ya existe una entry para ${newDate}`);
                            return;
                          }
                          setDateError(null);
                          setEditingDateFor(null);
                          if (editingEntry?.date === entry.date) {
                            setEditingEntry({ date: newDate, value: String(entry.remaining) });
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Escape') setEditingDateFor(null);
                        }}
                        onBlur={() => { setEditingDateFor(null); setDateError(null); }}
                      />
                    ) : (
                      <button
                        className="entry-row__date entry-row__date--btn"
                        title="Click to edit date"
                        onClick={() => setEditingDateFor(entry.date)}
                      >
                        {entry.date}
                        <span className="entry-row__edit-icon" aria-hidden="true">✎</span>
                      </button>
                    )}

                    {editingEntry?.date === entry.date ? (
                      <input
                        className="entry-row__points-input"
                        type="number"
                        min={0}
                        autoFocus
                        value={editingEntry.value}
                        onChange={e => setEditingEntry({ date: entry.date, value: e.target.value })}
                        onBlur={() => {
                          const parsed = Number(editingEntry.value);
                          if (editingEntry.value !== '' && !isNaN(parsed) && parsed >= 0) {
                            logDay({ ...entry, remaining: parsed });
                          }
                          setEditingEntry(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          if (e.key === 'Escape') setEditingEntry(null);
                        }}
                      />
                    ) : (
                      <button
                        className="entry-row__points"
                        title="Click to edit"
                        onClick={() => setEditingEntry({ date: entry.date, value: String(entry.remaining) })}
                      >
                        {entry.remaining} pts
                        <span className="entry-row__edit-icon" aria-hidden="true">✎</span>
                      </button>
                    )}
                    <button
                      className="entry-row__note-btn"
                      onClick={() => setNoteTarget({ date: entry.date, note: entry.note })}
                      title={entry.note ? 'Edit note' : 'Add note'}
                    >
                      {entry.note ? (
                        <span className="entry-row__note-preview" title={entry.note}>
                          📝 {entry.note.slice(0, 40)}{entry.note.length > 40 ? '…' : ''}
                        </span>
                      ) : (
                        <span className="entry-row__add-note">+ note</span>
                      )}
                    </button>
                    {/* DELETE */}
                    <button
                      className="entry-row__delete-btn"
                      title="Delete entry"
                      onClick={() => deleteEntry(entry.date)}
                      aria-label={`Delete entry ${entry.date}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>
            {dateError && (
              <p className="entries-panel__error">{dateError}</p>
            )}
          </div>
        )}
      </div>

      {/* Share */}
      <div className="share-row">
        <ShareButton isSharing={isSharing} shareUrl={shareUrl} onShare={share} />
      </div>

      {/* Note modal */}
      {noteTarget && (
        <NoteModal
          date={noteTarget.date}
          initialNote={noteTarget.note}
          onSave={updateNote}
          onClose={() => setNoteTarget(null)}
        />
      )}

      {/* Reset confirm */}
      {showReset && (
        <div className="modal-backdrop" onClick={() => setShowReset(false)} role="dialog" aria-modal="true">
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="reset-confirm__text">
              Reset will delete this sprint and all logged data. This cannot be undone.
            </p>
            <div className="modal__actions">
              <button className="btn btn--secondary" onClick={() => setShowReset(false)}>Cancel</button>
              <button className="btn btn--danger" onClick={() => { reset(); setShowReset(false); }}>
                Delete sprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sprint Setup Form ───────────────────────────────────────────────────── */

interface SprintSetupFormProps {
  onSetup: (sprint: Sprint) => void;
  initial?: Sprint;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function offsetDate(days: number): string {
  const d = new Date(Date.now() + days * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function SprintSetupForm({ onSetup, initial }: SprintSetupFormProps) {
  // Determine initial mode and working days count from existing sprint
  const initialMode = initial?.useWorkingDays === true ? 'duration' : 'dates';
  const initialHolidays = initial?.holidays ?? [];
  const initialWorkingDays = initial?.useWorkingDays === true
    ? String(getWorkingDays(initial.startDate, initial.endDate, initialHolidays).length || 10)
    : '10';

  const [name, setName] = useState(initial?.name ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayISO());
  const [endDate, setEndDate] = useState(initial?.endDate ?? offsetDate(13));
  const [totalPoints, setTotalPoints] = useState(initial ? String(initial.totalPoints) : '');
  const [error, setError] = useState('');

  // New state for working-days mode
  const [mode, setMode] = useState<'dates' | 'duration'>(initialMode);
  const [workingDays, setWorkingDays] = useState(initialWorkingDays);
  const [holidays, setHolidays] = useState<string[]>(initialHolidays);
  const [holidayInput, setHolidayInput] = useState('');

  // Computed end date for duration mode
  const computedEndDate = (() => {
    const count = Number(workingDays);
    if (!startDate || isNaN(count) || count < 1) return '';
    try { return getWorkingDayEndDate(startDate, count, holidays); }
    catch { return ''; }
  })();

  function addHoliday() {
    const val = holidayInput.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      setError('Holiday must be a valid date: YYYY-MM-DD');
      return;
    }
    if (holidays.includes(val)) {
      setError('Holiday already added');
      return;
    }
    setHolidays(prev => [...prev, val].sort());
    setHolidayInput('');
    setError('');
  }

  function removeHoliday(date: string) {
    setHolidays(prev => prev.filter(h => h !== date));
  }

  function validate(): string | null {
    if (!name.trim()) return 'Sprint name is required';
    const pts = Number(totalPoints);
    if (!totalPoints || isNaN(pts) || pts <= 0) return 'Total points must be a positive number';

    if (mode === 'duration') {
      if (!startDate) return 'Start date is required';
      const count = Number(workingDays);
      if (!workingDays || isNaN(count) || count < 1) return 'Working days must be at least 1';
      if (!computedEndDate) return 'Could not compute end date';
    } else {
      if (!startDate || !endDate) return 'Start and end dates are required';
      if (startDate >= endDate) return 'End date must be after start date';
    }
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    if (mode === 'duration') {
      onSetup({
        name: name.trim(),
        startDate,
        endDate: computedEndDate,
        totalPoints: Number(totalPoints),
        entries: [],
        useWorkingDays: true,
        holidays,
      });
    } else {
      onSetup({
        name: name.trim(),
        startDate,
        endDate,
        totalPoints: Number(totalPoints),
        entries: [],
        useWorkingDays: false,
        holidays: [],
      });
    }
  }

  return (
    <div className="setup-page">
      <div className="setup-card">
        <div className="setup-card__header">
          <span className="setup-card__tag">BURNUP</span>
          <h1 className="setup-card__title">{initial ? 'Edit Sprint' : 'New Sprint'}</h1>
          <p className="setup-card__subtitle">{initial ? 'Update sprint settings. Logged entries are preserved.' : 'Configure your sprint to start tracking burndown.'}</p>
        </div>

        <form className="setup-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="sf-name">Sprint name</label>
            <input
              id="sf-name"
              className="field__input"
              type="text"
              placeholder="Sprint 42 — Auth & Payments"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
            />
          </div>

          {/* Mode toggle */}
          <div className="field">
            <label className="field__label">Duration mode</label>
            <div className="mode-toggle">
              <button
                type="button"
                className={`mode-toggle__btn${mode === 'dates' ? ' mode-toggle__btn--active' : ''}`}
                onClick={() => { setMode('dates'); setHolidays([]); setHolidayInput(''); setError(''); }}
              >
                Dates
              </button>
              <button
                type="button"
                className={`mode-toggle__btn${mode === 'duration' ? ' mode-toggle__btn--active' : ''}`}
                onClick={() => { setMode('duration'); setError(''); }}
              >
                Duration
              </button>
            </div>
          </div>

          {mode === 'dates' && (
            <div className="setup-form__row">
              <div className="field">
                <label className="field__label" htmlFor="sf-start">Start date</label>
                <input
                  id="sf-start"
                  className="field__input"
                  type="date"
                  value={startDate}
                  onChange={e => { setStartDate(e.target.value); setError(''); }}
                  color-scheme="dark"
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="sf-end">End date</label>
                <input
                  id="sf-end"
                  className="field__input"
                  type="date"
                  value={endDate}
                  onChange={e => { setEndDate(e.target.value); setError(''); }}
                />
              </div>
            </div>
          )}

          {mode === 'duration' && (
            <>
              <div className="setup-form__row">
                <div className="field">
                  <label className="field__label" htmlFor="sf-start-dur">Start date</label>
                  <input
                    id="sf-start-dur"
                    className="field__input"
                    type="date"
                    value={startDate}
                    onChange={e => { setStartDate(e.target.value); setError(''); }}
                    color-scheme="dark"
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="sf-wdays">Working days</label>
                  <input
                    id="sf-wdays"
                    className="field__input"
                    type="number"
                    min={1}
                    placeholder="10"
                    value={workingDays}
                    onChange={e => { setWorkingDays(e.target.value); setError(''); }}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field__label">Ends on (calculated)</label>
                <div className="field__preview" tabIndex={-1}>{computedEndDate || '—'}</div>
              </div>

              {/* Holidays */}
              <div className="field">
                <label className="field__label">Holidays</label>
                <div className="setup-form__row">
                  <input
                    className="field__input"
                    type="text"
                    placeholder="YYYY-MM-DD"
                    value={holidayInput}
                    onChange={e => { setHolidayInput(e.target.value); setError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHoliday(); } }}
                  />
                  <button type="button" className="btn btn--secondary" onClick={addHoliday}>
                    Add
                  </button>
                </div>
                {holidays.length > 0 && (
                  <div className="holidays-list">
                    {holidays.map(h => (
                      <div key={h} className="holiday-chip">
                        <span>{h}</span>
                        <button
                          type="button"
                          className="holiday-chip__remove"
                          onClick={() => removeHoliday(h)}
                          aria-label={`Remove holiday ${h}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="field">
            <label className="field__label" htmlFor="sf-points">Total story points</label>
            <input
              id="sf-points"
              className="field__input"
              type="number"
              min={1}
              placeholder="80"
              value={totalPoints}
              onChange={e => { setTotalPoints(e.target.value); setError(''); }}
            />
          </div>

          {error && <p className="day-form__error">{error}</p>}

          <button type="submit" className="btn btn--primary setup-form__submit">
            Start tracking →
          </button>
        </form>
      </div>
    </div>
  );
}
