import React from 'react';

export const POLICY_NOTICE_TEXT =
  'Missing, Replacement, or Return Requests are allowed within 7 business days of delivery.';

const GAP = '     •     ';

/**
 * Compact horizontal scrolling policy notice (matches mobile app).
 */
export default function ScrollingNoticeBanner({ text = POLICY_NOTICE_TEXT, style }) {
  const segment = `${text}${GAP}`;

  return (
    <div
      className="scrolling-notice-banner"
      style={style}
      role="status"
      aria-label={text}
    >
      <div className="scrolling-notice-track">
        <span className="scrolling-notice-text">{segment}</span>
        <span className="scrolling-notice-text" aria-hidden="true">
          {segment}
        </span>
      </div>
    </div>
  );
}
