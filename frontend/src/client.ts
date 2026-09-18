/**
 * GenLayer Intelligent Contract Client & Simulation Engine
 * Civic Deliberation Allocator
 */

import { NETWORK_CONFIG } from './config';
import {
  DocketSummary,
  TestimonyRecord,
  ThematicCluster,
  ContestationRecord,
  ChallengeType,
  LifecycleState,
} from './types';

export class CivicContractClient {
  private contractAddress: string;
  private provider: any | null = null;
  private isSimulation: boolean = false;

  // In-memory simulation state for instant browser exploration
  private simDocket: DocketSummary = {
    docket_id: 1,
    organizer: '0x1111111111111111111111111111111111111111',
    admission_authority: '0x1111111111111111111111111111111111111111',
    proposal_url: 'https://assembly.civic.gov/charters/transit-2026.txt',
    proposal_digest: '4a6b25110d939626e259b3df9e63e1986c758bb8efb7a1ffb1548b8b9c8a77a9',
    expected_manifest_digest: 'b6bc55ed8ff9d72f10b776a30138c08a3b588b8efb7a1ffb1548b8b9c8a77a9',
    computed_manifest_digest: 'b6bc55ed8ff9d72f10b776a30138c08a3b588b8efb7a1ffb1548b8b9c8a77a9',
    slot_count: 2,
    enrollment_deadline: Math.floor(Date.now() / 1000) + 3600,
    contestation_deadline: Math.floor(Date.now() / 1000) + 7200,
    state: 'ENROLLING',
    testimony_count: 0,
    revision: 1,
    accepted_contestation_count: 0,
    pending_contestation_count: 0,
    total_contestation_count: 0,
    annulment_reason: '',
  };

  private simTestimonies: TestimonyRecord[] = [];
  private simClusters: ThematicCluster[] = [];
  private simContestations: ContestationRecord[] = [];

  constructor(contractAddress: string, provider?: any, simulationMode: boolean = false) {
    this.contractAddress = contractAddress;
    this.provider = provider || null;
    this.isSimulation = simulationMode;
  }

  public setSimulation(active: boolean) {
    this.isSimulation = active;
  }

  public getSimulation(): boolean {
    return this.isSimulation;
  }

  // --------------------------------------------------------------------------
  // Public Views
  // --------------------------------------------------------------------------

  public async getDocket(docketId: number = 1): Promise<DocketSummary> {
    if (this.isSimulation || !this.provider) {
      return {
        ...this.simDocket,
        testimony_count: this.simTestimonies.length,
        total_contestation_count: this.simContestations.length,
        pending_contestation_count: this.simContestations.filter((c) => c.status === 'PENDING').length,
        accepted_contestation_count: this.simContestations.filter((c) => c.status === 'ACCEPTED').length,
      };
    }

    return this.callView('get_docket', [docketId]);
  }

  public async getAllTestimonies(docketId: number = 1): Promise<TestimonyRecord[]> {
    if (this.isSimulation || !this.provider) {
      return [...this.simTestimonies];
    }
    const res = await this.callView('get_all_testimonies', [docketId]);
    return typeof res === 'string' ? JSON.parse(res) : res;
  }

  public async getThematicClusters(docketId: number = 1): Promise<ThematicCluster[]> {
    if (this.isSimulation || !this.provider) {
      return [...this.simClusters];
    }
    const res = await this.callView('get_thematic_clusters', [docketId]);
    return typeof res === 'string' ? JSON.parse(res) : res;
  }

  public async getSortitionLedger(docketId: number = 1): Promise<TestimonyRecord[]> {
    if (this.isSimulation || !this.provider) {
      return this.simTestimonies
        .filter((t) => t.selected)
        .sort((a, b) => a.selection_rank - b.selection_rank);
    }
    const res = await this.callView('get_sortition_ledger', [docketId]);
    return typeof res === 'string' ? JSON.parse(res) : res;
  }

  public async getAllContestations(docketId: number = 1): Promise<ContestationRecord[]> {
    if (this.isSimulation || !this.provider) {
      return [...this.simContestations];
    }
    const res = await this.callView('get_all_contestations', [docketId]);
    return typeof res === 'string' ? JSON.parse(res) : res;
  }

