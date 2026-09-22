import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { ChevronDown, Check } from 'lucide-react';

export default function BottomSheetPicker({ label, value, options, onChange, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label}: ${value || placeholder}`}
        className="w-full flex items-center justify-between bg-stone-950 border border-stone-700 rounded-lg px-3 py-2.5 text-stone-200 mt-1 text-left hover:border-amber-700/60 transition-colors"
      >
        <span className={value ? '' : 'text-stone-500'}>{value || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-stone-500 flex-shrink-0" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-stone-900 border-amber-900/40 text-stone-200 rounded-t-2xl">
          <DrawerHeader className="text-center">
            <DrawerTitle className="font-serif text-amber-200 text-lg">{label}</DrawerTitle>
            <DrawerDescription className="text-stone-500 text-sm">Choose an option</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 max-h-[60vh] overflow-y-auto">
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-stone-200 hover:bg-amber-900/20 active:bg-amber-900/30 transition-colors"
              >
                <span>{o}</span>
                {value === o && <Check className="w-5 h-5 text-amber-400" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}