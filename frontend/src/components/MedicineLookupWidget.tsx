import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { medicineService } from '@/services/medicineService';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Pill, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MedicineLookupWidget() {
  const [query, setQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [isFocused, setIsFocused] = useState(false);
  // Track whether the user is clicking inside the dropdown so we don't close it on blur
  const isMouseDownInDropdown = useRef(false);

  const formatList = (data: any) => {
    if (!data) return 'N/A';
    const str = Array.isArray(data) ? data.join(', ') : String(data);
    const cleaned = str.replace(/[\[\]"']/g, '').split(',').map(s => s.trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned.join(', ') : 'N/A';
  };

  // Fetch suggestions when query changes — results are cached for 5 min
  const { data: suggestions, isFetching, isError } = useQuery({
    queryKey: ['medicines-search', query.trim().toLowerCase()],
    queryFn: () => medicineService.searchMedicines(query.trim()),
    enabled: query.trim().length > 1,
    staleTime: 5 * 60 * 1000, // 5 minutes — survive navigation / refresh
    gcTime: 10 * 60 * 1000,   // keep in cache for 10 min
    retry: 1,
  });

  const handleSelect = (medicine: any) => {
    setSelectedMedicine(medicine);
    setQuery('');
    setIsFocused(false);
    isMouseDownInDropdown.current = false;
  };

  const handleClear = () => {
    setQuery('');
    setSelectedMedicine(null);
    setIsFocused(false);
  };

  const showDropdown = isFocused && query.trim().length > 1 && !selectedMedicine;
  const currentList = suggestions || [];

  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Pill className="h-4 w-4 text-primary" /> Medicine Quick Lookup
      </h3>

      <div className="relative" style={{ zIndex: 50 }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              if (selectedMedicine) setSelectedMedicine(null);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Only close if the user is NOT clicking inside the dropdown
              if (!isMouseDownInDropdown.current) {
                setIsFocused(false);
              }
            }}
            placeholder="Search for a medication..."
            className="pl-9 pr-9 bg-muted/50 border-border"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
          {query && !isFetching && (
            <button
              onMouseDown={e => e.preventDefault()} // prevent blur firing first
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full left-0 right-0 mt-1 glass-card shadow-xl border border-border rounded-xl overflow-hidden"
              style={{ zIndex: 9999 }}
              // Prevent onBlur from firing when clicking inside dropdown
              onMouseDown={() => { isMouseDownInDropdown.current = true; }}
              onMouseUp={() => { isMouseDownInDropdown.current = false; }}
            >
              {isError && (
                <div className="p-3 text-center text-xs text-destructive">
                  Failed to load medicines. Please try again.
                </div>
              )}

              {!isError && isFetching && (
                <div className="p-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Searching…
                </div>
              )}

              {!isError && !isFetching && currentList.length > 0 && (
                <div className="max-h-60 overflow-y-auto p-1">
                  {currentList.map((m: any) => (
                    <button
                      key={m._id || m.name}
                      onMouseDown={e => e.preventDefault()} // critical: prevent input blur before click
                      onClick={() => handleSelect(m)}
                      className="w-full flex flex-col px-3 py-2.5 hover:bg-muted/80 rounded-lg text-left transition-colors"
                    >
                      <div className="text-sm font-semibold text-foreground">{m.name}</div>
                      {m.drugClass && (
                        <div className="text-[10px] text-muted-foreground">{m.drugClass}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!isError && !isFetching && currentList.length === 0 && (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  No medicines found for "{query}"
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Medicine Details */}
      <AnimatePresence mode="wait">
        {selectedMedicine && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-foreground">{selectedMedicine.name}</div>
                  {selectedMedicine.drugClass && (
                    <div className="text-xs font-semibold text-primary">{selectedMedicine.drugClass}</div>
                  )}
                </div>
                <button
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-foreground mt-0.5"
                  aria-label="Close details"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {selectedMedicine.uses?.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Common Uses
                  </div>
                  <p className="text-xs text-foreground">{formatList(selectedMedicine.uses)}</p>
                </div>
              )}

              {selectedMedicine.dosage && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Dosage
                  </div>
                  <p className="text-xs text-foreground">{selectedMedicine.dosage}</p>
                </div>
              )}

              {selectedMedicine.sideEffects?.length > 0 && (
                <div className="bg-warning/5 border border-warning/10 p-2 rounded-lg">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-warning flex items-center gap-1 mb-0.5">
                    <AlertCircle className="h-3 w-3" /> Side Effects
                  </div>
                  <p className="text-[11px] text-muted-foreground">{formatList(selectedMedicine.sideEffects)}</p>
                </div>
              )}

              {selectedMedicine.precautions?.length > 0 && (
                <div className="bg-info/5 border border-info/10 p-2 rounded-lg">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-info mb-0.5">
                    Precautions
                  </div>
                  <p className="text-[11px] text-muted-foreground">{formatList(selectedMedicine.precautions)}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
