import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <AlertDialogContent className="bg-card border-border text-card-foreground max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-amber-200">{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-muted-foreground">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
          <AlertDialogCancel className="touch-target border-border bg-transparent text-foreground hover:bg-accent mt-0">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className={`touch-target mt-0 ${destructive ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-amber-700 hover:bg-amber-600 text-amber-50'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}