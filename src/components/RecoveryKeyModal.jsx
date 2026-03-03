import { useState } from "react";
import { Copy, Check, AlertTriangle, ShieldCheck } from "lucide-react";

const RecoveryKeyModal = ({ isOpen, recoveryKey, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Save Your Recovery Key
          </h3>

          <div className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-center">
            <p className="mb-2 font-medium text-red-600 dark:text-red-400">
              This is the ONLY time you will see this key.
            </p>
            <p>
              If you forget your master password, this recovery key is the ONLY
              way to regain access to your data.
              <strong> Our servers cannot recover your password.</strong>
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-6 break-all relative group flex flex-col items-center justify-center">
            <p className="font-mono text-sm sm:text-base text-center text-gray-800 dark:text-gray-200 tracking-wider font-semibold">
              {recoveryKey}
            </p>
            <button
              onClick={handleCopy}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-500">
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
            className="w-full py-3 px-4 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-semibold shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />I have saved my recovery key
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecoveryKeyModal;
