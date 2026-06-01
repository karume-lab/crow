import { useRef, useState } from 'react';

interface DisputeEvidenceModalProps {
  escrowId: number;
  userAddress: string | null;
  onSubmitEvidence: (
    escrowId: number,
    senderAddress: string,
    statement: string,
    file?: File
  ) => Promise<string | null>;
  onClose: () => void;
}

export const DisputeEvidenceModal = ({
  escrowId,
  userAddress,
  onSubmitEvidence,
  onClose,
}: DisputeEvidenceModalProps) => {
  const [statement, setStatement] = useState('');
  const [file, setFile] = useState<File | undefined>(undefined);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAddress) {
      setError('Please connect your wallet.');
      return;
    }
    if (!statement.trim()) {
      setError('Please provide a statement explaining the dispute.');
      return;
    }

    setLoading(true);
    setError(null);

    const attachmentUrl = await onSubmitEvidence(
      escrowId,
      userAddress,
      statement.trim(),
      file
    );

    setLoading(false);

    if (attachmentUrl !== null) {
      onClose();
    } else {
      setError('Failed to upload evidence. Verify connection to backend API.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#E4E4E7] max-w-lg w-full p-6 shadow-lg rounded">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-black tracking-tight">
            Submit Dispute Evidence (Escrow #{escrowId})
          </h3>
          <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
            Provide a written statement and optional attachments. The arbiter will review this folder before deciding the split.
          </p>
        </div>

        {error && (
          <div className="bg-zinc-50 border border-black p-2.5 text-xs font-mono text-black mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="statement-input" className="block text-[11px] uppercase tracking-wider font-bold text-black mb-1">
              Written Statement
            </label>
            <textarea
              id="statement-input"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Detail your work completed, milestones achieved, or issues encountered..."
              className="w-full text-xs border border-[#E4E4E7] px-3 py-2 text-black bg-white focus:outline-hidden focus:border-black rounded font-sans min-h-25"
              required
            />
          </div>

          <div>
            <label htmlFor="file-input" className="block text-[11px] uppercase tracking-wider font-bold text-black mb-1">
              File Attachment (Optional, Max 10MB)
            </label>
            <button
              type="button"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border border-dashed rounded p-6 text-center cursor-pointer transition ${
                dragActive ? 'border-black bg-zinc-50' : 'border-[#E4E4E7] hover:border-black'
              }`}
            >
              <input
                ref={fileInputRef}
                id="file-input"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.zip,.txt"
              />
              <span className="text-xs font-medium text-black block">
                {file ? file.name : 'Click or Drag & Drop to upload evidence file'}
              </span>
              <span className="text-[10px] text-[#71717A] block mt-1">
                Supports PDF, PNG, JPG, ZIP, TXT
              </span>
            </button>
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
              disabled={loading}
              className="text-xs font-semibold bg-black text-white hover:bg-zinc-900 transition px-4 py-2 rounded cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Evidence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