  public async getManifestExport(docketId: number = 1): Promise<string> {
    if (this.isSimulation || !this.provider) {
      return this.simTestimonies
        .slice()
        .sort((a, b) => a.testimony_id.localeCompare(b.testimony_id))
        .map((t) => `${t.testimony_id}|${t.url}|${t.digest.toLowerCase()}`)
        .join('\n');
    }
    return this.callView('get_manifest_export', [docketId]);
  }

  // --------------------------------------------------------------------------
  // Write Transactions
  // --------------------------------------------------------------------------

  public async enrollTestimony(
    docketId: number,
    testimonyId: string,
    url: string,
    digest: string
  ): Promise<string> {
    if (this.isSimulation || !this.provider) {
      const idx = this.simTestimonies.length;
      const receipt = `RCPT-${testimonyId.toUpperCase()}-${digest.slice(0, 8)}`;
      const rec: TestimonyRecord = {
        index: idx,
        testimony_id: testimonyId.trim(),
        url: url.trim(),
        digest: digest.trim().toLowerCase(),
        registrar: this.simDocket.organizer,
        admission_authority: this.simDocket.admission_authority,
        enrollment_receipt: receipt,
        eligible: true,
        exclusion_reason: '',
        cluster_id: 0,
        cluster_label: '',
        relevance_score: 0,
        is_duplicate: false,
        duplicate_of_id: '',
        selected: false,
        selection_rank: 0,
        reason_code: '',
        rationale: '',
      };
      this.simTestimonies.push(rec);
      return `0xsim_tx_enroll_${Date.now()}`;
    }

    return this.sendWrite('enroll_testimony', [docketId, testimonyId, url, digest]);
  }

  public async commitAndLockManifest(docketId: number): Promise<string> {
    if (this.isSimulation || !this.provider) {
      this.simDocket.state = 'MANIFEST_LOCKED';
      return `0xsim_tx_lock_${Date.now()}`;
    }
    return this.sendWrite('commit_and_lock_manifest', [docketId]);
  }

  public async clusterTestimonies(docketId: number): Promise<string> {
    if (this.isSimulation || !this.provider) {
      this.simClusters = [
        {
          cluster_id: 1,
          label: 'Regional Rail & Transit Infrastructure',
          summary: 'High-capacity light rail and suburban transit networks connecting commerce centers.',
          testimony_ids: ['t-commuter-union', 't-suburban-transit', 't-green-corridor'],
        },
        {
          cluster_id: 2,
          label: 'Active & Micro-Mobility Networks',
          summary: 'Protected bicycle highways, micromobility safety and pedestrian accessibility.',
          testimony_ids: ['t-active-mobility'],
        },
      ];

      // Assign scores
      for (const t of this.simTestimonies) {
        if (t.testimony_id === 't-commuter-union') {
          t.cluster_id = 1;
          t.cluster_label = 'Regional Rail & Transit Infrastructure';
          t.relevance_score = 92;
        } else if (t.testimony_id === 't-active-mobility') {
          t.cluster_id = 2;
          t.cluster_label = 'Active & Micro-Mobility Networks';
          t.relevance_score = 88;
        } else if (t.testimony_id === 't-suburban-transit') {
          t.cluster_id = 1;
          t.cluster_label = 'Regional Rail & Transit Infrastructure';
          t.relevance_score = 85;
        } else if (t.testimony_id === 't-green-corridor') {
          t.cluster_id = 1;
          t.cluster_label = 'Regional Rail & Transit Infrastructure';
          t.relevance_score = 81;
        }
      }

      this.simDocket.state = 'THEMATIC_CONSENSUS';
      return `0xsim_tx_cluster_${Date.now()}`;
    }
    return this.sendWrite('cluster_testimonies', [docketId]);
  }

