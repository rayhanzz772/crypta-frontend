import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const sizeMap = {
  xs: "sm:max-w-sm",
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  "2xl": "sm:max-w-6xl",
};

/**
 * House wrapper over shadcn Dialog: focus trap, ESC close and scroll lock stay
 * consistent across every modal in the app.
 *
 * `title` renders a visible header. Modals that keep their own custom heading
 * pass `srTitle` instead, so the dialog still has an accessible name.
 */
const Modal = ({
  isOpen,
  onClose,
  size = "md",
  title,
  description,
  srTitle,
  className,
  showCloseButton = true,
  children,
  ...props
}) => (
  <Dialog open={!!isOpen} onOpenChange={(open) => !open && onClose?.()}>
    <DialogContent
      showCloseButton={showCloseButton}
      className={cn(
        sizeMap[size],
        "max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600",
        className
      )}
      {...props}
    >
      {title || description ? (
        <DialogHeader>
          {title ? <DialogTitle>{title}</DialogTitle> : null}
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
      ) : (
        <DialogTitle className="sr-only">{srTitle || "Dialog"}</DialogTitle>
      )}
      {children}
    </DialogContent>
  </Dialog>
);

export default Modal;
