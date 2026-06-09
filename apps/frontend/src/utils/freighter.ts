export interface Freighter {
	isConnected: () => Promise<boolean>;
	getPublicKey: () => Promise<string>;
	signTransaction: (
		xdr: string,
		opts?: { network?: string; networkPassphrase?: string },
	) => Promise<string>;
}

declare global {
	interface Window {
		freighter?: Freighter;
	}
}

export const getFreighterWallet = (): Freighter | null => {
	if (typeof window !== "undefined" && window.freighter) {
		return window.freighter;
	}
	return null;
};

export const isFreighterInstalled = async (): Promise<boolean> => {
	const wallet = getFreighterWallet();
	if (!wallet) return false;
	try {
		return await wallet.isConnected();
	} catch {
		return false;
	}
};

export const getConnectedAddress = async (): Promise<string | null> => {
	const wallet = getFreighterWallet();
	if (!wallet) return null;
	try {
		const isConnected = await wallet.isConnected();
		if (!isConnected) return null;
		return await wallet.getPublicKey();
	} catch (err) {
		console.error("Failed to get public key from Freighter:", err);
		return null;
	}
};
