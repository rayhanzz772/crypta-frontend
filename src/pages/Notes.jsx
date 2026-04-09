import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FileText,
  Plus,
  Grid,
  List,
  Filter,
  Lock,
  LockOpen,
  Calendar,
  Tag,
  Eye,
  Edit,
  Trash2,
  X,
  Shield,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { notesAPI, categoriesAPI } from "../utils/api";
import { getCategoryIcon, getCategoryGradient } from "../utils/categoryIcons";
import CreateNoteModal from "../components/CreateNoteModal";
import ViewNoteModal from "../components/ViewNoteModal";
import UpdateNoteModal from "../components/UpdateNoteModal";
import DeleteNoteModal from "../components/DeleteNoteModal";

const normalizeTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }
  return [];
};

const Notes = () => {
  const { searchQuery } = useOutletContext();
  const { mek } = useAuth();

  const isVaultLocked = !mek;

  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [showFilters, setShowFilters] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Force grid view on mobile devices
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // md breakpoint
        setViewMode("grid");
      }
    };

    // Check on mount
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isVaultLocked) {
      fetchCategories();
    }
  }, [isVaultLocked]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();

      let categoryList = [];
      if (Array.isArray(data)) {
        categoryList = data;
      } else if (data.categories && Array.isArray(data.categories)) {
        categoryList = data.categories;
      } else if (data.data && Array.isArray(data.data)) {
        categoryList = data.data;
      } else if (
        data.data &&
        data.data.categories &&
        Array.isArray(data.data.categories)
      ) {
        categoryList = data.data.categories;
      }

      setCategories(categoryList);
    } catch (error) {
      setCategories([]);
    }
  };

  const fetchNotes = async () => {
    try {
      setIsLoading(true);

      // Prepare filters with pagination parameters
      const filters = {
        page: currentPage,
        per_page: perPage,
      };

      const response = await notesAPI.getAll(filters);

      // Handle different response structures for backward compatibility
      let notesData = [];
      let paginationData = {};

      if (response.data && Array.isArray(response.data)) {
        notesData = response.data;
        paginationData = response.pagination || {};
      } else if (response.notes && Array.isArray(response.notes)) {
        notesData = response.notes;
        paginationData = response.pagination || {};
      } else if (Array.isArray(response)) {
        notesData = response;
      } else if (
        response.data &&
        response.data.notes &&
        Array.isArray(response.data.notes)
      ) {
        notesData = response.data.notes;
        paginationData = response.data.pagination || {};
      } else {
        notesData = [];
      }

      const normalizedNotes = notesData.map((note) => ({
        ...note,
        tags: normalizeTags(note.tags),
      }));

      setNotes(normalizedNotes);

      // Update pagination state
      setTotalItems(
        paginationData.total || paginationData.total_items || notesData.length,
      );
      setTotalPages(
        paginationData.total_pages ||
          Math.ceil(
            (paginationData.total ||
              paginationData.total_items ||
              notesData.length) / perPage,
          ),
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load notes");
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isVaultLocked) {
      fetchNotes();
    }
  }, [isVaultLocked]);

  // Reset category filter when component mounts
  useEffect(() => {
    setSelectedCategory("all");
    setShowFilters(false);
  }, []);

  useEffect(() => {
    let filtered = notes;

    // Apply favorites filter first
    if (showOnlyFavorites) {
      filtered = filtered.filter((note) => note.is_favorite);
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((note) => {
        if (note.category_id === selectedCategory) return true;

        const selectedCategoryData = categories.find(
          (cat) => cat.id === selectedCategory,
        );
        if (
          selectedCategoryData &&
          note.category_name?.toLowerCase() ===
            selectedCategoryData.name.toLowerCase()
        ) {
          return true;
        }

        if (note.category === selectedCategory) return true;

        return false;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title?.toLowerCase().includes(query) ||
          note.preview?.toLowerCase().includes(query) ||
          note.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    setFilteredNotes(filtered);
  }, [notes, selectedCategory, searchQuery, categories, showOnlyFavorites]);

  const getCategoryData = (categoryNameOrId) => {
    let category = categories.find(
      (cat) => cat.name.toLowerCase() === categoryNameOrId?.toLowerCase(),
    );
    if (!category) {
      category = categories.find((cat) => cat.id === categoryNameOrId);
    }
    return category || categories[0];
  };

  const getCategoryCount = (categoryId) => {
    if (categoryId === "all") return notes.length;

    return notes.filter((note) => {
      if (note.category_id === categoryId) return true;

      const categoryData = categories.find((cat) => cat.id === categoryId);
      if (
        categoryData &&
        note.category_name?.toLowerCase() === categoryData.name.toLowerCase()
      ) {
        return true;
      }

      if (note.category === categoryId) return true;

      return false;
    }).length;
  };

  const categoryFilters = [{ id: "all", name: "All Notes" }, ...categories];

  const handleView = (note) => {
    setSelectedNote(note);
    setShowViewModal(true);
  };

  const handleEdit = (note) => {
    setSelectedNote(note);
    setShowUpdateModal(true);
  };

  const handleDelete = (note) => {
    setSelectedNote(note);
    setShowDeleteModal(true);
  };

  const handleCreateSuccess = () => {
    fetchNotes();
    setShowCreateModal(false);
  };

  const handleUpdateSuccess = () => {
    fetchNotes();
    setShowUpdateModal(false);
  };

  const handleDeleteSuccess = () => {
    fetchNotes();
    setShowDeleteModal(false);
  };

  const handleToggleFavorite = async (noteId) => {
    try {
      await notesAPI.toggleFavorite(noteId);

      // Refresh data from server to get updated favorite status
      await fetchNotes();

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isVaultLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-red-500 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-3">
              Notes Locked
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-2">
              Your secret notes are protected
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500">
              Unlock your vault with your master password to access your
              encrypted notes
            </p>
          </div>

          {/* Info Cards */}
          <div className="space-y-3 mb-6 sm:mb-8">
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-1">
                  End-to-End Encrypted
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  All notes are encrypted with your master password
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-1">
                  Zero-Knowledge Security
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Only you can decrypt and read your notes
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-1">
                  Private Notes Storage
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Store personal thoughts, ideas, and sensitive information
                </p>
              </div>
            </div>
          </div>

          {/* Unlock Instruction */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-3 sm:p-4 text-center">
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
              💡 Tip: Click the "Unlock Vault" button in the sidebar to enter
              your master password.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="min-h-screen">
          {/* Header */}
          <div className="mb-8">
            {/* Title */}
            {/* Controls: Only show when there are notes OR when filters are active */}
            {notes.length > 0 && (
              <>
                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    {showOnlyFavorites ? "Favorite Notes" : "Secret Notes"}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                    {showOnlyFavorites
                      ? "Your favorite encrypted notes"
                      : "Securely store your private notes and thoughts"}
                  </p>
                </div>

                {/* Controls: Favorites, View Mode, Filters, and New Note Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-6">
                  {/* Left side: Favorites, View Mode, and Filters */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Favorites Filter */}
                    <button
                      onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all ${
                        showOnlyFavorites
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          showOnlyFavorites
                            ? "fill-yellow-500 text-yellow-500"
                            : ""
                        }`}
                      />
                      <span className="hidden sm:inline">Favorites</span>
                    </button>

                    {/* View Mode Toggle - Hidden on mobile */}
                    <div className="hidden md:flex gap-1 sm:gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-lg transition-all ${
                          viewMode === "grid"
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                        title="Grid View"
                      >
                        <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-lg transition-all ${
                          viewMode === "list"
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                        title="List View"
                      >
                        <List className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    {/* Filter Toggle */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-300 text-sm font-medium"
                    >
                      <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Categories</span>
                    </button>
                  </div>

                  {/* Right side: New Note Button */}
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>New Note</span>
                  </button>
                </div>

                {/* Category Filters */}
                {showFilters && (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Categories
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {categoryFilters.map((category) => {
                        const Icon = getCategoryIcon(category.name);
                        const gradient = getCategoryGradient(category.name);
                        const count = getCategoryCount(category.id);
                        const isSelected = selectedCategory === category.id;

                        return (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                              isSelected
                                ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
                                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {category.name}
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                isSelected
                                  ? "bg-white/20"
                                  : "bg-slate-200 dark:bg-slate-600"
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Notes Display */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  Loading notes...
                </p>
              </div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center max-w-md">
                <FileText className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                  {searchQuery || selectedCategory !== "all"
                    ? "No notes found"
                    : "No notes yet"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {searchQuery || selectedCategory !== "all"
                    ? "Try adjusting your filters or search query"
                    : "Create your first encrypted note to get started"}
                </p>
                {!searchQuery && selectedCategory === "all" && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Note
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map((note) => {
                // Backend returns category_name, fallback to category_id or category
                const categoryData = getCategoryData(
                  note.category_name || note.category_id || note.category,
                );
                const Icon = getCategoryIcon(categoryData?.name);
                const gradient = getCategoryGradient(categoryData?.name);

                return (
                  <div
                    key={note.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all overflow-hidden group"
                  >
                    {/* Header */}
                    <div
                      className={`bg-gradient-to-r ${gradient} p-4 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-2 text-white">
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {categoryData?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFavorite(note.id)}
                          className="p-1 rounded-lg hover:bg-white/20 transition-all"
                          title={
                            note.is_favorite
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                        >
                          <Star
                            className={`w-4 h-4 ${
                              note.is_favorite
                                ? "text-yellow-300 fill-yellow-300"
                                : "text-white/70 hover:text-yellow-300"
                            }`}
                          />
                        </button>
                        <Lock className="w-4 h-4 text-white/70" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2 line-clamp-2">
                        {note.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                        {note.preview || "Click to view encrypted content"}
                      </p>

                      {/* Tags */}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {note.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-lg"
                            >
                              #{tag}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="px-2 py-1 text-slate-500 text-xs">
                              +{note.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(note.updated_at || note.created_at)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(note)}
                          className="flex-1 px-3 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(note)}
                          className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(note)}
                          className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {filteredNotes.map((note) => {
                // Backend returns category_name, fallback to category_id or category
                const categoryData = getCategoryData(
                  note.category_name || note.category_id || note.category,
                );
                const Icon = getCategoryIcon(categoryData?.name);
                const gradient = getCategoryGradient(categoryData?.name);

                return (
                  <div
                    key={note.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                  >
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white truncate">
                          {note.title}
                        </h3>
                        <button
                          onClick={() => handleToggleFavorite(note.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex-shrink-0"
                          title={
                            note.is_favorite
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                        >
                          <Star
                            className={`w-4 h-4 ${
                              note.is_favorite
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-slate-400 hover:text-yellow-500"
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          <span className="hidden sm:inline">
                            {categoryData?.name}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(note.updated_at || note.created_at)}
                        </span>
                        {note.tags && note.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {note.tags.length} tags
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => handleView(note)}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      <button
                        onClick={() => handleEdit(note)}
                        className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(note)}
                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-8 px-3 sm:px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Showing {Math.min((currentPage - 1) * perPage + 1, totalItems)}{" "}
                to {Math.min(currentPage * perPage, totalItems)} of {totalItems}
              </span>
              <select
                value={perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="text-xs sm:text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 sm:px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={6}>6 per page</option>
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
                <option value={48}>48 per page</option>
              </select>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
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
                className="px-2 sm:px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <CreateNoteModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          categories={categories}
        />

        <ViewNoteModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          note={selectedNote}
          onEdit={handleEdit}
          onDelete={handleDelete}
          categories={categories}
        />

        <UpdateNoteModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          note={selectedNote}
          onSuccess={handleUpdateSuccess}
          categories={categories}
        />

        <DeleteNoteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          note={selectedNote}
          onSuccess={handleDeleteSuccess}
        />
      </div>
    </div>
  );
};

export default Notes;
