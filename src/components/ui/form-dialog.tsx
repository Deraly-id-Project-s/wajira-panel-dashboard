import { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  maxWidthClassName?: string;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  isSubmitting = false,
  maxWidthClassName = "max-w-md",
}: FormDialogProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        className={cn(
          "w-full max-h-[90vh] overflow-hidden flex flex-col rounded-xl border-0 bg-white p-0 shadow-2xl",
          maxWidthClassName
        )}
      >
        <DialogHeader className="px-6 py-5 border-b shrink-0 text-left">
          <DialogTitle className="text-xl font-semibold text-foreground tracking-tight">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-gray-500 mt-1">{description}</DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
            {children}
          </div>

          <div className="shrink-0 flex justify-center items-center gap-6 px-6 py-4 border-t bg-gray-50/50">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="text-muted-foreground font-medium hover:text-foreground hover:bg-transparent"
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1e293b] hover:bg-[#0f172a] text-white font-medium min-w-[120px] rounded-lg shadow-sm"
            >
              {isSubmitting ? (
                "Menyimpan..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
