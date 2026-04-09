import { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import {
  ArrowLeft,
  UploadCloud,
  FileIcon,
  Loader2,
  Download,
  Trash2,
  Lock,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { filesAPI } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import FileUploadModal from "../components/FileUploadModal";

const FolderDetail = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { searchQuery = "" } = useOutletContext();

  const { mek } = useAuth();

  const [folder, setFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchFolderData = async () => {
    setLoading(true);
    try {
      const response = await filesAPI.openFolder(folderId);
      setFolder(response.data.folder);
      setFiles(response.data.files || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load folder contents",
      );
      console.error(error);
      navigate("/app/files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (folderId) {
      fetchFolderData();
    }
  }, [folderId]);

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownloadFile = async (file) => {
    if (!mek) {
      toast.error("Vault must be unlocked to download files");
      return;
    }
    setDownloading(file.id);
    try {
      const response = await filesAPI.downloadFile(file.id, mek);
      const filename = file.original_filename || "downloaded-file";
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to download file");
    } finally {
      setDownloading(null);
    }
  };

  const handleDeleteFile = async (file) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${file.original_filename}"?`,
      )
    )
      return;
    setDeleting(file.id);
    try {
      await filesAPI.deleteFile(file.id);
      toast.success("File deleted");
      fetchFolderData();
    } catch (error) {
      toast.error("Failed to delete file");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownloadFolder = async () => {
    if (!mek) {
      toast.error("Vault must be unlocked to download folders");
      return;
    }
    setDownloading(folderId);
    try {
      const response = await filesAPI.downloadFolder(folderId, mek);
      const missingCount = response.headers["x-missing-files"];
      if (missingCount && parseInt(missingCount, 10) > 0) {
        toast.error(`Warning: ${missingCount} files were missing in storage`, {
          duration: 5000,
        });
      }
      const filename = `${folder?.name || "folder"}.zip`;
      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to download folder");
    } finally {
      setDownloading(null);
    }
  };

  const isVaultLocked = !mek;

  if (isVaultLocked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
            Folder Access Locked
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Access to this folder is protected. Please unlock your vault with
            your master password to view its contents.
          </p>

          <button
            onClick={() => navigate("/app/files")}
            className="mb-8 flex items-center justify-center gap-2 mx-auto text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Storage
          </button>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              💡 Tip: Click the "Unlock Vault" button in the sidebar to enter
              your master password.
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                Folder is Encrypted
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AES-256-GCM protection active
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Decrypting files..
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation / Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/app/files")}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <img
                src="/folder_icon.png"
                alt="Folder"
                className="w-6 h-6 object-contain"
              />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {folder?.name}
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {files.length} items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleDownloadFolder}
            disabled={downloading === folderId}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm text-sm font-medium disabled:opacity-50"
          >
            {downloading === folderId ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Zip
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl rounded-xl transition-all text-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Here
          </button>
        </div>
      </div>

      {/* Files Section */}
      <div>
        {files.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center rounded-full">
              <UploadCloud className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-slate-700 dark:text-slate-300 font-medium text-lg">
              Folder is empty
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Securely upload files into this folder. They will be encrypted
              before storage.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-sm font-medium transition-colors"
            >
              Upload First File
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Size</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold text-right">Date</th>
                    <th className="px-6 py-4 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {files
                    .filter((f) =>
                      f.original_filename
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                    )
                    .map((file) => (
                      <tr
                        key={file.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group cursor-default"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 text-blue-500 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <FileIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block truncate max-w-[200px] sm:max-w-xs">
                                {file.original_filename}
                              </span>
                              <span className="text-xs text-slate-400 hidden sm:block">
                                Encrypted ({file.encryption})
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {formatFileSize(file.original_size)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                          {file.mime_type}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 text-right">
                          {new Date(file.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 transition-opacity">
                            <button
                              onClick={() => handleDownloadFile(file)}
                              disabled={downloading === file.id}
                              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                              {downloading === file.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file)}
                              disabled={deleting === file.id}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              {deleting === file.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchFolderData}
        folderId={folderId}
      />
    </div>
  );
};

export default FolderDetail;
