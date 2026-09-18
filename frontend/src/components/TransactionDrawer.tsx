import React from 'react';
import { Cpu, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';
import { NETWORK_CONFIG } from '../config';

export interface ActiveTransaction {
  hash: string;
  action: string;
  status: 'PENDING' | 'SUCCESS' | 'REVERTED';
  message: string;
}

interface TransactionDrawerProps {
  tx: ActiveTransaction | null;
  onDismiss: () => void;
}

export const TransactionDrawer: React.FC<TransactionDrawerProps> = ({ tx, onDismiss }) => {
  if (!tx) return null;

  const isPending = tx.status === 'PENDING';
  const isSuccess = tx.status === 'SUCCESS';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        maxWidth: '420px',
        width: 'calc(100% - 3rem)',
        background: 'var(--color-bg-elevated)',
        border: isPending
          ? '1px solid var(--color-accent-amber)'
          : isSuccess
          ? '1px solid var(--color-accent-emerald)'
          : '1px solid var(--color-accent-rose)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        padding: '1rem 1.25rem',
        zIndex: 90,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.85rem',
      }}
    >
      <div style={{ marginTop: '2px' }}>
        {isPending ? (
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '2px solid rgba(245, 158, 11, 0.3)',
            borderTopColor: '#fbbf24',
            animation: 'spin 1s linear infinite',
          }}></div>
        ) : isSuccess ? (
          <CheckCircle2 size={22} color="#34d399" />
        ) : (
          <AlertCircle size={22} color="#fb7185" />
        )}
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
            {tx.action}
          </span>
          <button
            onClick={onDismiss}
            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>

        <p style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.35 }}>
          {tx.message}
        </p>

        {tx.hash && (
          <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="mono-hash" style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
              Tx: {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
            </span>
            <a
              href={`${NETWORK_CONFIG.explorerUrl}/tx/${tx.hash}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#fbbf24', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              <span>View</span>
              <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
