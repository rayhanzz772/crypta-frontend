import { ShieldAlert, X } from "lucide-react";

const PasswordWarningModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-[calc(100vw-24px)] sm:max-w-md w-full p-4 sm:p-6 relative animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-3 sm:mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-white mb-3 sm:mb-4">
          Important Warning!
        </h2>

        {/* Content */}
        <div className="space-y-3 sm:space-y-4 text-gray-700 dark:text-gray-300">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <div>
                <p className="font-semibold text-red-900 dark:text-red-200 mb-1.5 sm:mb-2 text-sm sm:text-base">
                  Save Your Recovery Code Carefully
                </p>
                <p className="text-xs sm:text-sm text-red-800 dark:text-red-300">
                  If you forget your master password, you can reset it only
                  with your recovery code. If you lose that recovery code,
                  <strong> we cannot help you reset your password or restore access.</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
            <p className="font-medium text-gray-900 dark:text-white">
              Please ensure you:
            </p>
            <ul className="space-y-1.5 sm:space-y-2 ml-2 sm:ml-4">
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="text-primary-600 dark:text-primary-400 mt-0.5">
                  ✓
                </span>
                <span>
                  Save your recovery code somewhere secure before continuing
                </span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="text-primary-600 dark:text-primary-400 mt-0.5">
                  ✓
                </span>
                <span>
                  Keep your master password and recovery code in trusted secure locations
                </span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="text-primary-600 dark:text-primary-400 mt-0.5">
                  ✓
                </span>
                <span>Never share either one with anyone</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="text-primary-600 dark:text-primary-400 mt-0.5">
                  ✓
                </span>
                <span>Without the recovery code, password reset is not possible</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-sm sm:text-base"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg sm:rounded-xl transition-all font-medium text-sm sm:text-base"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordWarningModal;
