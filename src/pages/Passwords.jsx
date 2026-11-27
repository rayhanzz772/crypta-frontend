import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  Plus,
  Eye,
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
  getCategoryColor,
} from "../utils/categoryIcons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Vault is Locked
          </h2>
          <p className="text-muted-foreground mb-6">
            Your vault is currently locked. Please unlock it with your master
            password to access your encrypted passwords.
          </p>
          <div className="p-4 bg-warning/10 border border-warning/25 rounded-xl">
            <p className="text-sm text-warning">
              Tip: Click the "Unlock Vault" button in the sidebar to enter your
              master password.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="w-full">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 bg-muted rounded-lg animate-pulse hidden sm:block" />
            <div className="h-9 w-36 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-xl animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-16 bg-muted/60 rounded animate-pulse" />
                  </div>
                </div>
                <div className="w-7 h-7 bg-muted rounded-md animate-pulse" />
              </div>

              <div className="bg-muted/60 rounded-lg h-9 mb-3 animate-pulse" />

              <div className="pt-2.5 border-t border-border flex justify-between items-center">
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty State
  if (passwords.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">
            No Passwords Yet
          </h2>

          <p className="text-sm text-muted-foreground mb-6">
            Your vault is empty. Start securing your passwords by adding your
            first entry.
          </p>

          <Button onClick={openCreateModal} className="rounded-xl">
            <Plus />
            Add First Password
          </Button>

          {/* Info Card */}
          <div className="mt-8 bg-primary/5 rounded-xl p-3.5 border border-primary/20">
            <div className="flex items-start gap-3 text-left">
              <Lock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-foreground mb-0.5">
                  End-to-End Encrypted
                </h3>
                <p className="text-[11px] text-muted-foreground">
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold text-foreground mb-0.5 flex items-center gap-2">
            {showOnlyFavorites ? "Favorite Passwords" : "All Passwords"}
            <Badge variant="secondary" className="font-mono">
              {filteredPasswords.length}
            </Badge>
            {isFiltering && (
              <span className="inline-flex items-center gap-1.5 text-xs font-normal text-primary">
                <Loader2 className="animate-spin h-3.5 w-3.5" />
                Filtering...
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground">
            {showOnlyFavorites
              ? "Starred items, stored securely"
              : "Stored securely, end-to-end encrypted"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 bg-muted rounded-lg border border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewModeChange("grid")}
              className={`size-7 rounded-md ${viewMode === "grid"
                ? "bg-background shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
              aria-label="Grid View"
            >
              <LayoutGrid />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewModeChange("list")}
              className={`size-7 rounded-md ${viewMode === "list"
                ? "bg-background shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
              aria-label="Dense List View"
            >
              <List />
            </Button>
          </div>

          {/* Favorites Filter */}
          <Button
            variant={showOnlyFavorites ? "default" : "outline"}
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`h-9 rounded-lg text-xs ${showOnlyFavorites ? "bg-warning text-warning-foreground hover:bg-warning/90" : ""}`}
          >
            <Star className={showOnlyFavorites ? "fill-current" : ""} />
            <span className="hidden sm:inline">Favorites</span>
          </Button>

          <Button onClick={openCreateModal} className="h-9 rounded-lg text-xs">
            <Plus />
            <span className="hidden sm:inline">Add Password</span>
          </Button>
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
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
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
            <Star className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">
              {showOnlyFavorites
                ? "No Favorite Passwords"
                : "No Passwords Found"}
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              {showOnlyFavorites
                ? "You haven't marked any passwords as favorites yet."
                : "Try adjusting your search or filters."}
            </p>
            {showOnlyFavorites && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOnlyFavorites(false)}
              >
                View All Passwords
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 px-4 py-2.5 rounded-xl border border-border bg-card text-xs">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              Showing {Math.min((currentPage - 1) * perPage + 1, totalItems)}–
              {Math.min(currentPage * perPage, totalItems)} of {totalItems}
            </span>
            <Select
              value={String(perPage)}
              onValueChange={(v) => handlePerPageChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-[110px] text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8 / page</SelectItem>
                <SelectItem value="12">12 / page</SelectItem>
                <SelectItem value="24">24 / page</SelectItem>
                <SelectItem value="48">48 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="size-8 rounded-lg"
              aria-label="Previous page"
            >
              <ChevronLeft />
            </Button>

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
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    onClick={() => handlePageChange(pageNum)}
                    className="size-8 rounded-lg text-xs font-medium"
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="size-8 rounded-lg"
              aria-label="Next page"
            >
              <ChevronRight />
            </Button>
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

// Item action menu shared by card and row views
const VaultActionsMenu = ({ password, onUpdate, onDelete, isDeleting }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-lg text-muted-foreground"
        aria-label="Item actions"
      >
        <MoreVertical />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-40">
      <DropdownMenuItem onClick={() => onUpdate(password)}>
        <Edit />
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => onDelete(password)}
        disabled={isDeleting}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 />
        {isDeleting ? "Deleting..." : "Delete"}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

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
  // Get category icon for this password
  const CategoryIcon = getCategoryIcon(
    password.category || password.category_name,
  );

  const websiteUrl = password.website || password.url;
  const categoryName = password.category || password.category_name || "Uncategorized";
  const categoryColor = getCategoryColor(categoryName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col justify-between group relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4 pb-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Category Icon */}
          <div className={`w-10 h-10 ${categoryColor.gradient} flex items-center justify-center shrink-0 rounded-xl shadow-xs`}>
            <CategoryIcon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-foreground truncate leading-snug">
              {password.name || password.title}
            </h3>
            <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
              {websiteUrl ? (
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  {websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </span>
              ) : (
                categoryName
              )}
            </p>
          </div>
        </div>

        {/* Favorite & Options */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleFavorite(password.id)}
            className={`size-8 rounded-lg ${password.is_favorite
              ? "text-warning hover:text-warning"
              : "text-muted-foreground"
              }`}
            title={
              password.is_favorite
                ? "Remove from favorites"
                : "Add to favorites"
            }
          >
            <Star className={password.is_favorite ? "fill-current" : ""} />
          </Button>

          <VaultActionsMenu
            password={password}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </div>
      </div>

      {/* Password Masked Preview Bar */}
      <div className="mx-4 my-3 bg-muted/60 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground tracking-wider select-none">
          ••••••••••••
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDecrypt(password)}
          className="h-7 px-2 text-xs text-muted-foreground"
          title="Decrypt and view password"
        >
          <Eye />
          Decrypt
        </Button>
      </div>

      {/* Footer Meta */}
      <div className="px-4 pb-4 pt-0 mt-auto">
        <div className="pt-2.5 border-t border-border flex items-center justify-between">
          <span className={`font-medium px-2 py-0.5 rounded-md text-[10px] tracking-wider uppercase ${categoryColor.pill}`}>
            {categoryName}
          </span>
          <Button
            variant="link"
            size="sm"
            onClick={() => onDecrypt(password)}
            className="h-auto p-0 text-xs"
          >
            View Details
          </Button>
        </div>
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
  const CategoryIcon = getCategoryIcon(
    password.category || password.category_name,
  );
  const websiteUrl = password.website || password.url;
  const categoryName = password.category || password.category_name || "Uncategorized";
  const categoryColor = getCategoryColor(categoryName);

  return (
    <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3 hover:bg-muted/50 transition-colors select-none">
      {/* Col 1: Icon & Item Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-9 h-9 ${categoryColor.gradient} flex items-center justify-center shrink-0 rounded-lg shadow-xs`}>
          <CategoryIcon className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground truncate leading-snug">
              {password.name || password.title}
            </h3>
            {password.is_favorite && (
              <Star className="w-3.5 h-3.5 text-warning fill-current shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
            {websiteUrl ? (
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                {websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </span>
            ) : (
              categoryName
            )}
          </p>
        </div>
      </div>

      {/* Col 2: Category Tag (Hidden on mobile) */}
      <div className="hidden md:block w-36 shrink-0">
        <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-md ${categoryColor.pill}`}>
          {categoryName}
        </span>
      </div>

      {/* Col 3: Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleFavorite(password.id)}
          className={`size-8 rounded-lg ${password.is_favorite ? "text-warning hover:text-warning" : "text-muted-foreground"}`}
          title={password.is_favorite ? "Remove favorite" : "Add favorite"}
        >
          <Star className={password.is_favorite ? "fill-current" : ""} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDecrypt(password)}
          className="size-8 rounded-lg text-muted-foreground"
          title="Decrypt / View Details"
        >
          <Eye />
        </Button>

        <VaultActionsMenu
          password={password}
          onUpdate={onUpdate}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
};

export default Passwords;
