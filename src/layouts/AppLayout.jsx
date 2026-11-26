import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import CreateVaultModal from "@/components/CreateVaultModal";
import UnlockVaultModal from "@/components/UnlockVaultModal";
import LegacyMigrationModal from "@/components/LegacyMigrationModal";
import VaultBackupModal from "@/components/VaultBackupModal";

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
    setSearchQuery("");
    const isPasswordsPage =
      location.pathname === "/app" || location.pathname === "/app/";
    if (!isPasswordsPage) {
      setSelectedCategory("");
    }
  }, [location.pathname]);

  const handleCreateSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleUnlock = () => {
    setIsUnlockModalOpen(true);
  };

  // One prop set shared by the desktop rail and the mobile drawer.
  const sidebarProps = (closeMobile) => ({
    onNewPassword: () => {
      setIsCreateModalOpen(true);
      closeMobile?.();
    },
    selectedCategory,
    onCategoryChange: (category) => {
      setSelectedCategory(category);
      closeMobile?.();
    },
    onUnlock: () => {
      handleUnlock();
      closeMobile?.();
    },
    onNavigate: (action) => {
      if (action === "open_backup_modal") {
        setIsBackupModalOpen(true);
      }
      closeMobile?.();
    },
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar {...sidebarProps()} />
      </div>

      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 gap-0 bg-background border-r border-border"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="h-full overflow-hidden">
            <Sidebar {...sidebarProps(() => setIsMobileSidebarOpen(false))} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onMenuToggle={() => setIsMobileSidebarOpen((prev) => !prev)}
          onUnlock={handleUnlock}
          onBackup={() => setIsBackupModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet
              context={{
                refreshTrigger,
                openCreateModal: () => setIsCreateModalOpen(true),
                openBackupModal: () => setIsBackupModalOpen(true),
                searchQuery,
                selectedCategory,
                onSearchChange: setSearchQuery,
                onCategoryChange: setSelectedCategory,
              }}
            />
          </div>
        </main>
      </div>

      <CreateVaultModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <UnlockVaultModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
      />

      {/* Auto-shows for mek_version=0 accounts */}
      <LegacyMigrationModal />

      <VaultBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onUnlock={handleUnlock}
      />
    </div>
  );
};

export default AppLayout;
