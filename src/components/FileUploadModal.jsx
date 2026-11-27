import { useState, useRef } from "react";
import { X, UploadCloud, Loader2, FileIcon } from "lucide-react";
import toast from "react-hot-toast";
import { filesAPI } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";

const FileUploadModal = ({ isOpen, onClose, onSuccess, folderId = "" }) => {
  const { mek } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!mek) {
      toast.error("Vault is locked. Cannot upload encrypted files.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (folderId) {
        formData.append("folder_id", folderId);
      }
      formData.append("mek", mek);

      await filesAPI.uploadFile(formData);
      toast.success("File uploaded securely");

      setFile(null);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      srTitle="Upload File"
      showCloseButton={false}
      className="p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center">
            <UploadCloud className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              Upload File
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              Encrypted before it leaves your browser
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          disabled={loading}
          className="shrink-0 text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Form */}
      <form
        id="file-upload-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
      >
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-14 h-14 mx-auto mb-4 bg-muted rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <UploadCloud className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Click or drag file to upload
            </h3>
            <p className="text-xs text-muted-foreground">
              File will be encrypted with AES-256-GCM before storage
            </p>
          </div>
        ) : (
          <div className="bg-muted/50 dark:bg-background/60 rounded-lg p-3 flex items-center gap-3 border border-border">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
              <FileIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setFile(null)}
              disabled={loading}
              className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </form>

      {/* Footer */}
      <div className="shrink-0 flex flex-col sm:flex-row gap-2.5 p-4 sm:px-6 pt-3 border-t border-border bg-card">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={loading}
          className="order-2 sm:order-1 flex-1 rounded-xl font-semibold"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="file-upload-form"
          disabled={!file || loading}
          className="order-1 sm:order-2 flex-1 rounded-xl font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadCloud />
              Upload Securely
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default FileUploadModal;
