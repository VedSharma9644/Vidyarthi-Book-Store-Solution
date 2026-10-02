import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SUPPORT_PHONE_E164 = '+919848113298';
const SUPPORT_PHONE_DIGITS = '919848113298';
const SUPPORT_DISPLAY = '+91 98481 13298';

const ICON_BLUE = '#2563EB';
const ICON_FACE = '#93C5FD';
const ICON_MIC = '#1D4ED8';

/** Customer-support style: person + headset + mic (matches mobile app). */
function SupportHeadsetIcon() {
  return (
    <div style={icon.root} aria-hidden="true">
      <div style={icon.band} />
      <div style={{ ...icon.ear, ...icon.earLeft }} />
      <div style={{ ...icon.ear, ...icon.earRight }} />
      <div style={icon.head} />
      <div style={icon.shoulders} />
      <div style={icon.micArm} />
      <div style={icon.micTip} />
    </div>
  );
}

/**
 * Floating contact button (bottom-left). Offers Call or WhatsApp.
 * Same support number and behavior as the mobile app.
 */
export default function ContactSupportFab({ visible = true }) {
  const { isLoggedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  if (!visible || !isLoggedIn) {
    return null;
  }

  return (
    <div ref={wrapRef} style={styles.wrap}>
      {menuOpen && (
        <div style={styles.menu} role="dialog" aria-label="Contact us">
          <div style={styles.menuTitle}>Contact us</div>
          <div style={styles.menuHint}>
            In case of queries, please contact or WhatsApp:
          </div>
          <div style={styles.menuPhone}>{SUPPORT_DISPLAY}</div>
          <a
            href={`tel:${SUPPORT_PHONE_E164}`}
            style={styles.menuAction}
            onClick={() => setMenuOpen(false)}
          >
            Call
          </a>
          <a
            href={`https://wa.me/${SUPPORT_PHONE_DIGITS}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...styles.menuAction, ...styles.menuActionPrimary }}
            onClick={() => setMenuOpen(false)}
          >
            WhatsApp
          </a>
          <button
            type="button"
            style={styles.menuCancel}
            onClick={() => setMenuOpen(false)}
          >
            Cancel
          </button>
        </div>
      )}

      <button
        type="button"
        style={styles.fab}
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Contact support by phone or WhatsApp"
        aria-expanded={menuOpen}
      >
        <SupportHeadsetIcon />
      </button>
    </div>
  );
}

const icon = {
  root: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  band: {
    position: 'absolute',
    top: 2,
    left: '50%',
    marginLeft: -13,
    width: 26,
    height: 14,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    border: `3.5px solid ${ICON_BLUE}`,
    borderBottom: 'none',
    boxSizing: 'border-box',
  },
  ear: {
    position: 'absolute',
    top: 12,
    width: 9,
    height: 12,
    borderRadius: 4,
    backgroundColor: ICON_BLUE,
  },
  earLeft: {
    left: 4,
  },
  earRight: {
    right: 4,
  },
  head: {
    position: 'absolute',
    top: 10,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ICON_FACE,
    border: `1.5px solid ${ICON_BLUE}`,
    boxSizing: 'border-box',
  },
  shoulders: {
    position: 'absolute',
    bottom: 2,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: ICON_BLUE,
  },
  micArm: {
    position: 'absolute',
    right: 5,
    top: 20,
    width: 11,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: ICON_MIC,
    transform: 'rotate(28deg)',
  },
  micTip: {
    position: 'absolute',
    right: 2,
    top: 24,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ICON_MIC,
  },
};

const styles = {
  wrap: {
    position: 'fixed',
    zIndex: 1100,
    bottom: 24,
    left: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DBEAFE',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
    padding: 0,
  },
  menu: {
    width: 260,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    border: '1px solid #E5E7EB',
    padding: '14px 14px 10px',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 6,
  },
  menuHint: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  menuPhone: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1D4ED8',
    marginBottom: 12,
  },
  menuAction: {
    display: 'block',
    width: '100%',
    textAlign: 'center',
    textDecoration: 'none',
    boxSizing: 'border-box',
    padding: '10px 12px',
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    color: '#111827',
    fontSize: 14,
    fontWeight: 600,
  },
  menuActionPrimary: {
    backgroundColor: '#25D366',
    color: '#ffffff',
  },
  menuCancel: {
    display: 'block',
    width: '100%',
    border: 'none',
    background: 'transparent',
    color: '#6B7280',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '8px 0 4px',
  },
};
