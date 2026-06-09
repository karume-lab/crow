import type React from "react";
import { useState } from "react";

interface HeaderProps {
	userAddress: string | null;
	walletInstalled: boolean;
	onConnect: () => void;
	onDisconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
	userAddress,
	walletInstalled,
	onConnect,
	onDisconnect,
}) => {
	const [showConnectModal, setShowConnectModal] = useState(false);

	const formatAddress = (addr: string) => {
		return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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
							<button type="button"
								onClick={() => setShowConnectModal(true)}
								className="flex flex-col items-end hover:opacity-75 transition text-left cursor-pointer"
							>
								<span className="text-sm font-mono text-black font-medium">
									{formatAddress(userAddress)}
								</span>
								<span className="text-[10px] text-[#71717A]">
									Freighter Wallet
								</span>
							</button>
							<button type="button"
								onClick={onDisconnect}
								className="text-xs font-medium text-black border border-[#E4E4E7] px-3 py-1.5 hover:bg-[#F4F4F5] transition duration-150 rounded cursor-pointer"
							>
								Disconnect
							</button>
						</div>
					) : (
						<button type="button"
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
							Select your wallet connector. Ensure you have the Freighter browser extension installed and configured.
						</p>

						<div className="space-y-4">
							<button type="button"
								onClick={() => {
									onConnect();
									setShowConnectModal(false);
								}}
								disabled={!walletInstalled}
								className={`w-full text-left px-4 py-3 border border-[#E4E4E7] rounded flex items-center justify-between transition ${
									walletInstalled
										? "hover:bg-[#F4F4F5] cursor-pointer"
										: "opacity-50 cursor-not-allowed bg-zinc-50"
								}`}
							>
								<div>
									<div className="text-xs font-semibold text-black">
										Freighter Wallet
									</div>
									<div className="text-[10px] text-[#71717A]">
										{walletInstalled
											? "Stellar Extension Detected"
											: "Stellar Extension Not Detected"}
									</div>
								</div>
								<div className="text-xs font-mono text-[#71717A] font-semibold">
									→
								</div>
							</button>

						</div>

						<div className="mt-6 flex justify-end">
							<button type="button"
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

