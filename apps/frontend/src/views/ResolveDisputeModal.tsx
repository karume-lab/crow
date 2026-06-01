import { useState } from 'react';

interface ResolveDisputeModalProps {
  escrowId: number;
  totalAmount: bigint;
  onResolveDispute: (escrowId: number, freelancerShare: bigint) => Promise<boolean>;
  onClose: () => void;
}

export const ResolveDisputeModal = ({
  escrowId,
  totalAmount,
  onResolveDispute,
  onClose,
}: ResolveDisputeModalProps) => {
  const [freelancerShare, setFreelancerShare] = useState<string>(
    (totalAmount / 2n).toString()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNumber = Number(totalAmount);
  const freelancerShareNum = Number(freelancerShare) || 0;
  const clientRemainder = Math.max(0, amountNumber - freelancerShareNum);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFreelancerShare(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setFreelancerShare('');
      return;
    }
    const num = parseInt(val, 10);
    if (!Number.isNaN(num) && num >= 0 && num <= amountNumber) {
      setFreelancerShare(num.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const shareBigInt = BigInt(freelancerShareNum);
    if (shareBigInt < 0n || shareBigInt > totalAmount) {
      setError('Freelancer share must be between 0 and the total locked amount.');
      return;
    }

    setLoading(true);
    setError(null);
    const success = await onResolveDispute(escrowId, shareBigInt);
    setLoading(false);

    if (success) {
      onClose();
    } else {
      setError('Resolution transaction failed. Make sure you are the designated Arbiter.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#E4E4E7] max-w-md w-full p-6 shadow-lg rounded">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-black tracking-tight">
            Resolve Dispute (Escrow #{escrowId})
          </h3>
          <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
            As the designated neutral Arbiter, divide the locked funds between the Freelancer and the Client.
          </p>
        </div>

        {error && (
          <div className="bg-zinc-50 border border-black p-2.5 text-xs font-mono text-black mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex justify-between text-[11px] uppercase tracking-wider font-bold text-black mb-2">
              <span>Resolution Split</span>
              <span className="font-mono text-xs">{amountNumber} Total</span>
            </div>

            <div className="bg-zinc-50 border border-[#E4E4E7] p-4 rounded space-y-4">
              <div className="flex justify-between text-xs font-mono">
                <div>
                  <span className="text-[#71717A] block text-[9px] uppercase tracking-wider">Freelancer gets</span>
                  <span className="text-black font-semibold text-sm">{freelancerShareNum} SEP-41</span>
                </div>
                <div className="text-right">
                  <span className="text-[#71717A] block text-[9px] uppercase tracking-wider">Client gets</span>
                  <span className="text-black font-semibold text-sm">{clientRemainder} SEP-41</span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max={amountNumber}
                value={freelancerShareNum}
                onChange={handleSliderChange}
                className="w-full accent-black cursor-pointer h-1 bg-zinc-200 rounded-lg appearance-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="numerical-share-input" className="block text-[11px] uppercase tracking-wider font-bold text-black mb-1">
              Freelancer Share (Numerical)
            </label>
            <input
              id="numerical-share-input"
              type="number"
              min="0"
              max={amountNumber}
              value={freelancerShare}
              onChange={handleInputChange}
              placeholder="0"
              className="w-full text-xs border border-[#E4E4E7] px-3 py-2 text-black bg-white focus:outline-hidden focus:border-black rounded font-mono"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#E4E4E7]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-xs font-semibold border border-[#E4E4E7] px-4 py-2 hover:bg-[#F4F4F5] transition text-black rounded cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || freelancerShare === ''}
              className="text-xs font-semibold bg-black text-white hover:bg-zinc-900 transition px-4 py-2 rounded cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Executing Settlement...' : 'Authorize Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
