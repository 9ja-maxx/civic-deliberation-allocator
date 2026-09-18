/**
 * GenLayer Intelligent Contract Client
 * Civic Deliberation Allocator (9ja-maxx)
 * 100% Live Studionet Contract RPC Transport
 */

import { NETWORK_CONFIG } from './config';
import {
  DocketSummary,
  TestimonyRecord,
  ThematicCluster,
  ContestationRecord,
  ChallengeType,
} from './types';

export class CivicContractClient {
  private contractAddress: string;
  private provider: any | null = null;

  constructor(contractAddress: string, provider?: any) {
    this.contractAddress = contractAddress;
    this.provider = provider || null;
  }

  // --------------------------------------------------------------------------
  // Public Views
  // --------------------------------------------------------------------------

  public async getDocketCount(): Promise<number> {
    const res = await this.callView('get_docket_count', []);
    return Number(res || 0);
  }

  public async getDocket(docketId: number = 1): Promise<DocketSummary> {
    const res = await this.callView('get_docket', [docketId]);
    return typeof res === 'string' ? JSON.parse(res) : res;
  }

  public async getAllTestimonies(docketId: number = 1): Promise<TestimonyRecord[]> {
    const res = await this.callView('get_all_testimonies', [docketId]);
    if (!res) return [];
    return typeof res === 'string' ? JSON.parse(res) : res;
  }

  public async getThematicClusters(docketId: number = 1): Promise<ThematicCluster[]> {
    const res = await this.callView('get_thematic_clusters', [docketId]);
    if (!res) return [];
    return typeof res === 'string' ? JSON.parse(res) : res;
  }

  public async getSortitionLedger(docketId: number = 1): Promise<TestimonyRecord[]> {
    const res = await this.callView('get_sortition_ledger', [docketId]);
    if (!res) return [];
    return typeof res === 'string' ? JSON.parse(res) : res;
  }

  public async getAllContestations(docketId: number = 1): Promise<ContestationRecord[]> {
    const res = await this.callView('get_all_contestations', [docketId]);
    if (!res) return [];
    return typeof res === 'string' ? JSON.parse(res) : res;
  }

  public async getManifestExport(docketId: number = 1): Promise<string> {
    const res = await this.callView('get_manifest_export', [docketId]);
    return res || '';
  }

  // --------------------------------------------------------------------------
  // Write Transactions
  // --------------------------------------------------------------------------

  public async initializeDocket(
    organizer: string,
    admissionAuthority: string,
    proposalUrl: string,
    proposalDigest: string,
    slotCount: number,
    enrollmentDeadline: number,
    contestationDeadline: number
  ): Promise<string> {
    return this.sendWrite('initialize_docket', [
      organizer,
      admissionAuthority,
      proposalUrl,
      proposalDigest,
      slotCount,
      enrollmentDeadline,
      contestationDeadline,
    ]);
  }

  public async enrollTestimony(
    docketId: number,
    testimonyId: string,
    url: string,
    digest: string
  ): Promise<string> {
    return this.sendWrite('enroll_testimony', [docketId, testimonyId, url, digest]);
  }

  public async commitAndLockManifest(docketId: number = 1): Promise<string> {
    return this.sendWrite('commit_and_lock_manifest', [docketId]);
  }

  public async clusterTestimonies(docketId: number = 1): Promise<string> {
    return this.sendWrite('cluster_testimonies', [docketId]);
  }

  public async allocateSortitionDelegates(docketId: number = 1): Promise<string> {
    return this.sendWrite('allocate_sortition_delegates', [docketId]);
  }

  public async openContestation(
    docketId: number,
    challengeType: ChallengeType,
    targetIds: string[]
  ): Promise<string> {
    return this.sendWrite('open_contestation', [docketId, challengeType, JSON.stringify(targetIds)]);
  }

  public async resolveContestation(docketId: number, challengeId: number): Promise<string> {
    return this.sendWrite('resolve_contestation', [docketId, challengeId]);
  }

  public async ratifyDocket(docketId: number = 1): Promise<string> {
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
    if (!accounts || accounts.length === 0) {
      const requested = await this.provider.request({ method: 'eth_requestAccounts' });
      if (!requested || requested.length === 0) {
        throw new Error('ERR_NO_ACCOUNT: Please select an active account in your wallet');
      }
    }
    const from = accounts[0] || (await this.provider.request({ method: 'eth_accounts' }))[0];

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
