import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import type { Escrow, EscrowStatus } from "../contracts/micro-escrow";
import type { EscrowDossier } from "../hooks/useBackendApi";

export const CopyableAddress = ({ address }: { address: string }) => {
	const [copied, setCopied] = useState(false);

	const formatAddress = (addr: string) => {
		return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(address);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="flex items-center gap-1.5 mt-0.5 group">
			<span className="text-black font-mono font-medium" title={address}>
				{formatAddress(address)}
			</span>
			<button
				type="button"
				onClick={handleCopy}
				className="text-[#71717A] opacity-0 group-hover:opacity-100 transition hover:text-black cursor-pointer"
				title="Copy Address"
			>
				{copied ? <Check size={12} /> : <Copy size={12} />}
			</button>
		</div>
	);
};

interface DashboardGridViewProps {
	escrows: Escrow[];
	userAddress: string | null;
	getEscrowDossier: (escrowId: number) => Promise<EscrowDossier | null>;
	onReleaseFunds: (escrowId: number) => Promise<boolean>;
	onTriggerDispute: (escrowId: number) => Promise<boolean>;
	onOpenEvidenceModal: (escrowId: number) => void;
	onOpenResolveModal: (escrowId: number, totalAmount: bigint) => void;
}

export const DashboardGridView = ({
	escrows,
	userAddress,
	getEscrowDossier,
	onReleaseFunds,
	onTriggerDispute,
	onOpenEvidenceModal,
	onOpenResolveModal,
}: DashboardGridViewProps) => {
	const [activeTab, setActiveTab] = useState<
		"client" | "freelancer" | "arbiter"
	>("client");

	const filteredEscrows = escrows.filter((escrow) => {
		if (!userAddress) return false;
		const lowerUser = userAddress.toLowerCase();
		if (activeTab === "client")
			return escrow.client.toLowerCase() === lowerUser;
		if (activeTab === "freelancer")
			return escrow.freelancer.toLowerCase() === lowerUser;
		if (activeTab === "arbiter")
			return escrow.arbiter.toLowerCase() === lowerUser;
		return false;
	});

	return (
		<div className="space-y-6">
			<div className="flex border-b border-[#E4E4E7]">
				<button
					type="button"
					onClick={() => setActiveTab("client")}
					className={`px-4 py-2.5 text-xs font-semibold tracking-tight transition border-b-2 -mb-0.5 cursor-pointer ${
						activeTab === "client"
							? "border-black text-black"
							: "border-transparent text-[#71717A] hover:text-black"
					}`}
				>
					My Escrows (Client)
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("freelancer")}
					className={`px-4 py-2.5 text-xs font-semibold tracking-tight transition border-b-2 -mb-0.5 cursor-pointer ${
						activeTab === "freelancer"
							? "border-black text-black"
							: "border-transparent text-[#71717A] hover:text-black"
					}`}
				>
					My Work (Freelancer)
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("arbiter")}
					className={`px-4 py-2.5 text-xs font-semibold tracking-tight transition border-b-2 -mb-0.5 cursor-pointer ${
						activeTab === "arbiter"
							? "border-black text-black"
							: "border-transparent text-[#71717A] hover:text-black"
					}`}
				>
					My Arbitrations (Arbiter)
				</button>
			</div>

			{!userAddress ? (
				<div className="border border-[#E4E4E7] p-8 text-center bg-white rounded">
					<p className="text-xs text-[#71717A]">
						Connect your wallet to view active escrow agreements.
					</p>
				</div>
			) : filteredEscrows.length === 0 ? (
				<div className="border border-[#E4E4E7] p-8 text-center bg-white rounded">
					<p className="text-xs text-[#71717A]">
						No agreements found for this profile role.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{filteredEscrows.map((escrow) => (
						<EscrowCard
							key={escrow.id}
							escrow={escrow}
							userAddress={userAddress}
							getEscrowDossier={getEscrowDossier}
							onReleaseFunds={onReleaseFunds}
							onTriggerDispute={onTriggerDispute}
							onOpenEvidenceModal={onOpenEvidenceModal}
							onOpenResolveModal={onOpenResolveModal}
						/>
					))}
				</div>
			)}
		</div>
	);
};

