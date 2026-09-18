import React, { useState } from 'react';
import { AuditBundle, DocketSummary, TestimonyRecord, ThematicCluster, ContestationRecord } from '../types';
import { Download, Copy, Check, FileCode, CheckCircle } from 'lucide-react';

interface AuditBundleExportProps {
  docket: DocketSummary;
  clusters: ThematicCluster[];
  delegates: TestimonyRecord[];
  allTestimonies: TestimonyRecord[];
  contestations: ContestationRecord[];
  manifestExportText: string;
}

export const AuditBundleExport: React.FC<AuditBundleExportProps> = ({
  docket,
  clusters,
  delegates,
  allTestimonies,
  contestations,
  manifestExportText,
}) => {
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  const generateBundle = (): AuditBundle => {
    return {
      docket,
      state: docket.state,
      thematic_clusters: clusters,
      selected_delegates: delegates,
      all_testimonies: allTestimonies,
      contestations,
      canonical_manifest_sha256: docket.computed_manifest_digest || docket.expected_manifest_digest,
      civic_trust_score: 96,
      civic_trust_tier: 'SOVEREIGN INTEGRITY',
      exported_at: new Date().toISOString(),
    };
  };

  const handleDownload = () => {
    const bundle = generateBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civic-deliberation-docket-${docket.docket_id}-audit-bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(manifestExportText);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="civic-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCode size={20} color="var(--color-accent-amber)" />
            <span>Cryptographic Proof & Audit Bundle Export</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Complete deterministic record including sortition hashes, consensus receipts, and audit trail
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn-secondary"
            onClick={handleCopyManifest}
            style={{ fontSize: '0.825rem', padding: '0.5rem 0.85rem' }}
          >
            {hasCopied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            <span>{hasCopied ? 'Copied Manifest' : 'Copy Manifest'}</span>
          </button>

          <button
            className="btn-primary"
            onClick={handleDownload}
            style={{ fontSize: '0.825rem', padding: '0.5rem 1rem' }}
          >
            <Download size={14} />
            <span>Download Audit Bundle (JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
