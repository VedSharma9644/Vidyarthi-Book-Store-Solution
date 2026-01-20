import React, { useEffect } from 'react';
import { colors, borderRadius } from '../../css/theme';

const Modal = ({ isOpen, onClose, title, message, type = 'info', showCloseButton = true }) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Determine icon and colors based on type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✓',
          iconBg: '#10b981',
          iconColor: colors.white,
          titleColor: '#059669',
        };
      case 'error':
        return {
          icon: '✕',
          iconBg: '#ef4444',
          iconColor: colors.white,
          titleColor: '#dc2626',
        };
      case 'warning':
        return {
          icon: '⚠',
          iconBg: '#f59e0b',
          iconColor: colors.white,
          titleColor: '#d97706',
        };
      case 'info':
      default:
        return {
          icon: 'ℹ',
          iconBg: colors.primary,
          iconColor: colors.white,
          titleColor: colors.primary,
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
        animation: 'fadeIn 0.2s ease-in-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          animation: 'slideUp 0.3s ease-out',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px',
            borderBottom: `1px solid ${colors.borderLight}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            {/* Icon */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: typeStyles.iconBg,
                color: typeStyles.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              {typeStyles.icon}
            </div>

            {/* Title */}
            {title && (
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: typeStyles.titleColor,
                  margin: 0,
                  lineHeight: '1.4',
                }}
              >
                {title}
              </h2>
            )}
          </div>

          {/* Close Button */}
          {showCloseButton && (
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: borderRadius.sm,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.gray500,
                fontSize: '24px',
                lineHeight: 1,
                transition: 'all 0.2s ease',
                marginLeft: '16px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.gray100;
                e.currentTarget.style.color = colors.gray700;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.gray500;
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Message */}
        <div
          style={{
            padding: '24px',
            fontSize: '16px',
            color: colors.textPrimary,
            lineHeight: '1.6',
            whiteSpace: 'pre-line',
          }}
        >
          {message}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${colors.borderLight}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              backgroundColor: colors.primary,
              color: colors.white,
              border: 'none',
              borderRadius: borderRadius.md,
              padding: '10px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#053a7a';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            OK
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Modal;

