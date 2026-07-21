import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  RefreshCw,
  Clock,
  ShieldAlert,
  Loader2,
  Lock,
  Search,
  FileText,
  KeyRound,
  Inbox
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { trashAPI } from "../utils/api";
import { safeDecryptField } from "../utils/crypto";
import EmptyTrashModal from "../components/EmptyTrashModal";
import DeleteTrashItemModal from "../components/DeleteTrashItemModal";

const Trash = () => {
  const { mek } = useAuth();
  const [items, setItems] = useState([]);
  const [decryptedUsernames, setDecryptedUsernames] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(null); // id of item being processed
  const [searchQuery, setSearchQuery] = useState("");
  const [isEmptyModalOpen, setIsEmptyModalOpen] = useState(false);
  const [isClearingTrash, setIsClearingTrash] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  const isVaultLocked = !mek;

  const fetchTrashItems = async () => {
    if (isVaultLocked) return;
    setIsLoading(true);
    try {
      const data = await trashAPI.getAll();
      const trashList = data?.data || data || [];
      setItems(trashList);

      // Decrypt usernames asynchronously
      const usernames = {};
      await Promise.all(
        trashList.map(async (item) => {
          if (item.type === "password" && item.username) {
            usernames[item.id] = await safeDecryptField(
              item.username,
              mek,
              "[encrypted]"
            );
          }
        })
      );
      setDecryptedUsernames(usernames);
    } catch (error) {
      console.error("Fetch trash items error:", error);
      toast.error(error.response?.data?.message || "Failed to load trash items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashItems();
  }, [isVaultLocked, mek]);

  const handleRestore = async (id, type) => {
    setIsActioning(id);
    try {
      await trashAPI.restore(id, type);
      toast.success("Item restored successfully");
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to restore item");
    } finally {
      setIsActioning(null);
    }
  };

  const openDeleteModal = (item) => {
    setDeletingItem(item);
  };

  const handleConfirmDeletePermanently = async () => {
    if (!deletingItem) return;
    const { id, type } = deletingItem;
    setIsActioning(id);
    try {
      await trashAPI.deletePermanently(id, type);
      toast.success("Item permanently deleted");
      setItems((prev) => prev.filter((item) => item.id !== id));
      setDeletingItem(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete item");
    } finally {
      setIsActioning(null);
    }
  };

  const handleEmptyTrash = () => {
    if (items.length === 0) return;
    setIsEmptyModalOpen(true);
  };

  const handleConfirmEmptyTrash = async () => {
    setIsClearingTrash(true);
    try {
      await trashAPI.empty();
      toast.success("Trash emptied successfully");
      setItems([]);
      setIsEmptyModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to empty trash");
    } finally {
      setIsClearingTrash(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const nameMatch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const catMatch = item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const usernameMatch = decryptedUsernames[item.id]?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || catMatch || usernameMatch;
  });

  if (isVaultLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md p-8 glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-xl flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-600 dark:to-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
            Vault is Locked
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Please unlock your vault with your master password to access your deleted items.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-red-500" />
            Trash Bin
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Items will be automatically and permanently deleted after 30 days.
          </p>
        </div>

        {items.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEmptyTrash}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 dark:border-red-900/30 rounded-xl font-semibold transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Empty Trash
          </motion.button>
        )}
      </div>

      {/* Info Alert Box */}
      <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-4 rounded-2xl flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-indigo-700 dark:text-indigo-300">
          <span className="font-semibold block mb-0.5">Secure Auto-Purge Scheduler</span>
          The backend runs a secure cleanup schedule. Any password or note in the Trash for more than 30 days is hard-deleted from the server database permanently.
        </div>
      </div>

      {/* Search and Filter */}
      {items.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search trash items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-slate-800 dark:text-white placeholder-slate-400"
          />
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading deleted items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center bg-slate-50/30 dark:bg-slate-900/10">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
            {searchQuery ? "No items match your search" : "Trash Bin is Empty"}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
            {searchQuery ? "Try checking spelling or clear search filters." : "When you delete passwords or secret notes, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredItems.map((item) => {
              const isPassword = item.type === "password";
              const isPendingAction = isActioning === item.id;
              const isUrgent = item.days_remaining <= 7;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-5 glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-2xl hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Type Badge + Days Left */}
                    <div className="flex justify-between items-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isPassword
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                      }`}>
                        {isPassword ? <KeyRound className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        {isPassword ? "Password" : "Note"}
                      </span>

                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                        isUrgent
                          ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/50"
                          : "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800"
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        {item.days_remaining} days left
                      </span>
                    </div>

                    {/* Middle: Title & Metadata */}
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">
                        {item.name}
                      </h3>
                      {isPassword && decryptedUsernames[item.id] && (
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-mono mt-1">
                          {decryptedUsernames[item.id]}
                        </p>
                      )}
                      {item.category && (
                        <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Action Buttons */}
                  <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => handleRestore(item.id, item.type)}
                      disabled={isPendingAction || isActioning !== null}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-xl transition-all"
                    >
                      {isPendingAction ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Restore
                    </button>

                    <button
                      onClick={() => openDeleteModal(item)}
                      disabled={isPendingAction || isActioning !== null}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Permanently
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Custom Empty Trash Modal */}
      <EmptyTrashModal
        isOpen={isEmptyModalOpen}
        onClose={() => setIsEmptyModalOpen(false)}
        onConfirm={handleConfirmEmptyTrash}
        itemCount={items.length}
        isClearing={isClearingTrash}
      />

      {/* Custom Delete Item Permanently Modal */}
      <DeleteTrashItemModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDeletePermanently}
        item={deletingItem}
        isDeleting={isActioning === deletingItem?.id}
      />
    </div>
  );
};

export default Trash;
