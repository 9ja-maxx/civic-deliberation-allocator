import React, { useState } from 'react';
import { ContestationRecord, TestimonyRecord, ChallengeType } from '../types';
import { AlertOctagon, ShieldAlert, CheckCircle, XCircle, Clock, Gavel, X } from 'lucide-react';

interface ContestationDrawerProps {
  contestations: ContestationRecord[];
  testimonies: TestimonyRecord[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitChallenge: (type: ChallengeType, targetIds: string[]) => Promise<void>;
  onResolveChallenge: (challengeId: number) => Promise<void>;
  isProcessing: boolean;
}

export const ContestationDrawer: React.FC<ContestationDrawerProps> = ({
  contestations,
  testimonies,
  isOpen,
  onClose,
  onSubmitChallenge,
  onResolveChallenge,
  isProcessing,
}) => {
  const [challengeType, setChallengeType] = useState<ChallengeType>('PROVENANCE_MISMATCH');
  const [targetId1, setTargetId1] = useState<string>('');
  const [targetId2, setTargetId2] = useState<string>('');

  const eligibleTestimonies = testimonies.filter((t) => t.eligible);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targets = challengeType === 'PROVENANCE_MISMATCH' ? [targetId1] : [targetId1, targetId2];
    if (targets.some((t) => !t)) {
      alert('Please select all required target testimonies');
      return;
    }
    await onSubmitChallenge(challengeType, targets);
    setTargetId1('');
    setTargetId2('');
  };

  return (
    <div className="civic-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gavel size={20} color="var(--color-accent-amber)" />
            <span>Dragon Consensus Dispute & Evidence Arbitration</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Decentralized arbitration Purging tampered provenance and astroturfed collusion
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={() => {
            if (!isOpen) onClose(); // toggles open state from parent
          }}
          style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185', fontSize: '0.8rem' }}
        >
          <AlertOctagon size={14} />
          <span>+ File Evidence Challenge</span>
        </button>
      </div>

      {/* Active Disputes Feed */}
      {contestations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
          No contestations lodged against this docket. All enrolled testimony digests are uncontradicted.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {contestations.map((c) => {
            const isPending = c.status === 'PENDING';
            const isAccepted = c.status === 'ACCEPTED';

            return (
              <div
                key={c.id}
                style={{
                  background: 'var(--color-bg-base)',
                  border: isPending
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : isAccepted
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f8fafc' }}>
                      Dispute #{c.id}: {c.challenge_type.replace('_', ' ')}
                    </span>
                    {isPending ? (
                      <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                        <Clock size={11} /> Pending Dragon Consensus
                      </span>
                    ) : isAccepted ? (
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                        <CheckCircle size={11} /> Upheld · Target Purged
                      </span>
                    ) : (
                      <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>
                        <XCircle size={11} /> Rejected · Authentic
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    Targets: <span className="mono-hash" style={{ color: '#fbbf24' }}>{c.target_ids.join(', ')}</span>
                  </div>
                  {c.resolution_reason && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.35rem' }}>
                      Arbitration Finding: {c.resolution_reason}
                    </div>
                  )}
                </div>

                {isPending && (
                  <button
                    className="btn-primary"
                    disabled={isProcessing}
                    onClick={() => onResolveChallenge(c.id)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                  >
                    <Gavel size={14} />
                    <span>Trigger Arbitration</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* File Challenge Modal */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 13, 20, 0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="civic-card-elevated" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} color="#fb7185" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Lodge Evidence Contestation</h3>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  CHALLENGE CATEGORY
                </label>
                <select
                  value={challengeType}
                  onChange={(e) => setChallengeType(e.target.value as ChallengeType)}
                  style={{
                    width: '100%',
                    background: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border-prominent)',
                    color: '#fff',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="PROVENANCE_MISMATCH">PROVENANCE_MISMATCH (Altered text, broken hash)</option>
                  <option value="DUPLICATE_COLLUSION">DUPLICATE_COLLUSION (Astroturf copy, bot campaign)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  TARGET TESTIMONY 1
                </label>
                <select
                  value={targetId1}
                  onChange={(e) => setTargetId1(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border-prominent)',
                    color: '#fff',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="">Select Target Testimony...</option>
                  {testimonies.map((t) => (
                    <option key={t.testimony_id} value={t.testimony_id}>
                      {t.testimony_id} ({t.cluster_label || 'Unclustered'})
                    </option>
                  ))}
                </select>
              </div>

              {challengeType === 'DUPLICATE_COLLUSION' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                    TARGET TESTIMONY 2 (Suspected Duplicate)
                  </label>
                  <select
                    value={targetId2}
                    onChange={(e) => setTargetId2(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--color-bg-base)',
                      border: '1px solid var(--color-border-prominent)',
                      color: '#fff',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="">Select Second Testimony...</option>
                    {testimonies
                      .filter((t) => t.testimony_id !== targetId1)
                      .map((t) => (
                        <option key={t.testimony_id} value={t.testimony_id}>
                          {t.testimony_id} ({t.cluster_label || 'Unclustered'})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isProcessing}
                >
                  Submit Challenge to Dragon Consensus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
