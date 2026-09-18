import React from 'react';
import { LifecycleState } from '../types';
import { CheckCircle, Lock, Compass, Users, AlertOctagon, Award } from 'lucide-react';

interface LifecycleRailProps {
  currentState: LifecycleState;
}

interface StageStep {
  state: LifecycleState;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}

const STAGES: StageStep[] = [
  { state: 'ENROLLING', label: '1. Enrollment', sublabel: 'Anti-Censorship Receipts', icon: CheckCircle },
  { state: 'MANIFEST_LOCKED', label: '2. Manifest Seal', sublabel: 'Cryptographic Freeze', icon: Lock },
  { state: 'THEMATIC_CONSENSUS', label: '3. Dragon Clustering', sublabel: 'Equivalence Principle', icon: Compass },
  { state: 'SORTITION_ALLOCATED', label: '4. Sortition', sublabel: 'Coverage-First Sortition', icon: Users },
  { state: 'CONTESTATION_OPEN', label: '5. Arbitration', sublabel: 'Evidence Dispute Window', icon: AlertOctagon },
  { state: 'SOVEREIGN_RATIFIED', label: '6. Sovereign Ratified', sublabel: 'Immutable Mandate', icon: Award },
];

export const LifecycleRail: React.FC<LifecycleRailProps> = ({ currentState }) => {
  const getStageIndex = (s: LifecycleState): number => {
    switch (s) {
      case 'ENROLLING': return 0;
      case 'MANIFEST_LOCKED': return 1;
      case 'THEMATIC_CONSENSUS': return 2;
      case 'SORTITION_ALLOCATED': return 3;
      case 'CONTESTATION_OPEN': return 4;
      case 'SOVEREIGN_RATIFIED': return 5;
      case 'ANNULLED_PRELOCK': return -1;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(currentState);

  return (
    <div className="civic-card" style={{ padding: '1.25rem 2rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = stage.icon;

          return (
            <div
              key={stage.state}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: isCurrent ? 'var(--color-accent-amber-glow)' : 'transparent',
                border: isCurrent
                  ? '1px solid var(--color-accent-amber)'
                  : isCompleted
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid transparent',
                opacity: idx > currentIndex ? 0.45 : 1,
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isCurrent
                    ? 'var(--color-accent-amber)'
                    : isCompleted
                    ? 'var(--color-accent-emerald)'
                    : 'var(--color-bg-elevated)',
                  color: isCurrent || isCompleted ? '#000' : 'var(--color-text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} strokeWidth={2.5} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: '0.825rem',
                  fontWeight: isCurrent ? 700 : 600,
                  color: isCurrent ? '#fbbf24' : isCompleted ? '#f8fafc' : 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}>
                  {stage.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                  {stage.sublabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
