import type React from "react";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

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
							<button type="button"
								onClick={() => setShowConnectModal(true)}
								className="flex flex-col items-end hover:opacity-75 transition text-left cursor-pointer"
							>
								<span className="text-sm font-mono text-black font-medium">
									{formatAddress(userAddress)}
								</span>
								<span className="text-[10px] text-[#71717A]">
									{isSimulated ? "Simulated Wallet" : "Freighter Wallet"}
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
							Select your wallet connector. You can use Freighter Wallet if
							installed, or select a simulated profile to test the application
							immediately.
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
							<div className="border-t border-[#E4E4E7] my-4 pt-4">
								<span className="text-[10px] uppercase font-bold tracking-wider text-[#71717A]">
									Simulated Local Profiles
								</span>
							</div>

							<MockProfileButton
								label="Client Profile"
								address={import.meta.env.VITE_MOCK_CLIENT || ""}
								onConnect={handleMockConnect}
							/>

							<MockProfileButton
								label="Freelancer Profile"
								address={import.meta.env.VITE_MOCK_FREELANCER || ""}
								onConnect={handleMockConnect}
							/>

							<MockProfileButton
								label="Arbiter Profile"
								address={import.meta.env.VITE_MOCK_ARBITER || ""}
								onConnect={handleMockConnect}
							/>
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

const MockProfileButton = ({
	label,
	address,
	onConnect,
}: {
	label: string;
	address: string;
	onConnect: (address: string) => void;
}) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = (e: React.MouseEvent) => {
		e.stopPropagation();
		navigator.clipboard.writeText(address);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="w-full flex border border-[#E4E4E7] rounded hover:bg-[#F4F4F5] transition group overflow-hidden">
			<button
				type="button"
				onClick={() => onConnect(address)}
				className="flex-1 text-left px-4 py-3 cursor-pointer"
			>
				<div className="text-xs font-semibold text-black">{label}</div>
				<div className="text-[10px] text-[#71717A] font-mono">
					{address.slice(0, 24)}...
				</div>
			</button>
			<button
				type="button"
				onClick={handleCopy}
				className="px-4 flex items-center justify-center text-[#A1A1AA] hover:text-black transition cursor-pointer border-l border-transparent hover:bg-[#E4E4E7]"
				title="Copy Address"
			>
				{copied ? <Check size={14} /> : <Copy size={14} />}
			</button>
		</div>
	);
};
