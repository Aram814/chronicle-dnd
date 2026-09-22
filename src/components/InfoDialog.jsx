import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export default function InfoDialog({ open, onClose, title, description, buttonLabel = 'OK' }) {
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
        <AlertDialogFooter className="sm:justify-end">
          <Button onClick={onClose} className="bg-amber-700 hover:bg-amber-600 text-amber-50">
            {buttonLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}