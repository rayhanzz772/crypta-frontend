import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import CreateVaultModal from "../components/CreateVaultModal";
import UnlockVaultModal from "../components/UnlockVaultModal";
import LegacyMigrationModal from "../components/LegacyMigrationModal";
import { X } from "lucide-react";

const AppLayout = () => {
  const location = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Reset search and category when navigating between pages
  useEffect(() => {
    setSearchQuery(""); // Clear search on page change
    const isPasswordsPage =
      location.pathname === "/app" || location.pathname === "/app/";
    if (!isPasswordsPage) {
      setSelectedCategory("");
    }
  }, [location.pathname]);

  const handleCreateSuccess = () => {
    setRefreshTrigger((prev) => prev + 1); // Trigger refresh in child components
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleUnlock = () => {
    setIsUnlockModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          onNewPassword={() => setIsCreateModalOpen(true)}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          onUnlock={handleUnlock}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
            <div className="relative h-full">
              <Sidebar
                onNewPassword={() => {
                  setIsCreateModalOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                selectedCategory={selectedCategory}
                onCategoryChange={(category) => {
                  handleCategoryChange(category);
                  setIsMobileSidebarOpen(false);
                }}
                onUnlock={() => {
                  handleUnlock();
                  setIsMobileSidebarOpen(false);
                }}
                onNavigate={() => setIsMobileSidebarOpen(false)}
              />
              {/* Close button */}
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onUnlock={handleUnlock}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet
              context={{
                refreshTrigger,
                openCreateModal: () => setIsCreateModalOpen(true),
                searchQuery,
                selectedCategory,
                onSearchChange: handleSearch,
                onCategoryChange: handleCategoryChange,
              }}
            />
          </div>
        </main>
      </div>

      {/* Global Create Vault Modal */}
      <CreateVaultModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Unlock Vault Modal */}
      <UnlockVaultModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
      />

      {/* Legacy Migration Modal — auto-shows for mek_version=0 accounts */}
      <LegacyMigrationModal />
    </div>
  );
};

export default AppLayout;
