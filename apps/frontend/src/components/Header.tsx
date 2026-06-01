import React, { useState } from 'react';

interface HeaderProps {
  userAddress: string | null;
  isSimulated: boolean;
  walletInstalled: boolean;
  onConnect: (mockAddress?: string) => void;
  onDisconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userAddress,
  isSimulated,
  walletInstalled,
  onConnect,
  onDisconnect,
}) => {
  const [showConnectModal, setShowConnectModal] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleMockConnect = (roleAddress: string) => {
    onConnect(roleAddress);
    setShowConnectModal(false);
  };

  return (
    <header className="border-b border-[#E4E4E7] bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-lg tracking-tight text-black">
            Secure Handshake
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#71717A] border border-[#E4E4E7] px-2 py-0.5 rounded-full font-mono bg-[#F4F4F5]">
            dApp
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {userAddress ? (
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-mono text-black font-medium">
                  {formatAddress(userAddress)}
                </span>
                <span className="text-[10px] text-[#71717A]">
                  {isSimulated ? 'Simulated Wallet' : 'Freighter Wallet'}
                </span>
              </div>
              <button
                onClick={onDisconnect}
                className="text-xs font-medium text-black border border-[#E4E4E7] px-3 py-1.5 hover:bg-[#F4F4F5] transition duration-150 rounded cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConnectModal(true)}
              className="text-xs font-semibold bg-black text-white hover:bg-zinc-900 transition duration-150 px-4 py-2 rounded cursor-pointer"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {showConnectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E4E4E7] max-w-md w-full p-6 shadow-lg rounded">
            <h3 className="text-base font-semibold text-black tracking-tight mb-2">
              Connect to dApp
            </h3>
            <p className="text-xs text-[#71717A] mb-6 leading-relaxed">
              Select your wallet connector. You can use Freighter Wallet if installed, or select a simulated profile to test the application immediately.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => {
                  onConnect();
                  setShowConnectModal(false);
                }}
                disabled={!walletInstalled}
                className={`w-full text-left px-4 py-3 border border-[#E4E4E7] rounded flex items-center justify-between transition ${
                  walletInstalled
                    ? 'hover:bg-[#F4F4F5] cursor-pointer'
                    : 'opacity-50 cursor-not-allowed bg-zinc-50'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-black">Freighter Wallet</div>
                  <div className="text-[10px] text-[#71717A]">
                    {walletInstalled ? 'Stellar Extension Detected' : 'Stellar Extension Not Detected'}
                  </div>
                </div>
                <div className="text-xs font-mono text-[#71717A] font-semibold">→</div>
              </button>

              <div className="border-t border-[#E4E4E7] my-4 pt-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#71717A]">
                  Simulated Local Profiles
                </span>
              </div>

              <button
                onClick={() => handleMockConnect('GACLIENT1234567890ABCDEF1234567890ABCDEF1234567890AB')}
                className="w-full text-left px-4 py-3 border border-[#E4E4E7] rounded hover:bg-[#F4F4F5] transition cursor-pointer"
              >
                <div className="text-xs font-semibold text-black">Client Profile</div>
                <div className="text-[10px] text-[#71717A] font-mono">
                  GACLIENT1234567890ABCDEF...
                </div>
              </button>

              <button
                onClick={() => handleMockConnect('GAFREELANCER1234567890ABCDEF1234567890ABCDEF1234567')}
                className="w-full text-left px-4 py-3 border border-[#E4E4E7] rounded hover:bg-[#F4F4F5] transition cursor-pointer"
              >
                <div className="text-xs font-semibold text-black">Freelancer Profile</div>
                <div className="text-[10px] text-[#71717A] font-mono">
                  GAFREELANCER1234567890ABC...
                </div>
              </button>

              <button
                onClick={() => handleMockConnect('GAARBITER1234567890ABCDEF1234567890ABCDEF1234567890')}
                className="w-full text-left px-4 py-3 border border-[#E4E4E7] rounded hover:bg-[#F4F4F5] transition cursor-pointer"
              >
                <div className="text-xs font-semibold text-black">Arbiter Profile</div>
                <div className="text-[10px] text-[#71717A] font-mono">
                  GAARBITER1234567890ABCDEF...
                </div>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-xs font-medium text-[#71717A] border border-[#E4E4E7] px-4 py-2 hover:bg-[#F4F4F5] transition rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
