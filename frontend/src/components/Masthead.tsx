import React, { useState, useEffect } from 'react';
import { WalletManager } from '../wallet';
import { WalletProviderDetail } from '../types';
import { NETWORK_CONFIG } from '../config';
import { ShieldCheck, Cpu, Wallet, CheckCircle2, ChevronDown, ExternalLink } from 'lucide-react';

interface MastheadProps {
  contractAddress: string;
  isSimulation: boolean;
  onToggleSimulation: (sim: boolean) => void;
  connectedAccount: string | null;
  onConnectAccount: (account: string, provider: any) => void;
  onDisconnectAccount: () => void;
}

export const Masthead: React.FC<MastheadProps> = ({
  contractAddress,
  isSimulation,
  onToggleSimulation,
  connectedAccount,
  onConnectAccount,
  onDisconnectAccount,
}) => {
  const [providers, setProviders] = useState<WalletProviderDetail[]>([]);
  const [showWalletMenu, setShowWalletMenu] = useState<boolean>(false);
  const walletMgr = WalletManager.getInstance();

  useEffect(() => {
    const unsub = walletMgr.subscribe((list) => setProviders(list));
    return () => unsub();
  }, []);

  const handleSelectProvider = async (detail: WalletProviderDetail) => {
    try {
      const account = await walletMgr.connect(detail.provider);
      onConnectAccount(account, detail.provider);
      setShowWalletMenu(false);
    } catch (err: any) {
      alert(`Wallet connection failed: ${err.message}`);
    }
  };

  return (
    <header className="civic-card" style={{ borderBottom: '1px solid var(--color-border-subtle)', borderRadius: 0, padding: '1rem 2rem' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand & Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)'
          }}>
            <ShieldCheck size={22} color="#0a0d14" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                CIVIC DELIBERATION ALLOCATOR
              </span>
              <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>GenVM Sortition</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Equivalence-Guaranteed Citizen Assembly Sortition & Anti-Astroturfing Consensus
            </p>
          </div>
        </div>

        {/* Network & Wallet Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Network Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
            <span style={{ color: 'var(--color-text-secondary)' }}>Chain {NETWORK_CONFIG.chainId}</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{NETWORK_CONFIG.chainName}</span>
          </div>

          {/* Mode Switch: Interactive Demo vs Live Studionet */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--color-bg-base)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
          }}>
            <button
              onClick={() => onToggleSimulation(true)}
              style={{
                border: 'none',
                background: isSimulation ? 'var(--color-accent-amber)' : 'transparent',
                color: isSimulation ? '#000' : 'var(--color-text-secondary)',
                fontWeight: isSimulation ? 600 : 400,
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Interactive Sim
            </button>
            <button
              onClick={() => onToggleSimulation(false)}
              style={{
                border: 'none',
                background: !isSimulation ? 'var(--color-bg-elevated)' : 'transparent',
                color: !isSimulation ? '#fff' : 'var(--color-text-secondary)',
                fontWeight: !isSimulation ? 600 : 400,
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Live Studionet
            </button>
          </div>

          {/* Wallet Connection */}
          <div style={{ position: 'relative' }}>
            {connectedAccount ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  className="btn-secondary"
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }}></span>
                  <span className="mono-hash">{WalletManager.truncateAddress(connectedAccount)}</span>
                  <ChevronDown size={14} />
                </button>
                {showWalletMenu && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    width: '200px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border-prominent)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.5rem',
                    zIndex: 50,
                  }}>
                    <button
                      onClick={() => {
                        onDisconnectAccount();
                        setShowWalletMenu(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        background: 'transparent',
                        border: 'none',
                        color: '#fb7185',
                        cursor: 'pointer',
                        fontSize: '0.825rem',
                        borderRadius: '4px',
                      }}
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <button
                  className="btn-primary"
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                >
                  <Wallet size={16} />
                  <span>Connect Wallet</span>
                  <ChevronDown size={14} />
                </button>

                {showWalletMenu && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    width: '240px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border-prominent)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.75rem',
                    zIndex: 50,
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                      EIP-6963 INJECTED WALLETS
                    </div>
                    {providers.length > 0 ? (
                      providers.map((p) => (
                        <button
                          key={p.info.uuid}
                          onClick={() => handleSelectProvider(p)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            padding: '0.55rem',
                            background: 'var(--color-bg-surface)',
                            border: '1px solid var(--color-border-subtle)',
                            color: '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginBottom: '0.35rem',
                            fontSize: '0.825rem',
                          }}
                        >
                          {p.info.icon && (
                            <img src={p.info.icon} alt={p.info.name} style={{ width: '18px', height: '18px' }} />
                          )}
                          <span>{p.info.name}</span>
                        </button>
                      ))
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', padding: '0.5rem 0' }}>
                        No EIP-6963 wallets detected. Defaulting to Simulated Execution.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
