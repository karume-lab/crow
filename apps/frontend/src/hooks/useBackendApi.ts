import { useCallback, useState } from "react";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export interface EscrowMetadata {
	escrow_id: number;
	title: string;
	description: string;
	client_address: string;
	created_at: string;
}

export interface DisputeSubmission {
	sender: string;
	statement: string;
	attachment_url: string | null;
	submitted_at: string;
}

export interface DisputeDossier {
	escrow_id: number;
	dispute_status: "none" | "open";
	submissions: DisputeSubmission[];
}

export interface EscrowDossier {
	id: number;
	title: string;
	description: string;
	clientAddress: string;
	createdAt: string | null;
	disputes: DisputeSubmission[];
	disputeStatus: "none" | "open";
}

export function useBackendApi() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const saveEscrowMetadata = useCallback(
		async (
			escrowId: number,
			title: string,
			description: string,
			clientAddress: string,
		): Promise<boolean> => {
			setLoading(true);
			setError(null);
			try {
				const response = await fetch(
					`${API_BASE_URL}/escrows/${escrowId}/metadata`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							title,
							description,
							client_address: clientAddress,
						}),
					},
				);

				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					throw new Error(
						errData.error ||
							`Failed to save metadata (Status ${response.status})`,
					);
				}
				return true;
			} catch (err: any) {
				setError(err.message || "Failed to save escrow metadata");
				return false;
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const submitDisputeEvidence = useCallback(
		async (
			escrowId: number,
			senderAddress: string,
			statement: string,
			file?: File,
		): Promise<string | null> => {
			setLoading(true);
			setError(null);
			try {
				const formData = new FormData();
				formData.append("sender_address", senderAddress);
				formData.append("statement", statement);
				if (file) {
					formData.append("file", file);
				}

				const response = await fetch(
					`${API_BASE_URL}/escrows/${escrowId}/dispute-evidence`,
					{
						method: "POST",
						body: formData,
					},
				);

				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					throw new Error(
						errData.error ||
							`Failed to submit evidence (Status ${response.status})`,
					);
				}

				const data = await response.json();
				return data.attachment_url || "";
			} catch (err: any) {
				setError(err.message || "Failed to submit dispute evidence");
				return null;
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const getEscrowDossier = useCallback(
		async (escrowId: number): Promise<EscrowDossier | null> => {
			setLoading(true);
			setError(null);
			try {
				const metaRes = await fetch(
					`${API_BASE_URL}/escrows/${escrowId}/metadata`,
				);
				let metadata: EscrowMetadata | null = null;
				if (metaRes.ok) {
					metadata = await metaRes.json();
				}

				const dispRes = await fetch(
					`${API_BASE_URL}/escrows/${escrowId}/disputes`,
				);
				let disputesData: DisputeDossier | null = null;
				if (dispRes.ok) {
					disputesData = await dispRes.json();
				}

				return {
					id: escrowId,
					title: metadata?.title || `Escrow #${escrowId}`,
					description: metadata?.description || "No description provided.",
					clientAddress: metadata?.client_address || "",
					createdAt: metadata?.created_at || null,
					disputes: disputesData?.submissions || [],
					disputeStatus: disputesData?.dispute_status || "none",
				};
			} catch (err: any) {
				setError(err.message || "Failed to retrieve escrow dossier");
				return null;
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	return {
		loading,
		error,
		saveEscrowMetadata,
		submitDisputeEvidence,
		getEscrowDossier,
		setError,
	};
}
