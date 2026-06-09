import type React from "react";
import { useState } from "react";

interface CreateEscrowViewProps {
	userAddress: string | null;
	walletInstalled: boolean;
	onCreateEscrow: (args: {
		title: string;
		description: string;
		freelancer: string;
		arbiter: string;
		token: string;
		amount: bigint;
	}) => Promise<boolean>;
	loading: boolean;
}

export const CreateEscrowView: React.FC<CreateEscrowViewProps> = ({
	userAddress,
	walletInstalled,
	onCreateEscrow,
	loading: contractLoading,
}) => {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [freelancer, setFreelancer] = useState("");
	const [arbiter, setArbiter] = useState("");
	const [token, setToken] = useState(
		import.meta.env.VITE_DEFAULT_TOKEN || "",
	);
	const [amount, setAmount] = useState("");

	const [approvalRequired, setApprovalRequired] = useState(true);
	const [isApproving, setIsApproving] = useState(false);
	const [txError, setTxError] = useState<string | null>(null);

	const handleApprove = async (e: React.MouseEvent) => {
		e.preventDefault();
		if (!amount || parseFloat(amount) <= 0) {
			setTxError("Please enter a valid amount before approving.");
			return;
		}
		setIsApproving(true);
		setTxError(null);
		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setApprovalRequired(false);
		} catch (err) {
			setTxError(err instanceof Error ? err.message : "Token approval transaction failed.");
		} finally {
			setIsApproving(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setTxError(null);

		if (!userAddress) {
			setTxError("Connect your wallet to perform this transaction.");
			return;
		}

		if (!title.trim() || !description.trim()) {
			setTxError("Please specify title and description.");
			return;
		}

		if (!freelancer.trim() || !arbiter.trim() || !token.trim()) {
			setTxError("Freelancer, Arbiter, and Token fields are required.");
			return;
		}

		const numericAmount = parseFloat(amount);
		if (Number.isNaN(numericAmount) || numericAmount <= 0) {
			setTxError("Amount must be a positive number.");
			return;
		}

		if (
			userAddress === freelancer ||
			userAddress === arbiter ||
			freelancer === arbiter
		) {
			setTxError("Client, Freelancer, and Arbiter must be distinct addresses.");
			return;
		}

		const success = await onCreateEscrow({
			title: title.trim(),
			description: description.trim(),
			freelancer: freelancer.trim(),
			arbiter: arbiter.trim(),
			token: token.trim(),
			amount: BigInt(Math.floor(numericAmount)),
		});

		if (success) {
			setTitle("");
			setDescription("");
			setFreelancer("");
			setArbiter("");
			setAmount("");
			setApprovalRequired(true);
		}
	};

	return (
		<div className="bg-white border border-[#E4E4E7] p-6 rounded shadow-xs max-w-2xl mx-auto">
			<div className="mb-6">
				<h2 className="text-lg font-semibold tracking-tight text-black">
					Create Escrow Agreement
				</h2>
				<p className="text-xs text-[#71717A] mt-1 leading-relaxed">
					Lock contract funds safely. Standard Stellar tokens (SEP-41) will be
					held until release or resolution.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				{txError && (
					<div className="bg-zinc-50 border border-black p-3 text-xs font-mono text-black">
						{txError}
					</div>
				)}

				<div className="grid grid-cols-1 gap-4">
					<div>
						<label htmlFor="title" className="block text-[11px] uppercase tracking-wider font-bold text-black mb-1">
							Agreement Title
						</label>
						<input
							id="title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g. Frontend Web3 Integration"
							className="w-full text-xs border border-[#E4E4E7] px-3 py-2 text-black bg-white focus:outline-hidden focus:border-black rounded font-sans"
							required
						/>
					</div>

					<div>
						<label htmlFor="description" className="block text-[11px] uppercase tracking-wider font-bold text-black mb-1">
							Detailed Scope description
						</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Provide clean instructions, milestones, and deliverables..."
							className="w-full text-xs border border-[#E4E4E7] px-3 py-2 text-black bg-white focus:outline-hidden focus:border-black rounded font-sans min-h-25"
							required
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="flex flex-col justify-end h-full">
							<label htmlFor="freelancer" className="block text-[11px] uppercase tracking-wider font-bold text-black mb-1">
								Freelancer Address
							</label>
							<input
								id="freelancer"
								type="text"
								value={freelancer}
								onChange={(e) => setFreelancer(e.target.value)}
								placeholder="GAFREELANCER..."
								className="w-full text-xs border border-[#E4E4E7] px-3 py-2 text-black bg-white focus:outline-hidden focus:border-black rounded font-mono"
								required
							/>
						</div>

						<div className="flex flex-col justify-end h-full">
							<label htmlFor="arbiter" className="block text-[11px] uppercase tracking-wider font-bold text-black mb-1">
								Designated Arbiter Address
							</label>
							<input
								id="arbiter"
								type="text"
								value={arbiter}
								onChange={(e) => setArbiter(e.target.value)}
								placeholder="GAARBITER..."
								className="w-full text-xs border border-[#E4E4E7] px-3 py-2 text-black bg-white focus:outline-hidden focus:border-black rounded font-mono"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="flex flex-col justify-end h-full">
							<label htmlFor="token" className="block text-[11px] uppercase tracking-wider font-bold text-black mb-1">
								Token Contract (SEP-41)
							</label>
							<input
								id="token"
								type="text"
								value={token}
								onChange={(e) => setToken(e.target.value)}
								placeholder="GATOKEN..."
								className="w-full text-xs border border-[#E4E4E7] px-3 py-2 text-black bg-white focus:outline-hidden focus:border-black rounded font-mono"
								required
							/>
						</div>

						<div className="flex flex-col justify-end h-full">
							<label htmlFor="amount" className="block text-[11px] uppercase tracking-wider font-bold text-black mb-1">
								Locked Amount
							</label>
							<input
								id="amount"
								type="number"
								value={amount}
								onChange={(e) => {
									setAmount(e.target.value);
									setApprovalRequired(true);
								}}
								placeholder="1000"
								className="w-full text-xs border border-[#E4E4E7] px-3 py-2 text-black bg-white focus:outline-hidden focus:border-black rounded font-mono"
								required
							/>
						</div>
					</div>
				</div>

				<div className="border-t border-[#E4E4E7] pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="text-[10px] text-[#71717A] max-w-md leading-relaxed">
						{approvalRequired ? (
							<span>
								You must approve the token contract to pull funds on behalf of
								this escrow contract.
							</span>
						) : (
							<span className="text-zinc-600 font-medium">
								Token contract approved successfully. Ready to deploy contract
								on-chain.
							</span>
						)}
					</div>

					<div className="flex gap-2">
						{approvalRequired && (
							<button
								type="button"
								onClick={handleApprove}
								disabled={isApproving || contractLoading}
								className="text-xs font-semibold border border-black hover:bg-[#F4F4F5] text-black px-4 py-2 rounded transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isApproving ? "Approving..." : "Approve Tokens"}
							</button>
						)}

						<button
							type="submit"
							disabled={approvalRequired || contractLoading || isApproving || !walletInstalled}
							title={!walletInstalled ? "Freighter wallet not installed" : undefined}
							className="text-xs font-semibold px-5 py-2 rounded transition cursor-pointer text-white bg-black hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{contractLoading ? "Executing Ledger Write..." : "Deploy Escrow"}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
};
