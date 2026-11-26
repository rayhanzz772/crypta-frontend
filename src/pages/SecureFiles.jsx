import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FolderPlus,
  File as FileIcon,
  Loader2,
  HardDrive,
  Download,
  Trash2,
  Lock,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { filesAPI } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import CreateFolderModal from "../components/CreateFolderModal";
import FileUploadModal from "../components/FileUploadModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

const SecureFiles = () => {
  const navigate = useNavigate();
  const { searchQuery = "" } = useOutletContext();
  const { mek } = useAuth();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await filesAPI.listFolders();
      setFolders(response.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load secure files",
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadFolder = async (folder, e) => {
    e.stopPropagation();
    if (!mek) {
      toast.error("Vault must be unlocked to download folders");
      return;
    }
    setDownloading(folder.id);
    try {
      const response = await filesAPI.downloadFolder(folder.id, mek);
      const missingCount = response.headers["x-missing-files"];
      if (missingCount && parseInt(missingCount, 10) > 0) {
        toast.error(`Warning: ${missingCount} files were missing in storage`, {
          duration: 5000,
        });
      }
      const filename = `${folder.name}.zip`;
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

  const handleDeleteFolder = (folder, e) => {
    e.stopPropagation();
    setFolderToDelete(folder);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!folderToDelete) return;

    setDeleting(folderToDelete.id);
    try {
      await filesAPI.deleteFolder(folderToDelete.id);
      toast.success("Folder deleted");
      setIsDeleteModalOpen(false);
      setFolderToDelete(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete folder");
    } finally {
      setDeleting(null);
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
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Secure Storage Locked
          </h2>
          <p className="text-muted-foreground mb-6">
            Your encrypted files and folders are protected. Please unlock your
            vault with your master password to access them.
          </p>
          <div className="p-4 bg-warning/10 border border-warning/25 rounded-xl mb-6">
            <p className="text-sm text-warning">
              💡 Tip: Click the "Unlock Vault" button in the sidebar to enter
              your master password.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">
                  AES-256-GCM Encryption
                </p>
                <p className="text-xs text-muted-foreground">
                  Files are encrypted locally before upload
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-muted-foreground" />
            Secure Storage
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AES-256-GCM encrypted files and folders.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-card text-foreground border border-border hover:bg-muted rounded-xl transition-all shadow-sm text-sm font-medium"
          >
            <FolderPlus className="w-4 h-4 text-primary" />
            New Folder
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              Decrypting storage acces..
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Folders Section */}
          {folders.length > 0 ? (
            <div>
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Folders
                </h2>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/50 dark:bg-background/50 text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Name</th>
                        <th className="px-6 py-4 font-semibold">
                          Created Date
                        </th>
                        <th className="px-6 py-4 font-semibold text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {folders
                        .filter((f) =>
                          f.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()),
                        )
                        .map((folder) => (
                          <tr
                            key={folder.id}
                            onClick={() =>
                              navigate(`/app/files/folders/${folder.id}`)
                            }
                            className="hover:bg-muted/50 transition-colors group cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center">
                                  <img
                                    src="/folder_icon.png"
                                    alt="Folder"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <span className="text-sm font-medium text-foreground">
                                  {folder.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {new Date(folder.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 transition-opacity">
                                <button
                                  onClick={(e) =>
                                    handleDownloadFolder(folder, e)
                                  }
                                  disabled={downloading === folder.id}
                                  className="p-2 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
                                >
                                  {downloading === folder.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={(e) => handleDeleteFolder(folder, e)}
                                  disabled={deleting === folder.id}
                                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                >
                                  {deleting === folder.id ? (
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
            </div>
          ) : (
            <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
              <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <img
                  src="/folder_icon.png"
                  alt="Empty Storage"
                  className="w-full h-full object-contain opacity-50"
                />
              </div>
              <h3 className="text-foreground font-medium text-lg">
                No Folders Created
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Create a secure folder to start uploading your encrypted files.
              </p>
              <button
                onClick={() => setIsFolderModalOpen(true)}
                className="mt-6 px-6 py-2 bg-muted hover:bg-muted dark:hover:bg-slate-600 text-foreground rounded-xl text-sm font-medium transition-colors"
              >
                Create Folder
              </button>
            </div>
          )}
        </>
      )}

      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSuccess={fetchData}
      />
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchData}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setFolderToDelete(null);
        }}
        title="Delete Folder?"
        itemName={folderToDelete?.name}
        warningText="All files inside this folder will be permanently deleted and cannot be recovered."
        onConfirm={handleConfirmDelete}
        isLoading={deleting === folderToDelete?.id}
      />
    </div>
  );
};

export default SecureFiles;