  public async allocateSortitionDelegates(docketId: number): Promise<string> {
    if (this.isSimulation || !this.provider) {
      // Pick 1 from each cluster (coverage-first)
      const t1 = this.simTestimonies.find((t) => t.testimony_id === 't-commuter-union');
      const t2 = this.simTestimonies.find((t) => t.testimony_id === 't-active-mobility');

      if (t1) {
        t1.selected = true;
        t1.selection_rank = 1;
        t1.reason_code = 'PRIMARY_CLUSTER_DELEGATE';
        t1.rationale = 'Cluster 1 Seed Representative (Highest Relevance: 92)';
      }
      if (t2) {
        t2.selected = true;
        t2.selection_rank = 2;
        t2.reason_code = 'PRIMARY_CLUSTER_DELEGATE';
        t2.rationale = 'Cluster 2 Seed Representative (Highest Relevance: 88)';
      }

      this.simDocket.state = 'SORTITION_ALLOCATED';
      return `0xsim_tx_allocate_${Date.now()}`;
    }
    return this.sendWrite('allocate_sortition_delegates', [docketId]);
  }

  public async openContestation(
    docketId: number,
    challengeType: ChallengeType,
    targetIds: string[]
  ): Promise<string> {
    if (this.isSimulation || !this.provider) {
      const cid = this.simContestations.length + 1;
      this.simContestations.push({
        id: cid,
        challenge_type: challengeType,
        target_ids: targetIds,
        challenger: '0x3333333333333333333333333333333333333333',
        status: 'PENDING',
        resolution_reason: '',
        resolved_at_revision: 0,
      });
      this.simDocket.state = 'CONTESTATION_OPEN';
      return `0xsim_tx_challenge_${Date.now()}`;
    }
    return this.sendWrite('open_contestation', [docketId, challengeType, JSON.stringify(targetIds)]);
  }

  public async resolveContestation(docketId: number, challengeId: number): Promise<string> {
    if (this.isSimulation || !this.provider) {
      const c = this.simContestations.find((item) => item.id === challengeId);
      if (c) {
        c.status = 'ACCEPTED';
        c.resolution_reason = 'Cryptographic digest mismatch confirmed: published testimony body was altered after lock';
        c.resolved_at_revision = this.simDocket.revision + 1;
        this.simDocket.revision += 1;

        // Disqualify target
        const target = this.simTestimonies.find((t) => t.testimony_id === c.target_ids[0]);
        if (target) {
          target.eligible = false;
          target.selected = false;
          target.exclusion_reason = 'PROVENANCE_DISQUALIFIED';
        }

        // Re-allocate: suburban transit takes the seat
        const replacement = this.simTestimonies.find((t) => t.testimony_id === 't-suburban-transit');
        if (replacement) {
          replacement.selected = true;
          replacement.selection_rank = 1;
          replacement.reason_code = 'PRIMARY_CLUSTER_DELEGATE';
          replacement.rationale = 'Re-allocated seed representative for Cluster 1 following disqualification';
        }
      }
      return `0xsim_tx_resolve_${Date.now()}`;
    }
    return this.sendWrite('resolve_contestation', [docketId, challengeId]);
  }

  public async ratifyDocket(docketId: number): Promise<string> {
    if (this.isSimulation || !this.provider) {
      this.simDocket.state = 'SOVEREIGN_RATIFIED';
      return `0xsim_tx_ratify_${Date.now()}`;
    }
    return this.sendWrite('ratify_docket', [docketId]);
  }

  // --------------------------------------------------------------------------
  // Internal RPC Transport
  // --------------------------------------------------------------------------

  private async callView(method: string, args: any[]): Promise<any> {
    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'gen_callView',
      params: [
        {
          to: this.contractAddress,
          function: method,
          args: args,
        },
      ],
    };

    const response = await fetch(NETWORK_CONFIG.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || `RPC Error in ${method}`);
    }
    return data.result;
  }

  private async sendWrite(method: string, args: any[]): Promise<string> {
    if (!this.provider) {
      throw new Error('ERR_NO_WALLET: Connect wallet to submit transactions');
    }

    const accounts = await this.provider.request({ method: 'eth_accounts' });
    const from = accounts[0];

    const txPayload = {
      from,
      to: this.contractAddress,
      data: JSON.stringify({ function: method, args }),
    };

    const txHash = await this.provider.request({
      method: 'eth_sendTransaction',
      params: [txPayload],
    });

    return txHash;
  }
}
