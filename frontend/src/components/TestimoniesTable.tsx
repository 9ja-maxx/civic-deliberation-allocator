import React from 'react';
import { TestimonyRecord } from '../types';
import { FileText, ExternalLink, ShieldCheck, ShieldAlert, Check } from 'lucide-react';

interface TestimoniesTableProps {
  testimonies: TestimonyRecord[];
  onEnrollSample?: () => void;
  isEnrolling?: boolean;
}

export const TestimoniesTable: React.FC<TestimoniesTableProps> = ({
  testimonies,
  onEnrollSample,
  isEnrolling,
}) => {
  return (
    <div className="civic-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--color-accent-amber)" />
            <span>Enrolled Public Testimonies & Cryptographic Receipts</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Immutable citizen submissions sealed with anti-censorship receipts
          </p>
        </div>
        
        {onEnrollSample && (
          <button
            className="btn-secondary"
            disabled={isEnrolling}
            onClick={onEnrollSample}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            <span>+ Load Civic Testimonies</span>
          </button>
        )}
      </div>

      {testimonies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>
          No citizen testimonies enrolled in this docket yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>#</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Testimony ID</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Public URL</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>SHA-256 Digest</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Anti-Censorship Receipt</th>
              </tr>
            </thead>
            <tbody>
              {testimonies.map((t) => {
                const isDisqualified = !t.eligible;

                return (
                  <tr
                    key={t.testimony_id}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      background: 'var(--color-bg-base)',
                      opacity: isDisqualified ? 0.6 : 1,
                    }}
                  >
                    <td style={{ padding: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      {t.index + 1}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>
                      <span style={{ textDecoration: isDisqualified ? 'line-through' : 'none' }}>
                        {t.testimony_id}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#fbbf24', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.url}
                        </span>
                        <ExternalLink size={11} />
                      </a>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="mono-hash" style={{ color: 'var(--color-text-secondary)' }}>
                        {t.digest.slice(0, 10)}...{t.digest.slice(-8)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {t.selected ? (
                        <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                          Selected Delegate
                        </span>
                      ) : isDisqualified ? (
                        <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>
                          {t.exclusion_reason || 'Disqualified'}
                        </span>
                      ) : (
                        <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                          Eligible
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="mono-hash" style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
                        {t.enrollment_receipt.slice(0, 14)}...
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
