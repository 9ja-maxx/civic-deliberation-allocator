import React from 'react';
import { ThematicCluster, TestimonyRecord } from '../types';
import { Layers, UserCheck, ShieldAlert, Award, Hash, Check } from 'lucide-react';

interface SortitionTopologyMapProps {
  clusters: ThematicCluster[];
  testimonies: TestimonyRecord[];
}

export const SortitionTopologyMap: React.FC<SortitionTopologyMapProps> = ({
  clusters,
  testimonies,
}) => {
  if (!clusters || clusters.length === 0) {
    return (
      <div className="civic-card" style={{ padding: '3rem 2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        <Layers size={32} color="var(--color-text-tertiary)" style={{ margin: '0 auto 0.75rem' }} />
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
          Thematic Topology Uninitialized
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--color-text-tertiary)', maxWidth: '480px', margin: '0 auto' }}>
          Once the docket manifest is cryptographically sealed, GenVM Dragon consensus partitions untrusted citizen testimonies into substantive policy clusters.
        </p>
      </div>
    );
  }

  // Group testimonies by cluster
  const testimoniesByCluster: Record<number, TestimonyRecord[]> = {};
  testimonies.forEach((t) => {
    const cid = t.cluster_id;
    if (!testimoniesByCluster[cid]) testimoniesByCluster[cid] = [];
    testimoniesByCluster[cid].push(t);
  });

  return (
    <div className="civic-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} color="var(--color-accent-amber)" />
            <span>Deliberative Sortition Topology Map</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Partitions derived via non-deterministic LLM consensus and validated by strict Equivalence Principle
          </p>
        </div>
        <span className="badge badge-amber">{clusters.length} Policy Perspectives</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {clusters.map((cluster) => {
          const members = testimoniesByCluster[cluster.cluster_id] || [];
          const selectedMembers = members.filter((m) => m.selected);

          return (
            <div
              key={cluster.cluster_id}
              style={{
                background: 'var(--color-bg-base)',
                border: '1px solid var(--color-border-prominent)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Cluster Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span className="badge badge-slate" style={{ background: 'var(--color-bg-elevated)', color: '#fff', fontSize: '0.7rem' }}>
                    Perspective #{cluster.cluster_id}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    {members.length} submissions
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.5rem' }}>
                  {cluster.label}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, marginBottom: '1.25rem' }}>
                  {cluster.summary}
                </p>

                {/* Submissions in this cluster */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {members.map((t) => {
                    const isSelected = t.selected;
                    const isDisqualified = !t.eligible;

                    return (
                      <div
                        key={t.testimony_id}
                        style={{
                          background: isSelected ? 'rgba(245, 158, 11, 0.08)' : 'var(--color-bg-surface)',
                          border: isSelected
                            ? '1px solid var(--color-accent-amber)'
                            : isDisqualified
                            ? '1px solid rgba(244, 63, 94, 0.4)'
                            : '1px solid var(--color-border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.75rem 0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              fontWeight: 600,
                              fontSize: '0.825rem',
                              color: isDisqualified ? '#fb7185' : isSelected ? '#fbbf24' : '#f8fafc',
                              textDecoration: isDisqualified ? 'line-through' : 'none',
                            }}>
                              {t.testimony_id}
                            </span>
                            {isSelected && (
                              <span className="badge badge-amber" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                Delegate #{t.selection_rank}
                              </span>
                            )}
                            {isDisqualified && (
                              <span className="badge badge-rose" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                Disqualified
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                            {t.rationale || `Relevance Score: ${t.relevance_score}/100`}
                          </div>
                        </div>

                        {/* Relevance Bar */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? '#fbbf24' : '#cbd5e1' }}>
                            {t.relevance_score}
                          </div>
                          <div style={{
                            width: '44px',
                            height: '4px',
                            background: 'var(--color-bg-elevated)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            marginTop: '2px',
                          }}>
                            <div style={{
                              width: `${t.relevance_score}%`,
                              height: '100%',
                              background: isSelected ? 'var(--color-accent-amber)' : 'var(--color-accent-emerald)',
                            }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cluster Delegate Summary Footer */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--color-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--color-text-tertiary)',
              }}>
                <span>Allocated Delegates:</span>
                <span style={{ fontWeight: 600, color: selectedMembers.length > 0 ? '#34d399' : 'inherit' }}>
                  {selectedMembers.length} Seat{selectedMembers.length === 1 ? '' : 's'} Covered
                </span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
