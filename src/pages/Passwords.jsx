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
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { vaultAPI } from "../utils/api";
import { getCategoryIcon, getCategoryGradient } from "../utils/categoryIcons";
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

  const handleExportCsv = async () => {
    if (!mek || isExporting) return;

    try {
      setIsExporting(true);

      const exportFilters = {};
      if (selectedCategory) exportFilters.category = selectedCategory;
      if (searchQuery) exportFilters.search = searchQuery;
      if (showOnlyFavorites) exportFilters.favorites = true;

      const response = await vaultAPI.exportCsv(mek, exportFilters);

      const contentType = (response?.headers?.["content-type"] || "").toLowerCase();
      const contentDisposition = response?.headers?.["content-disposition"];
      const filenameFromHeader = getFilenameFromContentDisposition(contentDisposition);

      const rawBlob =
        response?.data instanceof Blob
          ? response.data
          : new Blob([response?.data], { type: "text/csv" });

      // If BE already returns an Excel file, download as-is.
      const isExcelResponse =
        contentType.includes("spreadsheetml") ||
        contentType.includes("application/vnd.ms-excel") ||
        (filenameFromHeader || "").toLowerCase().endsWith(".xlsx");

      let downloadBlob;
      let filename;

      if (isExcelResponse) {
        downloadBlob = rawBlob;
        filename =
          filenameFromHeader ||
          `vault-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      } else {
        const csvText = await rawBlob.text();
        const workbook = XLSX.read(csvText, { type: "string" });
        const xlsxArray = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        downloadBlob = new Blob([xlsxArray], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const baseName = (filenameFromHeader || "vault-export").replace(/\.csv$/i, "");
        filename = `${baseName}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      }

      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Excel exported");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to export Excel");
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

  const handleDeleteConfirm = async (vault, password) => {
    try {
      setDeletingId(vault.id);

      await vaultAPI.delete(vault.id, password);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading passwords...
          </p>
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
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Lock className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
            No Passwords Yet
          </h2>

          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Your vault is empty. Start securing your passwords by adding your
            first entry.
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Add First Password
          </motion.button>

          {/* Info Card */}
          <div className="mt-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-100 dark:border-primary-800">
            <div className="flex items-start gap-3 text-left">
              <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">
                  End-to-End Encrypted
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-3">
            {showOnlyFavorites ? "Favorite Passwords" : "All Passwords"}
            {isFiltering && (
              <span className="inline-flex items-center gap-2 text-sm font-normal text-primary-600 dark:text-primary-400">
                <Loader2 className="animate-spin h-4 w-4" />
                Filtering...
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {filteredPasswords.length}{" "}
            {filteredPasswords.length === 1 ? "password" : "passwords"}
            {showOnlyFavorites ? " favorite password" : " stored securely"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Favorites Filter */}
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`${baseBtn} font-semibold ${
              showOnlyFavorites
                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Star
              className={`w-5 h-5 ${
                showOnlyFavorites ? "fill-yellow-500 text-yellow-500" : ""
              }`}
            />
            <span className="hidden sm:inline">Favorites</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className={`${baseBtn} font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Export passwords to Excel"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">
              {isExporting ? "Exporting..." : "Export Excel"}
            </span>
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateModal}
            className={`${baseBtn} bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl`}
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Password</span>
          </motion.button>
        </div>
      </div>

      {/* Password Grid */}
      {filteredPasswords.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center min-h-[400px]"
        >
          <div className="text-center">
            <Star className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
              {showOnlyFavorites
                ? "No Favorite Passwords"
                : "No Passwords Found"}
            </h3>
            <p className="text-slate-500 dark:text-slate-500 mb-6">
              {showOnlyFavorites
                ? "You haven't marked any passwords as favorites yet."
                : "Try adjusting your search or filters."}
            </p>
            {showOnlyFavorites && (
              <button
                onClick={() => setShowOnlyFavorites(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                View All Passwords
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Showing {Math.min((currentPage - 1) * perPage + 1, totalItems)} to{" "}
              {Math.min(currentPage * perPage, totalItems)} of {totalItems}{" "}
              passwords
            </span>
            <select
              value={perPage}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              className="text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={6}>6 per page</option>
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={48}>48 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
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
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? "bg-blue-500 text-white"
                        : "text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
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
              className="px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
  const [showPassword, setShowPassword] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Get category icon and gradient for this password
  const CategoryIcon = getCategoryIcon(
    password.category || password.category_name,
  );
  const categoryGradient = getCategoryGradient(
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

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={`w-10 h-10 bg-gradient-to-br ${categoryGradient} rounded-xl flex items-center justify-center shadow-md`}
          >
            <CategoryIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">
              {password.name || password.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {password.username}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleFavorite(password.id)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            title={
              password.is_favorite
                ? "Remove from favorites"
                : "Add to favorites"
            }
          >
            <Star
              className={`w-4 h-4 ${
                password.is_favorite
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-slate-400 hover:text-yellow-500"
              }`}
            />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              <MoreVertical className="w-4 h-4 text-slate-500" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10">
                <button
                  onClick={() => {
                    onUpdate(password);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(password);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

      {/* Password Field - Encrypted */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
            ••••••••••••
          </span>
          <button
            onClick={() => onDecrypt(password)}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Decrypt password"
          >
            <Eye className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onDecrypt(password)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
      </div>

      {/* Metadata */}
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{password.category_name || "Uncategorized"}</span>
          <span>
            Updated at{" "}
            {password.lastUpdated || password.updated_at || "recently"}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default Passwords;
