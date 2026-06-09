import { useState } from "react";
import { Header } from "@/components/Header";
import { useBackendApi } from "@/hooks/useBackendApi";
import { useEscrowContract } from "@/hooks/useEscrowContract";
import { CreateEscrowView } from "@/views/CreateEscrowView";
import { DashboardGridView } from "@/views/DashboardGridView";
import { DisputeEvidenceModal } from "@/views/DisputeEvidenceModal";
import { ResolveDisputeModal } from "@/views/ResolveDisputeModal";

function App() {
	const {
		walletInstalled,
		userAddress,
		isSimulated,
		loading: contractLoading,
		error: contractError,
		escrows,
		connectWallet,
		disconnectWallet,
		createEscrowOnChain,
		releaseFundsOnChain,
		triggerDisputeOnChain,
		resolveDisputeOnChain,
		refreshEscrows,
		setError: setContractError,
	} = useEscrowContract();

	const {
		loading: apiLoading,
		error: apiError,
		saveEscrowMetadata,
		submitDisputeEvidence,
		getEscrowDossier,
		setError: setApiError,
	} = useBackendApi();

	const [evidenceEscrowId, setEvidenceEscrowId] = useState<number | null>(null);
	const [resolveEscrowId, setResolveEscrowId] = useState<number | null>(null);
	const [resolveTotalAmount, setResolveTotalAmount] = useState<bigint>(0n);

	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const triggerNotification = (type: "success" | "error", message: string) => {
		setNotification({ type, message });
		setTimeout(() => setNotification(null), 5000);
	};

	const handleCreateEscrow = async (args: {
		title: string;
		description: string;
		freelancer: string;
		arbiter: string;
		token: string;
		amount: bigint;
	}): Promise<boolean> => {
		setContractError(null);
		setApiError(null);

		const escrowId = await createEscrowOnChain(
			args.freelancer,
			args.arbiter,
			args.token,
			args.amount,
		);

		if (escrowId === null) {
			triggerNotification("error", "Failed to record escrow on-chain.");
			return false;
		}

		const metadataSaved = await saveEscrowMetadata(
			escrowId,
			args.title,
			args.description,
			userAddress || "",
		);

		if (metadataSaved) {
			triggerNotification(
				"success",
				`Escrow #${escrowId} created and metadata synchronized.`,
			);
			refreshEscrows();
			return true;
		} else {
			triggerNotification(
				"error",
				`Escrow #${escrowId} created but metadata sync failed.`,
			);
			return true;
		}
	};

	const handleReleaseFunds = async (escrowId: number): Promise<boolean> => {
		const success = await releaseFundsOnChain(escrowId);
		if (success) {
			triggerNotification("success", `Funds released for Escrow #${escrowId}.`);
		} else {
			triggerNotification(
				"error",
				`Failed to release funds for Escrow #${escrowId}.`,
			);
		}
		return success;
	};

	const handleTriggerDispute = async (escrowId: number): Promise<boolean> => {
		const success = await triggerDisputeOnChain(escrowId);
		if (success) {
			triggerNotification(
				"success",
				`Dispute registered for Escrow #${escrowId}.`,
			);
		} else {
			triggerNotification(
				"error",
				`Failed to flag dispute for Escrow #${escrowId}.`,
			);
		}
		return success;
	};

	const handleResolveDispute = async (
		escrowId: number,
		freelancerShare: bigint,
	): Promise<boolean> => {
		const success = await resolveDisputeOnChain(escrowId, freelancerShare);
		if (success) {
			triggerNotification(
				"success",
				`Dispute resolved for Escrow #${escrowId}.`,
			);
		} else {
			triggerNotification(
				"error",
				`Failed to resolve dispute for Escrow #${escrowId}.`,
			);
		}
		return success;
	};

	const handleOpenEvidenceModal = (escrowId: number) => {
		setEvidenceEscrowId(escrowId);
	};

	const handleOpenResolveModal = (escrowId: number, totalAmount: bigint) => {
		setResolveEscrowId(escrowId);
		setResolveTotalAmount(totalAmount);
	};

	const combinedError = contractError || apiError;

	return (
		<div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
			<Header
				userAddress={userAddress}
				isSimulated={isSimulated}
				walletInstalled={walletInstalled}
				onConnect={connectWallet}
				onDisconnect={disconnectWallet}
			/>

			<main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
				<div className="flex flex-col space-y-2">
					<h1 className="text-3xl font-bold tracking-tight text-black">
						Secure Digital Handshake
					</h1>
					<p className="text-sm text-[#71717A] max-w-2xl leading-relaxed">
						Deploy decentralized, multi-actor escrows. Client funds are locked
						securely within the Soroban ledger environment, with optional
						arbitration for active dispute resolution.
					</p>
				</div>

				{notification && (
					<div
						className={`border p-4 text-xs font-mono rounded ${
							notification.type === "success"
								? "bg-zinc-50 border-black text-black"
								: "bg-zinc-50 border-black text-black font-semibold"
						}`}
					>
						{notification.message}
					</div>
				)}

				{combinedError && (
					<div className="bg-zinc-50 border border-black p-4 text-xs font-mono text-black">
						<span className="font-semibold block mb-1">
							Operational Exception:
						</span>
						{combinedError}
					</div>
				)}

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
					<div className="lg:col-span-4 space-y-6">
						<div className="sticky top-24">
							<CreateEscrowView
								userAddress={userAddress}
								isSimulated={isSimulated}
								walletInstalled={walletInstalled}
								onCreateEscrow={handleCreateEscrow}
								loading={contractLoading || apiLoading}
							/>
						</div>
					</div>

					<div className="lg:col-span-8 space-y-6">
						<DashboardGridView
							escrows={escrows}
							userAddress={userAddress}
							getEscrowDossier={getEscrowDossier}
							onReleaseFunds={handleReleaseFunds}
							onTriggerDispute={handleTriggerDispute}
							onOpenEvidenceModal={handleOpenEvidenceModal}
							onOpenResolveModal={handleOpenResolveModal}
						/>
					</div>
				</div>
			</main>

			{evidenceEscrowId !== null && (
				<DisputeEvidenceModal
					escrowId={evidenceEscrowId}
					userAddress={userAddress}
					onSubmitEvidence={submitDisputeEvidence}
					onClose={() => setEvidenceEscrowId(null)}
				/>
			)}

			{resolveEscrowId !== null && (
				<ResolveDisputeModal
					escrowId={resolveEscrowId}
					totalAmount={resolveTotalAmount}
					onResolveDispute={handleResolveDispute}
					onClose={() => setResolveEscrowId(null)}
				/>
			)}
		</div>
	);
}

export default App;
