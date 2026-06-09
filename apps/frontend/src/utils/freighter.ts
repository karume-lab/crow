import {
	isConnected as apiIsConnected,
	requestAccess as apiRequestAccess,
	signTransaction as apiSignTransaction,
} from "@stellar/freighter-api";

export interface Freighter {
	isConnected: () => Promise<boolean>;
	getPublicKey: () => Promise<string>;
	signTransaction: (
		xdr: string,
		opts?: { network?: string; networkPassphrase?: string },
	) => Promise<string>;
}

export const isFreighterInstalled = async (): Promise<boolean> => {
	const res = await apiIsConnected();
	return res.isConnected;
};

export const getConnectedAddress = async (): Promise<string | null> => {
	try {
		const installed = await isFreighterInstalled();
		if (!installed) return null;

		const res = await apiRequestAccess();
		if (res.error) {
			console.error("Freighter access error:", res.error);
			return null;
		}
		return res.address || null;
	} catch (err) {
		console.error("Failed to get public key from Freighter:", err);
		return null;
	}
};

export const getFreighterWallet = (): Freighter | null => {
	return {
		isConnected: async () => {
			const res = await apiIsConnected();
			return res.isConnected;
		},
		getPublicKey: async () => {
			const res = await apiRequestAccess();
			if (res.error) throw new Error(res.error);
			return res.address;
		},
		signTransaction: async (xdr: string, opts?: { network?: string; networkPassphrase?: string }) => {
			const res = await apiSignTransaction(xdr, { networkPassphrase: opts?.networkPassphrase });
			if (res.error) throw new Error(res.error);
			return res.signedTxXdr;
		},
	};
};
