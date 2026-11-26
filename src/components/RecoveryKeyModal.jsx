import { useState } from "react";
import { Copy, Check, AlertTriangle, ShieldCheck } from "lucide-react";
import Modal from "./Modal";

const RecoveryKeyModal = ({ isOpen, recoveryKey, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      srTitle="Save Your Recovery Key"
      className="bg-white dark:bg-card gap-0 p-0 rounded-xl sm:rounded-xl border-0 shadow-xl overflow-hidden"
    >
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-bold text-center text-foreground mb-2">
            Save Your Recovery Key
          </h3>

          <div className="text-sm text-gray-600 dark:text-foreground mb-6 text-center">
            <p className="mb-2 font-medium text-destructive">
              This is the ONLY time you will see this key.
            </p>
            <p>
              If you forget your master password, this recovery key is the ONLY
              way to regain access to your data.
              <strong> Our servers cannot recover your password.</strong>
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-border mb-6 break-all relative group flex flex-col items-center justify-center">
            <p className="font-mono text-sm sm:text-base text-center text-gray-800 dark:text-gray-200 tracking-wider font-semibold">
              {recoveryKey}
            </p>
            <button
              onClick={handleCopy}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-white dark:bg-card rounded-md shadow-sm border border-input hover:bg-muted/50 dark:hover:bg-gray-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-green-600 dark:text-success">
                    Copied!
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy to clipboard</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gradient-to-br from-primary to-primary-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />I have saved my recovery key
          </button>
        </div>
    </Modal>
  );
};

export default RecoveryKeyModal;
