/**
 * EIP-6963 Hardened Multi-Provider Wallet Connector
 * Civic Deliberation Allocator
 * Zero-persistence security: Never stores session credentials or keys in localStorage.
 */

import { NETWORK_CONFIG, ALLOWED_WALLET_RDNS } from './config';
import { WalletProviderDetail } from './types';

export class WalletManager {
  private static instance: WalletManager;
  private discoveredProviders: Map<string, WalletProviderDetail> = new Map();
  private listeners: Array<(providers: WalletProviderDetail[]) => void> = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('eip6963:announceProvider', (event: any) => {
        const detail: WalletProviderDetail = event.detail;
        if (!detail || !detail.info || !detail.provider) return;

        // RDNS safety filter
        const isAllowed = ALLOWED_WALLET_RDNS.some((rdns) =>
          detail.info.rdns.toLowerCase().includes(rdns.toLowerCase())
        );

        if (isAllowed) {
          this.discoveredProviders.set(detail.info.rdns, detail);
          this.notifyListeners();
        }
      });

      // Announce request
      window.dispatchEvent(new Event('eip6963:requestProvider'));
    }
  }

  public static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  public getProviders(): WalletProviderDetail[] {
    return Array.from(this.discoveredProviders.values());
  }

  public subscribe(callback: (providers: WalletProviderDetail[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.getProviders());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners() {
    const list = this.getProviders();
    this.listeners.forEach((cb) => cb(list));
  }

  /**
   * Connect to specified provider and request account access.
   */
  public async connect(provider: any): Promise<string> {
    if (!provider) throw new Error('ERR_PROVIDER_NOT_FOUND: No wallet provider specified');

    // 1. Request accounts
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('ERR_ACCESS_DENIED: No accounts authorized by user');
    }

    // 2. Ensure chain is GenLayer Studionet (61999)
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Error code 4902 indicates chain not found; attempt to add it
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
              chainName: NETWORK_CONFIG.chainName,
              nativeCurrency: {
                name: 'GenLayer GEN',
                symbol: NETWORK_CONFIG.currencySymbol,
                decimals: 18,
              },
              rpcUrls: [NETWORK_CONFIG.rpcUrl],
              blockExplorerUrls: [NETWORK_CONFIG.explorerUrl],
            },
          ],
        });
      }
    }

    return accounts[0].toLowerCase();
  }

  /**
   * Format 42-char address into truncated human-readable format.
   */
  public static truncateAddress(address: string): string {
    if (!address || address.length < 10) return address || '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}
