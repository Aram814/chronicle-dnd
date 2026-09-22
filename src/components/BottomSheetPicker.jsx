import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { ChevronDown, Check } from 'lucide-react';

export default function BottomSheetPicker({ label, value, options, onChange, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false);

  const selectedLabel = (() => {
    const match = options.find(o => (o && typeof o === 'object' ? o.value : o) === value);
    if (!match) return '';
    return match && typeof match === 'object' ? match.label : match;
  })();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label}: ${selectedLabel || placeholder}`}
        className="w-full flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2.5 text-foreground mt-1 text-left hover:border-amber-700/60 transition-colors"
      >
        <span className={value ? '' : 'text-muted-foreground'}>{selectedLabel || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-card border-amber-900/40 text-foreground rounded-t-2xl">
          <DrawerHeader className="text-center">
            <DrawerTitle className="font-serif text-amber-200 text-lg">{label}</DrawerTitle>
            <DrawerDescription className="text-muted-foreground text-sm">Choose an option</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 max-h-[60vh] overflow-y-auto">
            {options.map((o) => {
              const label = o && typeof o === 'object' ? o.label : o;
              const val = o && typeof o === 'object' ? o.value : o;
              const isEmpty = val === '' || val == null;
              return (
                <button
                  key={val || 'empty'}
                  type="button"
                  onClick={() => {
                    onChange(val);
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-foreground hover:bg-amber-900/20 active:bg-amber-900/30 transition-colors"
                >
                  <span className={isEmpty ? 'text-muted-foreground' : ''}>{isEmpty ? placeholder : label}</span>
                  {value === val && <Check className="w-5 h-5 text-amber-400" />}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}