import { useState } from 'react';
import './ShareButton.css';

interface ShareButtonProps {
  isSharing: boolean;
  shareUrl: string;
  onShare: () => void;
}

export function ShareButton({ isSharing, shareUrl, onShare }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select the input
      const input = document.getElementById('share-url-input') as HTMLInputElement;
      input?.select();
    }
  }

  return (
    <div className="share-button-wrap">
      <button
        className={`btn share-btn ${isSharing ? 'share-btn--active' : ''}`}
        onClick={onShare}
        title="Generate shareable snapshot link"
      >
        <svg className="share-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="13" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="13" cy="13.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="3"  cy="8"   r="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="4.3" y1="7.1" x2="11.7" y2="3.4" stroke="currentColor" strokeWidth="1.2"/>
          <line x1="4.3" y1="8.9" x2="11.7" y2="12.6" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
        {isSharing ? 'Update link' : 'Share snapshot'}
      </button>

      {isSharing && shareUrl && (
        <div className="share-panel">
          <span className="share-panel__label">SNAPSHOT URL</span>
          <div className="share-panel__row">
            <input
              id="share-url-input"
              className="share-panel__input"
              type="text"
              readOnly
              value={shareUrl}
              onFocus={e => e.target.select()}
            />
            <button
              className={`btn copy-btn ${copied ? 'copy-btn--copied' : ''}`}
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <p className="share-panel__hint">
            This is a snapshot — the link captures the current state, not live updates.
          </p>
        </div>
      )}
    </div>
  );
}
