import { useState, type FormEvent } from 'react';
import type { DayEntry, Sprint, ScopeChange } from '../../../domain/entities/Sprint';
import './DayForm.css';

interface DayFormProps {
  sprintStartDate: string;
  sprintEndDate: string;
  totalPoints: number;
  entries: Sprint['entries'];
  scopeChanges?: ScopeChange[];
  onSubmit: (entry: DayEntry) => void;
  onScopeChange?: (change: ScopeChange) => void;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function DayForm({ sprintStartDate, sprintEndDate, totalPoints, entries, scopeChanges, onSubmit, onScopeChange }: DayFormProps) {
  const [date, setDate] = useState(todayISO());
  const [remaining, setRemaining] = useState('');
  const [burned, setBurned] = useState('');
  const [delta, setDelta] = useState('');
  const [mode, setMode] = useState<'remaining' | 'burned' | 'scope'>('remaining');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function getPrevRemaining(forDate: string): number {
    const sorted = [...entries]
      .filter(e => e.date < forDate)
      .sort((a, b) => b.date.localeCompare(a.date));
    const lastEntry = sorted[0];
    const baseRemaining = lastEntry ? lastEntry.remaining : totalPoints;
    const lastEntryDate = lastEntry?.date ?? '';
    const extraScope = (scopeChanges ?? [])
      .filter(sc => sc.date <= forDate && sc.date > lastEntryDate)
      .reduce((sum, sc) => sum + sc.delta, 0);
    return baseRemaining + extraScope;
  }

  function validate(): string | null {
    if (!date) return 'Date is required';
    if (date < sprintStartDate) return `Date cannot be before sprint start (${sprintStartDate})`;
    if (date > sprintEndDate) return `Date cannot be after sprint end (${sprintEndDate})`;
    if (mode === 'remaining') {
      const rem = Number(remaining);
      if (remaining === '' || isNaN(rem)) return 'Remaining points is required';
      if (rem < 0) return 'Remaining points cannot be negative';
    } else if (mode === 'burned') {
      const b = Number(burned);
      if (burned === '' || isNaN(b)) return 'Burned points is required';
      if (b < 0) return 'Burned points cannot be negative';
      const rem = getPrevRemaining(date) - b;
      if (rem < 0) return 'Burned points exceed remaining points';
    } else {
      const d = Number(delta);
      if (delta === '' || isNaN(d)) return 'Scope delta is required';
      if (d === 0) return 'Scope delta cannot be zero';
      const existing = (scopeChanges ?? []).some(sc => sc.date === date);
      if (existing) return `A scope change already exists for ${date}`;
    }
    if (note.length > 280) return 'Note exceeds 280 characters';
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');

    if (mode === 'scope') {
      if (!onScopeChange) return;
      const change: ScopeChange = {
        date,
        delta: Number(delta),
        ...(note.trim() ? { note: note.trim() } : {}),
      };
      onScopeChange(change);
      setDelta('');
      setNote('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
      return;
    }

    const computedRemaining = mode === 'remaining'
      ? Number(remaining)
      : getPrevRemaining(date) - Number(burned);
    const entry: DayEntry = {
      date,
      remaining: computedRemaining,
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    onSubmit(entry);
    setRemaining('');
    setBurned('');
    setNote('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  }

  return (
    <form className="day-form" onSubmit={handleSubmit} noValidate>
      <div className="day-form__header">
        <span className="day-form__label-tag">LOG DAY</span>
        <div className="day-form__mode-toggle">
          <button
            type="button"
            className={`day-form__mode-btn${mode === 'remaining' ? ' day-form__mode-btn--active' : ''}`}
            onClick={() => { setMode('remaining'); setError(''); }}
          >Remaining</button>
          <button
            type="button"
            className={`day-form__mode-btn${mode === 'burned' ? ' day-form__mode-btn--active' : ''}`}
            onClick={() => { setMode('burned'); setError(''); }}
          >Burned</button>
          <button
            type="button"
            className={`day-form__mode-btn${mode === 'scope' ? ' day-form__mode-btn--active' : ''}`}
            onClick={() => { setMode('scope'); setError(''); }}
          >Scope</button>
        </div>
      </div>

      <div className="day-form__row">
        <div className="field">
          <label className="field__label" htmlFor="df-date">Date</label>
          <input
            id="df-date"
            className="field__input"
            type="date"
            value={date}
            min={sprintStartDate}
            max={sprintEndDate}
            onChange={e => { setDate(e.target.value); setError(''); }}
          />
        </div>

        {mode === 'remaining' ? (
          <div className="field">
            <label className="field__label" htmlFor="df-remaining">Remaining pts</label>
            <input
              id="df-remaining"
              className="field__input field__input--number"
              type="number"
              min={0}
              placeholder="0"
              value={remaining}
              onChange={e => { setRemaining(e.target.value); setError(''); }}
            />
          </div>
        ) : mode === 'burned' ? (
          <div className="field">
            <label className="field__label" htmlFor="df-burned">Burned pts</label>
            <input
              id="df-burned"
              className="field__input field__input--number"
              type="number"
              min={0}
              placeholder="0"
              value={burned}
              onChange={e => { setBurned(e.target.value); setError(''); }}
            />
          </div>
        ) : (
          <div className="field">
            <label className="field__label" htmlFor="df-delta">Scope delta</label>
            <input
              id="df-delta"
              className="field__input field__input--number"
              type="number"
              placeholder="+10 or -5"
              value={delta}
              onChange={e => { setDelta(e.target.value); setError(''); }}
            />
          </div>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="df-note">
          Note <span className="field__optional">(optional · {note.length}/280)</span>
        </label>
        <textarea
          id="df-note"
          className="field__input field__textarea"
          rows={3}
          maxLength={280}
          placeholder="Blocker, context, team note…"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      {error && <p className="day-form__error">{error}</p>}

      <button
        type="submit"
        className={`btn btn--primary ${submitted ? 'btn--success' : ''}`}
      >
        {submitted ? '✓ Logged' : mode === 'scope' ? 'Log scope change' : 'Log entry'}
      </button>
    </form>
  );
}

