/**
 * GenLayer Transaction Receipt & Consensus Inspector
 * Civic Deliberation Allocator
 */

import { NETWORK_CONFIG } from './config';

export interface DecodedReceipt {
  transactionHash: string;
  status: 'SUCCESS' | 'REVERTED' | 'PENDING';
  blockNumber?: number;
  consensusRounds?: number;
  leaderExecutionTimeMs?: number;
  validatorSignatures?: number;
  returnValue?: any;
  errorMessage?: string;
}

export async function inspectTransactionReceipt(
  txHash: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<DecodedReceipt> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(NETWORK_CONFIG.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        }),
      });

      const payload = await response.json();
      if (payload && payload.result) {
        const r = payload.result;
        const isSuccess = r.status === '0x1' || r.status === 1 || r.status === true;

        return {
          transactionHash: txHash,
          status: isSuccess ? 'SUCCESS' : 'REVERTED',
          blockNumber: r.blockNumber ? parseInt(r.blockNumber, 16) : undefined,
          consensusRounds: r.consensusRounds || 1,
          validatorSignatures: r.validatorCount || 5,
          returnValue: r.returnValue || null,
          errorMessage: isSuccess ? undefined : (r.revertReason || 'Transaction reverted by GenVM Dragon consensus'),
        };
      }
    } catch (err: any) {
      // transient network wait
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    transactionHash: txHash,
    status: 'PENDING',
    errorMessage: 'Transaction consensus confirmation exceeded timeout window',
  };
}
