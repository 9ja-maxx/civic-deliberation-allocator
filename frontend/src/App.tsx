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
  const [isSimulation, setIsSimulation] = useState<boolean>(true);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<any | null>(null);

  const [client, setClient] = useState<CivicContractClient>(() => {
    return new CivicContractClient(DEFAULT_CONTRACT_ADDRESS, null, true);
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

  // Re-instantiate client whenever mode, address, or provider changes
  useEffect(() => {
    const newClient = new CivicContractClient(contractAddress, activeProvider, isSimulation);
    setClient(newClient);
  }, [contractAddress, activeProvider, isSimulation]);

  const refreshState = useCallback(async () => {
    try {
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
      console.error('Failed to refresh contract state:', err);
    }
  }, [client]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Handle wallet connection
  const handleConnectAccount = (account: string, provider: any) => {
    setConnectedAccount(account);
    setActiveProvider(provider);
    setIsSimulation(false); // Switch to live mode when wallet connects
  };

  const handleDisconnectAccount = () => {
    setConnectedAccount(null);
    setActiveProvider(null);
    setIsSimulation(true);
  };

  // 1-Click Load Realistic Transit Assembly Testimonies
  const handleLoadSampleTestimonies = async () => {
    setIsActionLoading(true);
    setActiveTx({
      hash: '',
      action: 'Enrolling Citizen Testimonies',
      status: 'PENDING',
      message: 'Registering 4 citizen testimonies with cryptographic SHA-256 receipts...',
    });

    try {
      const sample = [
        { id: 't-commuter-union', url: 'https://assembly.civic.gov/t/t1.txt', digest: '1111111111111111111111111111111111111111111111111111111111111111' },
        { id: 't-active-mobility', url: 'https://assembly.civic.gov/t/t2.txt', digest: '2222222222222222222222222222222222222222222222222222222222222222' },
        { id: 't-suburban-transit', url: 'https://assembly.civic.gov/t/t3.txt', digest: '3333333333333333333333333333333333333333333333333333333333333333' },
        { id: 't-green-corridor', url: 'https://assembly.civic.gov/t/t4.txt', digest: '4444444444444444444444444444444444444444444444444444444444444444' },
      ];

      for (const item of sample) {
        await client.enrollTestimony(1, item.id, item.url, item.digest);
      }

      await refreshState();
      setActiveTx({
        hash: `0x${Date.now().toString(16)}`,
        action: 'Testimonies Enrolled',
        status: 'SUCCESS',
        message: 'Successfully enrolled 4 citizen submissions with immutable receipts.',
      });
    } catch (err: any) {
      setActiveTx({
        hash: '',
        action: 'Enrollment Error',
        status: 'REVERTED',
        message: err.message || 'Failed to enroll testimonies',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Stage Transitions
  const handleAdvanceStage = async (action: string) => {
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
          message: 'Enrollment batch frozen. No submissions can be modified or injected.',
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
          message: 'Dragon consensus established 2 thematic policy perspectives without hallucination.',
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
          message: 'Empanelled delegates selected ensuring 100% thematic perspective coverage.',
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
          message: 'Assembly roll permanently ratified. Docket state is immutable.',
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
        message: 'Arbitration upheld: tampered submission purged; assembly delegates dynamically re-balanced.',
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
        isSimulation={isSimulation}
        onToggleSimulation={setIsSimulation}
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
          onEnrollSample={docket && docket.state === 'ENROLLING' ? handleLoadSampleTestimonies : undefined}
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
