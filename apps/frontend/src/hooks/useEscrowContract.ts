import { useCallback, useEffect, useMemo, useState } from 'react';
import { Client, type Escrow } from '../contracts/micro-escrow';
import { getConnectedAddress, isFreighterInstalled } from '../utils/freighter';

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || 'CDA7ESCROWCONTRACTID1234567890BCDEF';

export function useEscrowContract() {
  const [walletInstalled, setWalletInstalled] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escrows, setEscrows] = useState<Escrow[]>([]);

  const client = useMemo(() => new Client({ contractId: CONTRACT_ID }), []);

  useEffect(() => {
    isFreighterInstalled().then(setWalletInstalled);
    getConnectedAddress().then(address => {
      if (address) {
        setUserAddress(address);
        setIsSimulated(false);
      } else {
        const cached = localStorage.getItem('crow_user_address');
        const cachedSim = localStorage.getItem('crow_is_simulated');
        if (cached) {
          setUserAddress(cached);
          setIsSimulated(cachedSim === 'true');
        }
      }
    });
  }, []);

  const refreshEscrows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const count = await client.counter();
      const list: Escrow[] = [];
      for (let i = 1; i <= count; i++) {
        const item = await client.get_escrow({ id: i });
        if (item) {
          list.push(item);
        }
      }
      setEscrows(list.reverse());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch escrows from contract');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        refreshEscrows();
      }
    });
    return () => {
      active = false;
    };
  }, [refreshEscrows]);

  const connectWallet = useCallback(async (simulatedAddress?: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      if (simulatedAddress) {
        setUserAddress(simulatedAddress);
        setIsSimulated(true);
        localStorage.setItem('crow_user_address', simulatedAddress);
        localStorage.setItem('crow_is_simulated', 'true');
      } else {
        const address = await getConnectedAddress();
        if (address) {
          setUserAddress(address);
          setIsSimulated(false);
          localStorage.setItem('crow_user_address', address);
          localStorage.setItem('crow_is_simulated', 'false');
        } else {
          throw new Error('Freighter wallet not found or connection rejected');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setUserAddress(null);
    setIsSimulated(false);
    localStorage.removeItem('crow_user_address');
    localStorage.removeItem('crow_is_simulated');
  }, []);

  const createEscrowOnChain = useCallback(async (
    freelancer: string,
    arbiter: string,
    token: string,
    amount: bigint
  ): Promise<number | null> => {
    if (!userAddress) {
      setError('Wallet not connected');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const escrowId = await client.create_escrow({
        client: userAddress,
        freelancer,
        arbiter,
        token,
        amount,
      });
      await refreshEscrows();
      return escrowId;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create escrow on-chain');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, userAddress, refreshEscrows]);

  const releaseFundsOnChain = useCallback(async (escrowId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await client.release_funds({ escrow_id: escrowId });
      await refreshEscrows();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to release funds on-chain');
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, refreshEscrows]);

  const triggerDisputeOnChain = useCallback(async (escrowId: number): Promise<boolean> => {
    if (!userAddress) { setError('Wallet not connected'); return false; }
    setLoading(true);
    try {
      await client.trigger_dispute({ escrow_id: escrowId }); // Stripped of the non-existent caller argument
      await refreshEscrows();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, userAddress, refreshEscrows]);

  const resolveDisputeOnChain = useCallback(async (
    escrowId: number,
    freelancerShare: bigint
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await client.resolve_dispute({ escrow_id: escrowId, freelancer_share: freelancerShare });
      await refreshEscrows();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resolve dispute on-chain');
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, refreshEscrows]);

  return {
    walletInstalled,
    userAddress,
    isConnecting,
    isSimulated,
    loading,
    error,
    escrows,
    connectWallet,
    disconnectWallet,
    createEscrowOnChain,
    releaseFundsOnChain,
    triggerDisputeOnChain,
    resolveDisputeOnChain,
    refreshEscrows,
    setError,
  };
}
