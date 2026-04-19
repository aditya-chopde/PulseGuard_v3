import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { medicineService } from '@/services/medicineService';
import { Input } from '@/components/ui/input';
import { Search, Pill, AlertCircle, Info, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const POPULAR = [
  'Aspirin', 'Atenolol', 'Lisinopril', 'Metformin',
  'Amlodipine', 'Atorvastatin',
];

export default function MedicinePage() {
  const [query, setQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isMouseDownInDropdown = useRef(false);

  const getCleanArray = (data: any): string[] => {
    if (!data) return [];
    const str = Array.isArray(data) ? data.join(',') : String(data);
    return str.replace(/[\[\]"']/g, '').split(',').map(s => s.trim()).filter(Boolean);
  };

  const { data: suggestions = [], isFetching, isError } = useQuery({
    queryKey: ['medicines-search', query.trim().toLowerCase()],
    queryFn: () => medicineService.searchMedicines(query.trim()),
    enabled: query.trim().length > 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const handleSelect = (medicine: any) => {
    setSelectedMedicine(medicine);
    setQuery(medicine.name);
    setIsFocused(false);
    isMouseDownInDropdown.current = false;
  };

  const handleClear = () => {
    setQuery('');
    setSelectedMedicine(null);
    setIsFocused(false);
  };

  const handlePopularClick = async (name: string) => {
    setQuery(name);
    try {
      const results = await medicineService.searchMedicines(name);
      if (results?.length > 0) {
        setSelectedMedicine(results[0]);
      }
    } catch {
      // ignore
    }
    setIsFocused(false);
  };

  const showDropdown = isFocused && query.trim().length > 1 && !selectedMedicine;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2 mt-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Pill className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Medicine Dictionary</h1>
          <p className="text-muted-foreground text-sm">
            Search for cardiac medications for educational insights and dosages.
          </p>
        </div>

        {/* Search Box */}
        <div className="relative" style={{ zIndex: 50 }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="e.g. Atenolol, Lisinopril, Aspirin…"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                if (selectedMedicine) setSelectedMedicine(null);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                if (!isMouseDownInDropdown.current) setIsFocused(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Escape') handleClear();
              }}
              className="bg-card border-border pl-11 pr-11 h-12 rounded-xl shadow-sm text-base"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {isFetching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
            {query && !isFetching && (
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 right-0 mt-2 glass-card shadow-2xl border border-border rounded-xl overflow-hidden"
                style={{ zIndex: 9999 }}
                onMouseDown={() => { isMouseDownInDropdown.current = true; }}
                onMouseUp={() => { isMouseDownInDropdown.current = false; }}
              >
                {isError && (
                  <div className="p-3 text-center text-xs text-destructive">
                    Failed to search. Please try again.
                  </div>
                )}

                {!isError && isFetching && (
                  <div className="p-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
                  </div>
                )}

                {!isError && !isFetching && suggestions.length > 0 && (
                  <div className="max-h-60 overflow-y-auto p-2">
                    {suggestions.map((s: any) => (
                      <button
                        key={s._id || s.name}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => handleSelect(s)}
                        className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/80 rounded-lg text-left transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Pill className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{s.name}</div>
                          {s.drugClass && (
                            <div className="text-[10px] text-muted-foreground">{s.drugClass}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!isError && !isFetching && suggestions.length === 0 && (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No medicines found for "{query}"
                  </div>
                )}
              </motion.div>
            )}
            {showSuggestions && query && suggestions.length === 0 && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 right-[100px] mt-2 glass-card p-4 shadow-2xl border border-border rounded-xl z-50 text-center text-sm text-muted-foreground">
                 No medicines found matching "{query}"
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Popular Searches — shown when nothing is selected */}
        <AnimatePresence>
          {!selectedMedicine && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-6 border-dashed opacity-80"
            >
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Popular Searches</h3>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map(name => (
                  <button
                    key={name}
                    onClick={() => handlePopularClick(name)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-border"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Card */}
        <AnimatePresence mode="wait">
          {selectedMedicine && (
            <motion.div
              key={selectedMedicine._id || selectedMedicine.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedMedicine.name}</h2>
                  {selectedMedicine.drugClass && (
                    <span className="text-sm text-primary font-medium">{selectedMedicine.drugClass}</span>
                  )}
                </div>
                <button
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-foreground mt-1"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {selectedMedicine.uses?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Uses</h3>
                  <p className="text-sm text-muted-foreground">
                    {getCleanArray(selectedMedicine.uses).join(', ')}
                  </p>
                </div>
              )}

              {selectedMedicine.dosage && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Dosage</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedMedicine.dosage.replace(/["[\]]/g, '')}
                  </p>
                </div>
              )}

              {selectedMedicine.sideEffects?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Side Effects</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {getCleanArray(selectedMedicine.sideEffects).map((se: string) => (
                      <span key={se} className="px-2 py-0.5 rounded-full text-xs bg-warning/10 text-warning">
                        {se}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedMedicine.precautions?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Precautions</h3>
                  <ul className="space-y-1">
                    {getCleanArray(selectedMedicine.precautions).map((p: string) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Info className="h-3.5 w-3.5 text-info mt-0.5 flex-shrink-0" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                This information is for educational purposes only. Always consult a healthcare professional.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
