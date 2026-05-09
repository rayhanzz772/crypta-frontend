import { useEffect, useState } from "react";
import {
  X,
  Download,
  Loader2,
  FileIcon,
  Maximize2,
  Minimize2,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Portal from "./Portal";

const FilePreviewModal = ({ isOpen, onClose, file, blobUrl, onDownload }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    // Prevent scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setIsZoomed(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isImage = file?.mime_type?.startsWith("image/");
  const isPdf = file?.mime_type?.startsWith("application/pdf");

  return (
    <Portal>
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl max-h-[95vh] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                  <FileIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm sm:text-base">
                    {file?.original_filename || "File Preview"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-700 py-0.5 px-1.5 rounded">
                      {file?.mime_type}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20 py-0.5 px-1.5 rounded uppercase tracking-tighter">
                      <ShieldCheck className="w-3 h-3" />
                      Encrypted
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={onDownload}
                  className="p-2 sm:p-2.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 sm:p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900/40 relative flex items-center justify-center p-4">
              {!blobUrl ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                  <div>
                    <p className="text-slate-700 dark:text-white font-bold text-lg mb-1">
                      Decrypting Content
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Processing security layer locally...
                    </p>
                  </div>
                </div>
              ) : isImage ? (
                <div className="relative group max-w-full max-h-full">
                  <img
                    src={blobUrl}
                    alt={file?.original_filename}
                    className={`max-w-full max-h-[75vh] rounded-xl shadow-2xl transition-all duration-500 ease-out border border-white/10 ring-1 ring-black/5 ${
                      isZoomed
                        ? "scale-125 cursor-zoom-out"
                        : "scale-100 cursor-zoom-in"
                    }`}
                    onClick={() => setIsZoomed(!isZoomed)}
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => setIsZoomed(!isZoomed)}
                      className="p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all shadow-lg border border-white/10"
                    >
                      {isZoomed ? (
                        <Minimize2 className="w-5 h-5" />
                      ) : (
                        <Maximize2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              ) : isPdf ? (
                <iframe
                  src={blobUrl}
                  title="PDF Preview"
                  className="w-full h-full min-h-[75vh] rounded-xl border-0 shadow-2xl bg-white"
                />
              ) : (
                <div className="text-center p-8 max-w-md">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12 group-hover:rotate-0 transition-transform">
                    <FileIcon className="w-12 h-12 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    Preview not available
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    We can't preview this file type yet. You can download it to
                    view it with your local applications.
                  </p>
                  <button
                    onClick={onDownload}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3"
                  >
                    <Download className="w-5 h-5" />
                    Download to View
                  </button>
                </div>
              )}
            </div>

            {/* Security Banner */}
            <div className="hidden sm:block p-3 bg-white dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 text-center backdrop-blur-md">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2 font-bold">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                AES-256 decrypted preview • Locally processed • Temporary
                session key
              </p>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </Portal>
  );
};

export default FilePreviewModal;
