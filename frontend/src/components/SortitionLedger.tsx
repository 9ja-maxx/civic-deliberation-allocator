import React from 'react';
import { TestimonyRecord } from '../types';
import { Award, UserCheck, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface SortitionLedgerProps {
  delegates: TestimonyRecord[];
}

export const SortitionLedger: React.FC<SortitionLedgerProps> = ({ delegates }) => {
  return (
    <div className="civic-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} color="var(--color-accent-amber)" />
            <span>Official Sortition Ledger & Citizen Assembly Roll</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Empanelled representatives selected through deterministic coverage-first sortition
          </p>
        </div>
        <span className="badge badge-emerald">
          <CheckCircle2 size={12} />
          <span>{delegates.length} Seats Filled</span>
        </span>
      </div>

      {delegates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>
          Sortition has not yet been executed. Once clustering completes, empanelled citizen delegates will appear here.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Rank</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Testimony ID</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Perspectives Covered</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Score</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Sortition Rationale</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Anti-Censorship Receipt</th>
              </tr>
            </thead>
            <tbody>
              {delegates.map((d) => (
                <tr
                  key={d.testimony_id}
                  style={{
                    borderBottom: '1px solid var(--color-border-subtle)',
                    background: 'var(--color-bg-base)',
                  }}
                >
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--color-accent-amber-glow)',
                      color: '#fbbf24',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      border: '1px solid var(--color-accent-amber)',
                    }}>
                      #{d.selection_rank}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <UserCheck size={16} color="var(--color-accent-amber)" />
                      <span>{d.testimony_id}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                    <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                      Cluster #{d.cluster_id}: {d.cluster_label}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ fontWeight: 700, color: '#fbbf24' }}>{d.relevance_score}</span>
                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>/100</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                    {d.rationale}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="mono-hash" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>
                      {d.enrollment_receipt.slice(0, 16)}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
