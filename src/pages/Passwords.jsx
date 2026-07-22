import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  Plus,
  Download,
  Eye,
  Copy,
  MoreVertical,
  Globe,
  Lock,
  Star,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LayoutGrid,
  List,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { vaultAPI } from "../utils/api";
import { safeDecryptField } from "../utils/crypto";
import {
  getCategoryIcon,
  getCategoryGradient,
  getCategoryColor,
} from "../utils/categoryIcons";
import CreateVaultModal from "../components/CreateVaultModal";
import DecryptModal from "../components/DecryptModal";
import DeleteVaultModal from "../components/DeleteVaultModal";
import UpdateVaultModal from "../components/UpdateVaultModal";

const Passwords = () => {
  const { refreshTrigger, openCreateModal, searchQuery, selectedCategory } =
    useOutletContext();
  const { mek } = useAuth();
  const [passwords, setPasswords] = useState([]);
  const [filteredPasswords, setFilteredPasswords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false); // Separate state for filter operations
  const [isExporting, setIsExporting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDecryptModalOpen, setIsDecryptModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("vault_view_mode") || "grid";
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("vault_view_mode", mode);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch passwords on mount and when refresh trigger, search, category, or favorites filter changes
  useEffect(() => {
    const isInitialLoad = passwords.length === 0 && isLoading;
    fetchPasswords(isInitialLoad);
  }, [refreshTrigger, searchQuery, selectedCategory, showOnlyFavorites]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, showOnlyFavorites]);

  const baseBtn =
    "flex items-center gap-2 h-[44px] px-4 rounded-xl transition-all";

  const getFilenameFromContentDisposition = (contentDisposition) => {
    if (!contentDisposition) return null;

    // RFC 5987: filename*=UTF-8''...
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1].trim());
      } catch {
        return utf8Match[1].trim();
      }
    }

    // filename="..." or filename=...
    const simpleMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    return simpleMatch?.[1]?.trim() || null;
  };

  /**
   * Export vault passwords to Excel — fully client-side.
   * Fetches all items, decrypts them locally with the MEK, then builds
   * an XLSX file in the browser and triggers a download via Blob URL.
   */
  const handleExportCsv = async () => {
    if (!mek || isExporting) return;

    setIsExporting(true);
    try {
      // Fetch ALL items (large per_page) with current filters applied.
      const exportFilters = { per_page: 1000, page: 1 };
      if (selectedCategory) exportFilters.category = selectedCategory;
      if (searchQuery) exportFilters.search = searchQuery;

      const data = await vaultAPI.getAll(exportFilters);

      let vaultList = [];
      if (Array.isArray(data)) vaultList = data;
      else if (data?.data?.vaults) vaultList = data.data.vaults;
      else if (data?.data && Array.isArray(data.data)) vaultList = data.data;
      else if (data?.vaults) vaultList = data.vaults;

      // Decrypt every item client-side.
      const decrypted = await Promise.all(
        vaultList.map(async (item) => {
          const password = await safeDecryptField(
            item.password_encrypted,
            mek,
            "[encrypted]",
          );
          const username = await safeDecryptField(
            item.username,
            mek,
            item.username || "",
          );
          const note = await safeDecryptField(item.note, mek, item.note || "");
          return {
            Name: item.name || "",
            Username: username,
            Password: password,
            Note: note,
            Category: item.category_name || "Uncategorized",
            "Created At": item.created_at || "",
            "Updated At": item.updated_at || "",
          };
        }),
      );

      // Build XLSX workbook.
      const ws = XLSX.utils.json_to_sheet(decrypted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Passwords");

      const xlsxArray = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([xlsxArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const filename = `crypta-vault-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${decrypted.length} passwords to Excel`);
    } catch (error) {
      toast.error(error.message || "Failed to export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const fetchPasswords = async (isInitialLoad = false) => {
    try {
      // Only show full loading on initial load, use filtering state for filter changes
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsFiltering(true);
      }

      // Build filters object (without favorites - we'll filter client-side)
      const filters = {
        page: currentPage,
        per_page: perPage,
      };
      if (selectedCategory) {
        filters.category = selectedCategory;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const data = await vaultAPI.getAll(filters);

      // Handle different response structures
      let vaultList = [];
      let paginationData = {};
      if (Array.isArray(data)) {
        vaultList = data;
      } else if (data.vaults && Array.isArray(data.vaults)) {
        vaultList = data.vaults;
        paginationData = data.pagination || {};
      } else if (data.data && Array.isArray(data.data)) {
        vaultList = data.data;
        paginationData = data.pagination || {};
      } else if (
        data.data &&
        data.data.vaults &&
        Array.isArray(data.data.vaults)
      ) {
        vaultList = data.data.vaults;
        paginationData = data.data.pagination || {};
      }

      setPasswords(vaultList);

      // Update pagination state
      setTotalItems(
        paginationData.total || paginationData.total_items || vaultList.length,
      );
      setTotalPages(
        paginationData.total_pages ||
        Math.ceil(
          (paginationData.total ||
            paginationData.total_items ||
            vaultList.length) / perPage,
        ),
      );
      setCurrentPage(paginationData.current_page || currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load passwords");
      setPasswords([]); // Set empty array on error
    } finally {
      setIsLoading(false);
      setIsFiltering(false);
    }
  };

  // Client-side filtering for favorites
  useEffect(() => {
    let filtered = passwords;

    // Apply favorites filter
    if (showOnlyFavorites) {
      filtered = filtered.filter((password) => password.is_favorite);
    }

    setFilteredPasswords(filtered);
  }, [passwords, showOnlyFavorites]);

  const handleDecrypt = (vault) => {
    setSelectedVault(vault);
    setIsDecryptModalOpen(true);
  };

  const handleUpdateClick = (vault) => {
    setSelectedVault(vault);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    fetchPasswords(); // Refresh list after update
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleDeleteClick = (vault) => {
    setSelectedVault(vault);
    setIsDeleteModalOpen(true);
  };

  const handleToggleFavorite = async (vaultId) => {
    try {
      await vaultAPI.toggleFavorite(vaultId);

      // Refresh data from server to get updated favorite status
      await fetchPasswords();

      toast.success("Favorite status updated!");
    } catch (error) {
      toast.error("Failed to update favorite status");
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleDeleteConfirm = async (vault) => {
    try {
      setDeletingId(vault.id);

      await vaultAPI.delete(vault.id);

      toast.success("Password deleted successfully!");
      fetchPasswords(); // Refresh list
      return { success: true };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to delete password";
      return { success: false, error: errorMsg };
    } finally {
      setDeletingId(null);
    }
  };

  // Locked Vault State
  if (!mek) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
            Vault is Locked
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your vault is currently locked. Please unlock it with your master
            password to access your encrypted passwords.
          </p>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Tip: Click the "Unlock Vault" button in the sidebar to enter your
              master password.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Empty State
  if (isLoading) {
    return (
      <div className="w-full">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-28 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse hidden sm:block" />
            <div className="h-11 w-40 bg-blue-200 dark:bg-blue-900/50 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white/50 dark:bg-slate-900/50 rounded-xl p-3.5 sm:p-4 border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
                  </div>
                </div>
                <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              </div>

              <div className="bg-slate-100 dark:bg-slate-900/80 rounded-lg h-8 mb-3 animate-pulse" />

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
                <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (passwords.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            No Passwords Yet
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Your vault is empty. Start securing your passwords by adding your
            first entry.
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add First Password
          </motion.button>

          {/* Info Card */}
          <div className="mt-8 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl p-3.5 border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-start gap-3 text-left">
              <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-slate-800 dark:text-white mb-0.5">
                  End-to-End Encrypted
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  All passwords are encrypted with AES-256-GCM using your master
                  password. Only you can decrypt them.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Password List View (for when there are passwords)
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-white mb-0.5 flex items-center gap-2">
            {showOnlyFavorites ? "Favorite Passwords" : "All Passwords"}
            {isFiltering && (
              <span className="inline-flex items-center gap-1.5 text-xs font-normal text-blue-600 dark:text-blue-400">
                <Loader2 className="animate-spin h-3.5 w-3.5" />
                Filtering...
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filteredPasswords.length}{" "}
            {filteredPasswords.length === 1 ? "password" : "passwords"}
            {showOnlyFavorites ? " favorite password" : " stored securely"}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange("list")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "list"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              title="Dense List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Favorites Filter */}
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`${baseBtn} text-xs font-medium ${showOnlyFavorites
              ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
          >
            <Star
              className={`w-4 h-4 ${showOnlyFavorites ? "fill-amber-500 text-amber-500" : ""
                }`}
            />
            <span className="hidden sm:inline">Favorites</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateModal}
            className={`${baseBtn} bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-xs shadow-md shadow-blue-500/20 hover:shadow-lg`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Password</span>
          </motion.button>
        </div>
      </div>

      {/* Password Items Grid / List */}
      {filteredPasswords.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPasswords.map((password, index) => (
              <PasswordCard
                key={password.id || `password-${index}`}
                password={password}
                onCopy={handleCopy}
                onDecrypt={handleDecrypt}
                onUpdate={handleUpdateClick}
                onDelete={handleDeleteClick}
                onToggleFavorite={handleToggleFavorite}
                isDeleting={deletingId === password.id}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-200/60 dark:divide-slate-800/80 shadow-xs">
            {filteredPasswords.map((password, index) => (
              <PasswordListRow
                key={password.id || `password-${index}`}
                password={password}
                onCopy={handleCopy}
                onDecrypt={handleDecrypt}
                onUpdate={handleUpdateClick}
                onDelete={handleDeleteClick}
                onToggleFavorite={handleToggleFavorite}
                isDeleting={deletingId === password.id}
              />
            ))}
          </div>
        )
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center min-h-[350px]"
        >
          <div className="text-center">
            <Star className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {showOnlyFavorites
                ? "No Favorite Passwords"
                : "No Passwords Found"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-5">
              {showOnlyFavorites
                ? "You haven't marked any passwords as favorites yet."
                : "Try adjusting your search or filters."}
            </p>
            {showOnlyFavorites && (
              <button
                onClick={() => setShowOnlyFavorites(false)}
                className="px-3.5 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-500 transition-colors"
              >
                View All Passwords
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4 py-2.5 bg-white dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400">
              Showing {Math.min((currentPage - 1) * perPage + 1, totalItems)}–
              {Math.min(currentPage * perPage, totalItems)} of {totalItems}
            </span>
            <select
              value={perPage}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value={8}>8 per page</option>
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={48}>48 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-7 h-7 flex items-center justify-center text-xs font-medium rounded-lg transition-colors ${currentPage === pageNum
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Decrypt Modal */}
      <DecryptModal
        isOpen={isDecryptModalOpen}
        onClose={() => setIsDecryptModalOpen(false)}
        vaultItem={selectedVault}
      />

      {/* Update Modal */}
      <UpdateVaultModal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedVault(null);
        }}
        vaultItem={selectedVault}
        onSuccess={handleUpdateSuccess}
      />

      {/* Delete Modal */}
      <DeleteVaultModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedVault(null);
        }}
        vaultItem={selectedVault}
        onDelete={handleDeleteConfirm}
        isDeleting={deletingId !== null}
      />
    </div>
  );
};

// Password Card Component
const PasswordCard = ({
  password,
  onCopy,
  onDecrypt,
  onUpdate,
  onDelete,
  isDeleting,
  onToggleFavorite,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Get category icon for this password
  const CategoryIcon = getCategoryIcon(
    password.category || password.category_name,
  );

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const websiteUrl = password.website || password.url;
  const categoryName = password.category || password.category_name || "Uncategorized";
  const categoryColor = getCategoryColor(categoryName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between group relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Category Icon */}
          <div className={`w-10 h-10 ${categoryColor.gradient} flex items-center justify-center shrink-0 rounded-lg shadow-xs`}>
            <CategoryIcon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate leading-snug">
              {password.name || password.title}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate mt-0.5">
              {websiteUrl ? (
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </span>
              ) : (
                categoryName
              )}
            </p>
          </div>
        </div>

        {/* Favorite & Options */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggleFavorite(password.id)}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors"
            title={
              password.is_favorite
                ? "Remove from favorites"
                : "Add to favorites"
            }
          >
            <Star
              className={`w-4 h-4 ${password.is_favorite
                ? "text-amber-500 fill-amber-500"
                : ""
                }`}
            />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                <button
                  onClick={() => {
                    onUpdate(password);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(password);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Masked Preview Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 rounded-lg px-3 py-2 mb-3.5 flex items-center justify-between gap-2">
        <span className="font-mono text-xs sm:text-sm text-slate-400 dark:text-slate-500 tracking-wider select-none">
          ••••••••••••
        </span>
        <button
          onClick={() => onDecrypt(password)}
          className="p-1 rounded-md text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="Decrypt and view password"
        >
          <Eye className="w-4 h-4" />
          <span>Decrypt</span>
        </button>
      </div>

      {/* Footer Meta */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span className={`font-medium px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] tracking-wider uppercase ${categoryColor.pill}`}>
          {categoryName}
        </span>
        <button
          onClick={() => onDecrypt(password)}
          className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-xs flex items-center gap-1"
        >
          View Details →
        </button>
      </div>
    </motion.div>
  );
};

// Dense List Row Component (1Password / Bitwarden Style)
const PasswordListRow = ({
  password,
  onDecrypt,
  onUpdate,
  onDelete,
  isDeleting,
  onToggleFavorite,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const CategoryIcon = getCategoryIcon(
    password.category || password.category_name,
  );
  const websiteUrl = password.website || password.url;
  const categoryName = password.category || password.category_name || "Uncategorized";
  const categoryColor = getCategoryColor(categoryName);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group select-none">
      {/* Col 1: Icon & Item Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-8 h-8 ${categoryColor.gradient} flex items-center justify-center shrink-0`}>
          <CategoryIcon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate leading-tight">
              {password.name || password.title}
            </h3>
            {password.is_favorite && (
              <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
            {websiteUrl ? (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                {websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </span>
            ) : (
              categoryName
            )}
          </p>
        </div>
      </div>

      {/* Col 2: Category Tag (Hidden on mobile) */}
      <div className="hidden md:block w-32 shrink-0">
        <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md ${categoryColor.pill}`}>
          {categoryName}
        </span>
      </div>

      {/* Col 4: Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onToggleFavorite(password.id)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors"
          title={password.is_favorite ? "Remove favorite" : "Add favorite"}
        >
          <Star
            className={`w-3.5 h-3.5 ${password.is_favorite ? "text-amber-500 fill-amber-500" : ""
              }`}
          />
        </button>

        <button
          onClick={() => onDecrypt(password)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Decrypt / View Details"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
              <button
                onClick={() => {
                  onUpdate(password);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete(password);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                disabled={isDeleting}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Passwords;
