/**
 * GenLayer Intelligent Contract Client
 * Civic Deliberation Allocator (9ja-maxx)
 * 100% Live Studionet Client powered by genlayer-js
 */

import { createClient, chains } from 'genlayer-js';
import {
  DocketSummary,
  TestimonyRecord,
  ThematicCluster,
  ContestationRecord,
  ChallengeType,
} from './types';

export class CivicContractClient {
  private contractAddress: `0x${string}`;
  private provider: any | null = null;
  private publicClient: any;

  constructor(contractAddress: string, provider?: any) {
    this.contractAddress = contractAddress as `0x${string}`;
    this.provider = provider || null;
    this.publicClient = createClient({ chain: chains.studionet });
  }

  // --------------------------------------------------------------------------
  // Public Views (No Wallet Required)
  // --------------------------------------------------------------------------

  public async getDocketCount(): Promise<number> {
    try {
      const res = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: 'get_docket_count',
        args: [],
      });
      return Number(res || 0);
    } catch {
      return 0;
    }
  }

  public async getDocket(docketId: number = 1): Promise<DocketSummary | null> {
    try {
      const res = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: 'get_docket',
        args: [docketId],
      });
      return typeof res === 'string' ? JSON.parse(res) : res;
    } catch (err: any) {
      console.warn('Civic docket view failed (uninitialized or reverted):', err.message);
      return null;
    }
  }

  public async getAllTestimonies(docketId: number = 1): Promise<TestimonyRecord[]> {
    try {
      const res = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: 'get_all_testimonies',
        args: [docketId],
      });
      if (!res) return [];
      return typeof res === 'string' ? JSON.parse(res) : res;
    } catch {
      return [];
    }
  }

  public async getThematicClusters(docketId: number = 1): Promise<ThematicCluster[]> {
    try {
      const res = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: 'get_thematic_clusters',
        args: [docketId],
      });
      if (!res) return [];
      return typeof res === 'string' ? JSON.parse(res) : res;
    } catch {
      return [];
    }
  }

  public async getSortitionLedger(docketId: number = 1): Promise<TestimonyRecord[]> {
    try {
      const res = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: 'get_sortition_ledger',
        args: [docketId],
      });
      if (!res) return [];
      return typeof res === 'string' ? JSON.parse(res) : res;
    } catch {
      return [];
    }
  }

  public async getAllContestations(docketId: number = 1): Promise<ContestationRecord[]> {
    try {
      const res = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: 'get_all_contestations',
        args: [docketId],
      });
      if (!res) return [];
      return typeof res === 'string' ? JSON.parse(res) : res;
    } catch {
      return [];
    }
  }

  public async getManifestExport(docketId: number = 1): Promise<string> {
    try {
      const res = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: 'get_manifest_export',
        args: [docketId],
      });
      return res || '';
    } catch {
      return '';
    }
  }

  // --------------------------------------------------------------------------
  // Write Transactions (Injected Wallet Required)
  // --------------------------------------------------------------------------

  public async initializeDocket(
    proposalUrl: string,
    proposalDigest: string,
    expectedManifestDigest: string,
    slotCount: number,
    enrollmentDeadline: number,
    contestationDeadline: number
  ): Promise<string> {
    return this.writeMethod('initialize_docket', [
      proposalUrl,
      proposalDigest,
      expectedManifestDigest,
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
    return this.writeMethod('enroll_testimony', [docketId, testimonyId, url, digest]);
  }

  public async commitAndLockManifest(docketId: number = 1): Promise<string> {
    return this.writeMethod('commit_and_lock_manifest', [docketId]);
  }

  public async clusterTestimonies(docketId: number = 1): Promise<string> {
    return this.writeMethod('cluster_testimonies', [docketId]);
  }

  public async allocateSortitionDelegates(docketId: number = 1): Promise<string> {
    return this.writeMethod('allocate_sortition_delegates', [docketId]);
  }

  public async openContestation(
    docketId: number,
    challengeType: ChallengeType,
    targetIds: string[]
  ): Promise<string> {
    return this.writeMethod('open_contestation', [docketId, challengeType, JSON.stringify(targetIds)]);
  }

  public async resolveContestation(docketId: number, challengeId: number): Promise<string> {
    return this.writeMethod('resolve_contestation', [docketId, challengeId]);
  }

  public async ratifyDocket(docketId: number = 1): Promise<string> {
    return this.writeMethod('ratify_docket', [docketId]);
  }

  private async writeMethod(functionName: string, args: any[]): Promise<string> {
    if (!this.provider) throw new Error('ERR_NO_WALLET: Connect wallet to submit transactions');

    const client = createClient({
      chain: chains.studionet,
      provider: this.provider,
    });

    const hash = await client.writeContract({
      address: this.contractAddress,
      functionName,
      args,
      value: 0n,
    });

    return hash;
  }
}
