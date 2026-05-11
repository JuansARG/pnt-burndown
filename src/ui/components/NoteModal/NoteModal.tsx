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
  const [isEditing, setIsEditing] = useState(!initialNote);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) textareaRef.current?.focus();
  }, [isEditing]);

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

  function handleEdit() {
    setIsEditing(true);
  }

  function handleCancel() {
    if (isEditing && initialNote) {
      setNote(initialNote);
      setIsEditing(false);
    } else {
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Note">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__label-tag">{isEditing ? 'EDIT NOTE' : 'NOTE'}</span>
          <span className="modal__date">{date}</span>
          <button className="modal__close btn btn--ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            {isEditing && (
              <label className="field__label" htmlFor="note-textarea">
                Note <span className="field__optional">({note.length}/280)</span>
              </label>
            )}
            <textarea
              id="note-textarea"
              ref={textareaRef}
              className={isEditing ? 'field__input modal__textarea' : 'modal__textarea modal__textarea--readonly'}
              value={note}
              maxLength={280}
              rows={4}
              placeholder={isEditing ? 'What happened this day?' : ''}
              readOnly={!isEditing}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div className="modal__actions">
            {!isEditing && (
              <button type="button" className="btn btn--secondary modal__edit-btn" onClick={handleEdit}>Edit</button>
            )}
            <div className="modal__actions-right">
              <button type="button" className="btn btn--secondary" onClick={handleCancel}>
                {isEditing && initialNote ? 'Cancel' : 'Close'}
              </button>
              {isEditing && (
                <button type="submit" className="btn btn--primary">Save note</button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
