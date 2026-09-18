import React, { useState, useEffect, useCallback } from 'react';
import { CivicContractClient } from './client';
import { DEFAULT_CONTRACT_ADDRESS } from './config';
import {
  DocketSummary,
  TestimonyRecord,
  ThematicCluster,
  ContestationRecord,
  ChallengeType,
} from './types';
import { Masthead } from './components/Masthead';
import { LifecycleRail } from './components/LifecycleRail';
import { DocketStatusHero } from './components/DocketStatusHero';
import { SortitionTopologyMap } from './components/SortitionTopologyMap';
import { SortitionLedger } from './components/SortitionLedger';
import { TestimoniesTable } from './components/TestimoniesTable';
import { ContestationDrawer } from './components/ContestationDrawer';
import { AuditBundleExport } from './components/AuditBundleExport';
import { TransactionDrawer, ActiveTransaction } from './components/TransactionDrawer';

export const App: React.FC = () => {
  const [contractAddress, setContractAddress] = useState<string>(DEFAULT_CONTRACT_ADDRESS);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<any | null>(null);

  const [client, setClient] = useState<CivicContractClient>(() => {
    return new CivicContractClient(DEFAULT_CONTRACT_ADDRESS, null);
  });

  const [docket, setDocket] = useState<DocketSummary | null>(null);
  const [testimonies, setTestimonies] = useState<TestimonyRecord[]>([]);
  const [clusters, setClusters] = useState<ThematicCluster[]>([]);
  const [delegates, setDelegates] = useState<TestimonyRecord[]>([]);
  const [contestations, setContestations] = useState<ContestationRecord[]>([]);
  const [manifestExportText, setManifestExportText] = useState<string>('');

  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [isContestationModalOpen, setIsContestationModalOpen] = useState<boolean>(false);
  const [activeTx, setActiveTx] = useState<ActiveTransaction | null>(null);

  // Re-instantiate client whenever address or provider changes
  useEffect(() => {
    const newClient = new CivicContractClient(contractAddress, activeProvider);
    setClient(newClient);
  }, [contractAddress, activeProvider]);

  const refreshState = useCallback(async () => {
    try {
      const count = await client.getDocketCount();
      if (count === 0) {
        setDocket(null);
        setTestimonies([]);
        setClusters([]);
        setDelegates([]);
        setContestations([]);
        setManifestExportText('');
        return;
      }

      const d = await client.getDocket(1);
      setDocket(d);

      const tList = await client.getAllTestimonies(1);
      setTestimonies(tList);

      const cList = await client.getThematicClusters(1);
      setClusters(cList);

      const dList = await client.getSortitionLedger(1);
      setDelegates(dList);

      const chList = await client.getAllContestations(1);
      setContestations(chList);

      const mText = await client.getManifestExport(1);
      setManifestExportText(mText);
    } catch (err: any) {
      console.error('Failed to refresh on-chain state:', err);
    }
  }, [client]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Handle wallet connection
  const handleConnectAccount = (account: string, provider: any) => {
    setConnectedAccount(account);
    setActiveProvider(provider);
  };

  const handleDisconnectAccount = () => {
    setConnectedAccount(null);
    setActiveProvider(null);
  };

  // Initialize Docket Action
  const handleInitializeDocket = async () => {
    if (!client || !connectedAccount) {
      alert('Please connect your Web3 wallet (MetaMask or Studionet) to initialize the docket.');
      return;
    }
    setIsActionLoading(true);
    setActiveTx({
      hash: '',
      action: 'Initializing Civic Docket #1',
      status: 'PENDING',
      message: 'Submitting initialize_docket transaction to GenLayer Studionet...',
    });

    try {
      const now = Math.floor(Date.now() / 1000);
      const txHash = await client.initializeDocket(
        connectedAccount,
        connectedAccount,
        'https://assembly.civic.gov/charters/transit-2026.txt',
        '4a6b25110d939626e259b3df9e63e1986c758bb8efb7a1ffb1548b8b9c8a77a9',
        2,
        now + 86400,
        now + 172800
      );
      setActiveTx({
        hash: txHash,
        action: 'Docket #1 Initialized',
        status: 'SUCCESS',
        message: 'Civic Deliberation Assembly Docket #1 initialized on-chain!',
      });
      await refreshState();
    } catch (err: any) {
      setActiveTx({
        hash: '',
        action: 'Initialization Failed',
        status: 'REVERTED',
        message: err.message,
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Stage Transitions (100% Live On-Chain)
  const handleAdvanceStage = async (action: string) => {
    if (!client) return;
    setIsActionLoading(true);

    try {
      if (action === 'LOCK_MANIFEST') {
        setActiveTx({
          hash: '',
          action: 'Locking Manifest',
          status: 'PENDING',
          message: 'Sealing testimony batch with precomputed canonical hash...',
        });
        const txHash = await client.commitAndLockManifest(1);
        setActiveTx({
          hash: txHash,
          action: 'Manifest Cryptographically Locked',
          status: 'SUCCESS',
          message: 'Enrollment batch frozen on-chain. No submissions can be modified or injected.',
        });
      } else if (action === 'CLUSTER') {
        setActiveTx({
          hash: '',
          action: 'Dragon Consensus Clustering',
          status: 'PENDING',
          message: 'GenVM executing non-deterministic LLM clustering with Equivalence Principle validation...',
        });
        const txHash = await client.clusterTestimonies(1);
        setActiveTx({
          hash: txHash,
          action: 'Thematic Consensus Achieved',
          status: 'SUCCESS',
          message: 'Dragon consensus established thematic policy perspectives on-chain.',
        });
      } else if (action === 'ALLOCATE') {
        setActiveTx({
          hash: '',
          action: 'Allocating Sortition Delegates',
          status: 'PENDING',
          message: 'Executing coverage-first deterministic sortition algorithm...',
        });
        const txHash = await client.allocateSortitionDelegates(1);
        setActiveTx({
          hash: txHash,
          action: 'Sortition Complete',
          status: 'SUCCESS',
          message: 'Empanelled delegates selected ensuring thematic perspective coverage on-chain.',
        });
      } else if (action === 'RATIFY') {
        setActiveTx({
          hash: '',
          action: 'Ratifying Sovereign Assembly',
          status: 'PENDING',
          message: 'Finalizing docket immutability and closing contestation window...',
        });
        const txHash = await client.ratifyDocket(1);
        setActiveTx({
          hash: txHash,
          action: 'Sovereign Mandate Ratified',
          status: 'SUCCESS',
          message: 'Assembly roll permanently ratified on GenLayer. Docket state is immutable.',
        });
      }

      await refreshState();
    } catch (err: any) {
      setActiveTx({
        hash: '',
        action: 'Execution Failed',
        status: 'REVERTED',
        message: err.message || 'Transaction rejected by GenVM',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Contestation Submissions
  const handleSubmitChallenge = async (type: ChallengeType, targets: string[]) => {
    if (!client) return;
    setIsActionLoading(true);
    setActiveTx({
      hash: '',
      action: 'Filing Evidence Dispute',
      status: 'PENDING',
      message: `Submitting ${type} challenge against ${targets.join(', ')}...`,
    });

    try {
      const txHash = await client.openContestation(1, type, targets);
      setActiveTx({
        hash: txHash,
        action: 'Dispute Lodged',
        status: 'SUCCESS',
        message: 'Challenge registered on-chain. Awaiting Dragon consensus arbitration.',
      });
      setIsContestationModalOpen(false);
      await refreshState();
    } catch (err: any) {
      setActiveTx({
        hash: '',
        action: 'Dispute Submission Failed',
        status: 'REVERTED',
        message: err.message,
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Resolve Contestation
  const handleResolveChallenge = async (challengeId: number) => {
    if (!client) return;
    setIsActionLoading(true);
    setActiveTx({
      hash: '',
      action: 'Arbitrating Evidence Dispute',
      status: 'PENDING',
      message: 'Independent validator consensus checking cryptographic web digests...',
    });

    try {
      const txHash = await client.resolveContestation(1, challengeId);
      setActiveTx({
        hash: txHash,
        action: 'Dispute Resolved',
        status: 'SUCCESS',
        message: 'Arbitration recorded on-chain.',
      });
      await refreshState();
    } catch (err: any) {
      setActiveTx({
        hash: '',
        action: 'Arbitration Failed',
        status: 'REVERTED',
        message: err.message,
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Masthead
        contractAddress={contractAddress}
        connectedAccount={connectedAccount}
        onConnectAccount={handleConnectAccount}
        onDisconnectAccount={handleDisconnectAccount}
      />

      <main style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '2rem', flex: 1 }}>
        <LifecycleRail currentState={docket ? docket.state : 'ENROLLING'} />

        <DocketStatusHero
          docket={docket}
          onAdvanceStage={handleAdvanceStage}
          isActionLoading={isActionLoading}
          onOpenContestationModal={() => setIsContestationModalOpen(true)}
          onInitializeDocket={handleInitializeDocket}
        />

        <SortitionTopologyMap
          clusters={clusters}
          testimonies={testimonies}
        />

        <SortitionLedger
          delegates={delegates}
        />

        <TestimoniesTable
          testimonies={testimonies}
          isEnrolling={isActionLoading}
        />

        <ContestationDrawer
          contestations={contestations}
          testimonies={testimonies}
          isOpen={isContestationModalOpen}
          onClose={() => setIsContestationModalOpen(false)}
          onSubmitChallenge={handleSubmitChallenge}
          onResolveChallenge={handleResolveChallenge}
          isProcessing={isActionLoading}
        />

        {docket && (
          <AuditBundleExport
            docket={docket}
            clusters={clusters}
            delegates={delegates}
            allTestimonies={testimonies}
            contestations={contestations}
            manifestExportText={manifestExportText}
          />
        )}
      </main>

      <TransactionDrawer
        tx={activeTx}
        onDismiss={() => setActiveTx(null)}
      />

      <footer style={{
        borderTop: '1px solid var(--color-border-subtle)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--color-text-tertiary)',
        background: 'var(--color-bg-surface)',
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>Civic Deliberation Allocator · GenLayer Studionet Chain 61999</span>
          <span className="mono-hash">Contract: {contractAddress}</span>
          <span>Zero-Persistence Security · GenVM Intelligent Contract</span>
        </div>
      </footer>
    </div>
  );
};
