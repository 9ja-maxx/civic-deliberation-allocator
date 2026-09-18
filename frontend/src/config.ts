/**
 * GenLayer Studionet Network & Application Configuration
 */

export const NETWORK_CONFIG = {
  chainId: 61999,
  chainName: 'GenLayer Studionet',
  rpcUrl: 'https://studio.genlayer.com/api',
  currencySymbol: 'GEN',
  explorerUrl: 'https://studio.genlayer.com',
};

// Default deployed contract address (can be overridden in UI or via environment)
export const DEFAULT_CONTRACT_ADDRESS = '0x5C80FE676E4B17B0d10b776a30138C08a3B588B8';

// Allowed EIP-6963 Wallet RDNS identifiers
export const ALLOWED_WALLET_RDNS = [
  'io.metamask',
  'com.okex.wallet',
  'io.rabby',
  'app.phantom',
  'com.brave.wallet',
];

export const SORTITION_REASON_LABELS: Record<string, string> = {
  PRIMARY_CLUSTER_DELEGATE: 'Cluster Seed Delegate (Rank #1 in Cluster)',
  SECONDARY_CLUSTER_DEPTH: 'Cluster Depth Representative',
  CLUSTER_CAP_REACHED: 'Cluster Maximum Allocation Cap Reached',
  SLOT_CAPACITY_LIMIT: 'Docket Slot Capacity Filled by Higher-Ranked Candidates',
  LOWER_RELEVANCE_RANKING: 'Lower Relevance Ranking / Tie-Break Score',
  DUPLICATE_ASTROTURF: 'Disqualified: Identified as Semantic Astroturf / Near-Duplicate',
  PROVENANCE_DISQUALIFIED: 'Disqualified: Cryptographic Digest Provenance Mismatch',
  OUT_OF_SCOPE_IRRELEVANT: 'Disqualified: Evaluated as Irrelevant to Assembly Charter',
};
