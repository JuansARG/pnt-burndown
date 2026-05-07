import { useState, useEffect, useRef, type FormEvent } from 'react';
import './NoteModal.css';

interface NoteModalProps {
  date: string;
  initialNote?: string;
  onSave: (date: string, note: string) => void;
  onClose: () => void;
}

export function NoteModal({ date, initialNote = '', onSave, onClose }: NoteModalProps) {
  const [note, setNote] = useState(initialNote);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave(date, note.trim());
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit note">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__label-tag">EDIT NOTE</span>
          <span className="modal__date">{date}</span>
          <button className="modal__close btn btn--ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label" htmlFor="note-textarea">
              Note <span className="field__optional">({note.length}/280)</span>
            </label>
            <textarea
              id="note-textarea"
              ref={textareaRef}
              className="field__input modal__textarea"
              value={note}
              maxLength={280}
              rows={4}
              placeholder="What happened this day?"
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">Save note</button>
          </div>
        </form>
      </div>
    </div>
  );
}
