import { useState, useEffect } from "react";
import { copyText } from "@/utils/desktop";
import {
  X,
  LayoutGrid,
  Copy,
  Edit,
  Trash2,
  Unlock,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { decryptField, safeDecryptField } from "../utils/crypto";
import { getCategoryIcon, getCategoryGradient } from "../utils/categoryIcons";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

const ViewNoteModal = ({
  isOpen,
  onClose,
  note,
  onEdit,
  onDelete,
  categories,
}) => {
  const { mek } = useAuth();
  const [decryptedContent, setDecryptedContent] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState("");

  useEffect(() => {
    if (isOpen && note) {
      decryptNote();
    } else {
      setDecryptedContent("");
      setDecryptError("");
    }
  }, [isOpen, note]);

  // Pure client-side decryption.
  const decryptNote = async () => {
    if (!note?.note || !mek) return;

    try {
      setIsDecrypting(true);
      setDecryptError("");
      const content = await safeDecryptField(note.note, mek);
      setDecryptedContent(content);
    } catch (error) {
      const errorMessage = "Failed to decrypt note. Is your vault unlocked?";
      setDecryptError(errorMessage);
      toast.error("Decryption failed");
      console.error("Note decrypt error:", error);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleCopy = () => {
    if (decryptedContent) {
      copyText(decryptedContent, { sensitive: true });
      toast.success("Note content copied to clipboard!");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen || !note) return null;

  // Backend returns category_name, try to match by name first, then by ID
  const categoryData =
    categories.find(
      (cat) => cat.name.toLowerCase() === note.category_name?.toLowerCase(),
    ) ||
    categories.find((cat) => cat.id === note.category_id) ||
    categories.find((cat) => cat.id === note.category) ||
    categories[1];
  const CategoryIcon = getCategoryIcon(categoryData?.name);
  const categoryGradient = getCategoryGradient(categoryData?.name);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      srTitle={note.title}
      showCloseButton={false}
      className="p-0 max-h-[90vh] flex flex-col"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 shrink-0 bg-gradient-to-br ${categoryGradient} rounded-xl flex items-center justify-center shadow-sm`}
          >
            {decryptedContent ? (
              <Unlock className="w-5 h-5 text-white" />
            ) : (
              <CategoryIcon className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              {note.title}
            </h2>
            <Badge
              variant={decryptedContent ? "default" : "outline"}
              className="mt-1 text-[10px] px-1.5 py-0 gap-1"
            >
              {decryptedContent ? "Decrypted" : "Encrypted"}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0 text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Tags */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Tags
              </span>
            </div>
            {(() => {
              const tags = normalizeTags(note.tags);
              return tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs rounded-md"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No tags</p>
              );
            })()}
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Category
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {categoryData?.name || "Uncategorized"}
            </p>
          </div>

          {/* Last Updated */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Last Updated
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {formatDate(note.updated_at || note.created_at)}
            </p>
          </div>
        </div>

        {/* Decrypted Content */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Content
              </span>
            </div>
            {decryptedContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-xs text-muted-foreground"
              >
                <Copy />
                Copy
              </Button>
            )}
          </div>

          <div className="min-h-[180px] p-3 sm:p-4 bg-muted/50 dark:bg-background/60 border border-border rounded-lg">
            {isDecrypting ? (
              <div className="flex items-center justify-center py-10">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Decrypting note...
                  </p>
                </div>
              </div>
            ) : decryptError ? (
              <div className="flex items-center justify-center py-10">
                <div className="text-center max-w-md px-4">
                  <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                  <p className="text-sm text-destructive mb-3">{decryptError}</p>
                  <Button variant="link" onClick={decryptNote} className="p-0 h-auto text-sm">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : decryptedContent ? (
              <pre className="whitespace-pre-wrap break-words text-foreground font-mono text-xs sm:text-sm">
                {decryptedContent}
              </pre>
            ) : (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-muted-foreground">
                  The content was encrypted
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - sticky bottom bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 p-4 sm:px-6 pt-3 border-t border-border bg-card shrink-0">
        <Button
          variant="secondary"
          onClick={onClose}
          className="order-3 sm:order-1 flex-1 rounded-xl font-semibold"
        >
          Close
        </Button>
        <Button
          onClick={() => {
            onClose();
            onEdit(note);
          }}
          className="order-1 sm:order-2 flex-1 rounded-xl font-semibold"
        >
          <Edit />
          Edit Note
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            onClose();
            onDelete(note);
          }}
          className="order-2 sm:order-3 flex-1 sm:flex-none rounded-xl font-semibold"
        >
          <Trash2 />
          Delete
        </Button>
      </div>
    </Modal>
  );
};

export default ViewNoteModal;