interface EscrowCardProps {
	escrow: Escrow;
	userAddress: string | null;
	getEscrowDossier: (escrowId: number) => Promise<EscrowDossier | null>;
	onReleaseFunds: (escrowId: number) => Promise<boolean>;
	onTriggerDispute: (escrowId: number) => Promise<boolean>;
	onOpenEvidenceModal: (escrowId: number) => void;
	onOpenResolveModal: (escrowId: number, totalAmount: bigint) => void;
}

const EscrowCard = ({
	escrow,
	userAddress,
	getEscrowDossier,
	onReleaseFunds,
	onTriggerDispute,
	onOpenEvidenceModal,
	onOpenResolveModal,
}: EscrowCardProps) => {
	const [dossier, setDossier] = useState<EscrowDossier | null>(null);
	const [loadingDossier, setLoadingDossier] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [cardError, setCardError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		getEscrowDossier(escrow.id).then((data) => {
			if (active) {
				setDossier(data);
				setLoadingDossier(false);
			}
		});
		return () => {
			active = false;
		};
	}, [escrow.id, getEscrowDossier]);

	const handleRelease = async () => {
		setActionLoading(true);
		setCardError(null);
		const success = await onReleaseFunds(escrow.id);
		if (!success) {
			setCardError("Release transaction rejected or failed.");
		}
		setActionLoading(false);
	};

	const handleDispute = async () => {
		setActionLoading(true);
		setCardError(null);
		const success = await onTriggerDispute(escrow.id);
		if (!success) {
			setCardError("Dispute transaction rejected or failed.");
		}
		setActionLoading(false);
	};

	const formatAddress = (addr: string) => {
		return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
	};

	const getStatusBadgeClass = (status: EscrowStatus) => {
		const base =
			"text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border rounded-full ";
		if (status.tag === "Active")
			return `${base}bg-white text-black border-black`;
		if (status.tag === "Completed")
			return `${base}bg-[#F4F4F5] text-[#71717A] border-[#E4E4E7]`;
		if (status.tag === "Disputed")
			return `${base}bg-black text-white border-black`;
		return `${base}bg-[#F8FAFC] text-black border-[#E4E4E7]`;
	};

	const isClient = userAddress?.toLowerCase() === escrow.client.toLowerCase();
	const isFreelancer =
		userAddress?.toLowerCase() === escrow.freelancer.toLowerCase();
	const isArbiter = userAddress?.toLowerCase() === escrow.arbiter.toLowerCase();

	return (
		<div className="bg-white border border-[#E4E4E7] rounded p-6 flex flex-col justify-between shadow-xs">
			<div>
				<div className="flex items-start justify-between mb-4">
					<div className="flex flex-col">
						<span className="text-[10px] font-mono text-[#71717A] uppercase">
							Agreement #{escrow.id}
						</span>
						<h3 className="text-sm font-semibold tracking-tight text-black mt-1">
							{loadingDossier ? "Loading scope..." : dossier?.title}
						</h3>
					</div>
					<span className={getStatusBadgeClass(escrow.status)}>
						{escrow.status.tag}
					</span>
				</div>

				{cardError && (
					<div className="bg-zinc-50 border border-black p-2.5 text-[11px] font-mono text-black mb-4">
						{cardError}
					</div>
				)}

				<div className="text-xs text-[#71717A] mb-5 leading-relaxed line-clamp-3">
					{loadingDossier
						? "Retrieving metadata from secondary API..."
						: dossier?.description}
				</div>

				<div className="grid grid-cols-2 gap-4 border-t border-[#E4E4E7] pt-4 mb-4 text-[11px]">
					<div>
						<span className="text-[#71717A] block font-mono uppercase text-[9px] tracking-wider">
							Client
						</span>
						<CopyableAddress address={escrow.client} />
					</div>
					<div>
						<span className="text-[#71717A] block font-mono uppercase text-[9px] tracking-wider">
							Freelancer
						</span>
						<CopyableAddress address={escrow.freelancer} />
					</div>
					<div>
						<span className="text-[#71717A] block font-mono uppercase text-[9px] tracking-wider">
							Arbiter
						</span>
						<CopyableAddress address={escrow.arbiter} />
					</div>
					<div>
						<span className="text-[#71717A] block font-mono uppercase text-[9px] tracking-wider">
							Contract Token
						</span>
						<CopyableAddress address={escrow.token} />
					</div>
				</div>
			</div>

			<div className="border-t border-[#E4E4E7] pt-4 mt-auto flex items-center justify-between">
				<div className="flex flex-col">
					<span className="text-[9px] font-mono uppercase text-[#71717A] tracking-wider">
						Locked Funds
					</span>
					<span className="text-sm font-semibold font-mono text-black mt-0.5">
						{escrow.amount.toString()} SEP-41
					</span>
				</div>

				<div className="flex gap-2">
					{escrow.status.tag === "Active" && (
						<>
							{isClient && (
								<button
									type="button"
									onClick={handleRelease}
									disabled={actionLoading}
									className="text-xs font-semibold bg-black text-white hover:bg-zinc-900 transition px-3 py-1.5 rounded cursor-pointer disabled:opacity-50"
								>
									{actionLoading ? "Writing..." : "Release Funds"}
								</button>
							)}
							{(isClient || isFreelancer) && (
								<button
									type="button"
									onClick={handleDispute}
									disabled={actionLoading}
									className="text-xs font-semibold border border-black hover:bg-[#F4F4F5] text-black transition px-3 py-1.5 rounded cursor-pointer disabled:opacity-50"
								>
									{actionLoading ? "Writing..." : "Flag Dispute"}
								</button>
							)}
						</>
					)}

					{escrow.status.tag === "Disputed" && (
						<>
							{(isClient || isFreelancer) && (
								<button
									type="button"
									onClick={() => onOpenEvidenceModal(escrow.id)}
									className="text-xs font-semibold bg-black text-white hover:bg-zinc-900 transition px-3 py-1.5 rounded cursor-pointer"
								>
									Submit Evidence
								</button>
							)}
							{isArbiter && (
								<button
									type="button"
									onClick={() => onOpenResolveModal(escrow.id, escrow.amount)}
									className="text-xs font-semibold bg-black text-white hover:bg-zinc-900 transition px-3 py-1.5 rounded cursor-pointer"
								>
									Resolve Split
								</button>
							)}
						</>
					)}
				</div>
			</div>

			{dossier?.disputes && dossier.disputes.length > 0 && (
				<div className="mt-4 pt-4 border-t border-[#E4E4E7] bg-zinc-50 p-3 rounded">
					<span className="text-[9px] uppercase font-bold tracking-wider text-[#71717A] block mb-2">
						Dispute Dossier submissions ({dossier.disputes.length})
					</span>
					<div className="space-y-2.5 max-h-30 overflow-y-auto pr-1">
						{dossier.disputes.map((sub) => (
							<div
								key={`${sub.sender}-${sub.submitted_at}`}
								className="text-[10px] border-b border-[#E4E4E7] pb-2 last:border-0 last:pb-0"
							>
								<div className="flex justify-between text-[#71717A] font-mono mb-1">
									<span>{formatAddress(sub.sender)}</span>
									<span>{new Date(sub.submitted_at).toLocaleDateString()}</span>
								</div>
								<p className="text-black font-medium leading-normal italic">
									"{sub.statement}"
								</p>
								{sub.attachment_url && (
									<a
										href={sub.attachment_url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-[9px] text-[#71717A] underline block mt-1 hover:text-black"
									>
										View Attachment file
									</a>
								)}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
