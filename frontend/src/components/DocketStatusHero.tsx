import React from 'react';
import { DocketSummary, LifecycleState } from '../types';
import { ShieldCheck, FileText, Hash, CheckCircle, ArrowRight, Play, Lock, AlertTriangle, ExternalLink } from 'lucide-react';

interface DocketStatusHeroProps {
  docket: DocketSummary | null;
  onAdvanceStage: (action: string) => void;
  isActionLoading: boolean;
  onOpenContestationModal: () => void;
}

export const DocketStatusHero: React.FC<DocketStatusHeroProps> = ({
  docket,
  onAdvanceStage,
  isActionLoading,
  onOpenContestationModal,
}) => {
  if (!docket) {
    return (
      <div className="civic-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading Civic Docket state...</p>
      </div>
    );
  }

  // Calculate Civic Trust Score
  const computeTrustScore = (): { score: number; tier: string } => {
    let score = 70;
    if (docket.computed_manifest_digest) score += 10;
    if (docket.state === 'THEMATIC_CONSENSUS' || docket.state === 'SORTITION_ALLOCATED' || docket.state === 'SOVEREIGN_RATIFIED') score += 10;
    if (docket.accepted_contestation_count > 0) score += 5; // System caught and purged bad actors!
    if (docket.state === 'SOVEREIGN_RATIFIED') score += 5;
    const tier = score >= 90 ? 'SOVEREIGN INTEGRITY' : score >= 80 ? 'CONSENSUS VERIFIED' : 'ACTIVE DELIBERATION';
    return { score, tier };
  };

  const { score: trustScore, tier: trustTier } = computeTrustScore();

  return (
    <div className="civic-card-elevated" style={{ padding: '2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background ambient gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '320px',
        height: '320px',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        
        {/* Left: Mandate Details */}
        <div style={{ flex: '1 1 500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span className="badge badge-amber animate-pulse-slow">
              Docket #{docket.docket_id} · {docket.state.replace('_', ' ')}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
              Revision #{docket.revision}
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.25, marginBottom: '0.75rem' }}>
            Citizen Deliberation Assembly on Transit Equity & Expansion 2026
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
              <FileText size={15} color="var(--color-accent-amber)" />
              <span style={{ color: 'var(--color-text-secondary)' }}>Charter Mandate URL:</span>
              <a
                href={docket.proposal_url}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#fbbf24', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>{docket.proposal_url}</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
              <Hash size={15} color="var(--color-accent-amber)" />
              <span style={{ color: 'var(--color-text-secondary)' }}>Charter SHA-256:</span>
              <span className="mono-hash" style={{ color: 'var(--color-text-primary)' }}>
                {docket.proposal_digest.slice(0, 20)}...{docket.proposal_digest.slice(-12)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Key Metrics & Trust Score Pill */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '260px' }}>
          <div style={{
            background: 'var(--color-bg-base)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Civic Trust Score
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.03em' }}>
              {trustScore}<span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>/100</span>
            </div>
            <div className="badge badge-emerald" style={{ marginTop: '0.25rem' }}>
              {trustTier}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
            <div style={{ background: 'var(--color-bg-surface)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ color: 'var(--color-text-tertiary)' }}>Delegate Capacity</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{docket.slot_count} Seats</div>
            </div>
            <div style={{ background: 'var(--color-bg-surface)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ color: 'var(--color-text-tertiary)' }}>Testimonies</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{docket.testimony_count} Enrolled</div>
            </div>
          </div>
        </div>

      </div>

      {/* Action Bar */}
      <div style={{
        marginTop: '1.75rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {docket.state === 'ENROLLING' && (
            <button
              className="btn-primary"
              disabled={isActionLoading}
              onClick={() => onAdvanceStage('LOCK_MANIFEST')}
            >
              <Lock size={16} />
              <span>Cryptographically Seal Manifest</span>
            </button>
          )}

          {docket.state === 'MANIFEST_LOCKED' && (
            <button
              className="btn-primary"
              disabled={isActionLoading}
              onClick={() => onAdvanceStage('CLUSTER')}
            >
              <Play size={16} />
              <span>Run Dragon Consensus Clustering</span>
            </button>
          )}

          {docket.state === 'THEMATIC_CONSENSUS' && (
            <button
              className="btn-primary"
              disabled={isActionLoading}
              onClick={() => onAdvanceStage('ALLOCATE')}
            >
              <ArrowRight size={16} />
              <span>Allocate Sortition Delegates</span>
            </button>
          )}

          {(docket.state === 'SORTITION_ALLOCATED' || docket.state === 'CONTESTATION_OPEN') && (
            <>
              <button
                className="btn-secondary"
                onClick={onOpenContestationModal}
                style={{ borderColor: 'var(--color-accent-rose)', color: '#fb7185' }}
              >
                <AlertTriangle size={16} color="#fb7185" />
                <span>Lodge Bonded Evidence Dispute</span>
              </button>

              <button
                className="btn-primary"
                disabled={isActionLoading || docket.pending_contestation_count > 0}
                onClick={() => onAdvanceStage('RATIFY')}
              >
                <CheckCircle size={16} />
                <span>Ratify Sovereign Mandate</span>
              </button>
            </>
          )}

          {docket.state === 'SOVEREIGN_RATIFIED' && (
            <div className="badge badge-emerald" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <CheckCircle size={16} />
              <span>Assembly Mandate Permanently Ratified & Immutable</span>
            </div>
          )}
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
          {docket.pending_contestation_count > 0 ? (
            <span style={{ color: '#fb7185', fontWeight: 600 }}>
              ⚠️ {docket.pending_contestation_count} Dispute Pending Dragon Consensus Arbitration
            </span>
          ) : (
            <span>All evidence validated through cryptographic digest consensus</span>
          )}
        </div>
      </div>

    </div>
  );
};
