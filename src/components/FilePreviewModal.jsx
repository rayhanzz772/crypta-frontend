import { useEffect, useState } from "react";
import {
  X,
  Download,
  FileIcon,
  Maximize2,
  Minimize2,
  ShieldCheck,
} from "lucide-react";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      srTitle={file?.original_filename || "File Preview"}
      showCloseButton={false}
      className="p-0 gap-0 max-h-[95vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center">
            <FileIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
              {file?.original_filename || "File Preview"}
            </h2>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 font-medium uppercase tracking-wide"
              >
                {file?.mime_type}
              </Badge>
              <Badge
                variant="secondary"
                className="gap-1 text-[10px] px-1.5 py-0 text-success bg-success/10 font-medium"
              >
                <ShieldCheck className="w-3 h-3" />
                Encrypted
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onDownload}
            className="text-muted-foreground hover:text-primary"
            title="Download"
            aria-label="Download"
          >
            <Download className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-muted/50 dark:bg-background/40 flex items-center justify-center p-4">
        {!blobUrl ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <div>
              <p className="text-foreground font-semibold mb-1">
                Decrypting Content
              </p>
              <p className="text-muted-foreground text-sm">
                Processing security layer locally...
              </p>
            </div>
          </div>
        ) : isImage ? (
          <div className="relative group max-w-full max-h-full">
            <img
              src={blobUrl}
              alt={file?.original_filename}
              className={`max-w-full max-h-[75vh] rounded-xl shadow-elev border border-border transition-all duration-500 ease-out ${
                isZoomed
                  ? "scale-125 cursor-zoom-out"
                  : "scale-100 cursor-zoom-in"
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => setIsZoomed(!isZoomed)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={isZoomed ? "Zoom out" : "Zoom in"}
              >
                {isZoomed ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        ) : isPdf ? (
          <iframe
            src={blobUrl}
            title="PDF Preview"
            className="w-full h-full min-h-[75vh] rounded-xl border-0 shadow-elev bg-white"
          />
        ) : (
          <div className="text-center p-8 max-w-md">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileIcon className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Preview not available
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              We can't preview this file type yet. You can download it to view it
              with your local applications.
            </p>
            <Button onClick={onDownload} className="w-full rounded-xl font-semibold">
              <Download />
              Download to View
            </Button>
          </div>
        )}
      </div>

      {/* Security Banner */}
      <div className="hidden sm:block shrink-0 px-4 py-2.5 bg-card border-t border-border text-center">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2 font-bold">
          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
          AES-256 decrypted preview • Locally processed • Temporary session key
        </p>
      </div>
    </Modal>
  );
};

export default FilePreviewModal;
