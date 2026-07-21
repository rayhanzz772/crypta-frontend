import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import CreateVaultModal from "../components/CreateVaultModal";
import UnlockVaultModal from "../components/UnlockVaultModal";
import LegacyMigrationModal from "../components/LegacyMigrationModal";
import VaultBackupModal from "../components/VaultBackupModal";
import { X } from "lucide-react";

const AppLayout = () => {
  const location = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
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
          onNavigate={(action) => {
            if (action === "open_backup_modal") {
              setIsBackupModalOpen(true);
            }
          }}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />

            {/* Sidebar */}
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden shadow-2xl"
            >
              <div className="relative h-full bg-white dark:bg-slate-900">
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
                  onNavigate={(action) => {
                    if (action === "open_backup_modal") {
                      setIsBackupModalOpen(true);
                    }
                    setIsMobileSidebarOpen(false);
                  }}
                />
                {/* Close button */}
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="absolute top-4 -right-12 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onUnlock={handleUnlock}
          onBackup={() => setIsBackupModalOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet
              context={{
                refreshTrigger,
                openCreateModal: () => setIsCreateModalOpen(true),
                openBackupModal: () => setIsBackupModalOpen(true),
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

      {/* Vault Backup Modal */}
      <VaultBackupModal 
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onUnlock={handleUnlock}
      />
    </div>
  );
};

export default AppLayout;
