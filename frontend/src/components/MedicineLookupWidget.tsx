import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { medicineService } from '@/services/medicineService';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Pill, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MedicineLookupWidget() {
  const [query, setQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [isFocused, setIsFocused] = useState(false);

  const formatList = (data: any) => {
    if (!data) return 'N/A';
    const str = Array.isArray(data) ? data.join(', ') : String(data);
    const cleaned = str.replace(/[\[\]"']/g, '').split(',').map(s => s.trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned.join(', ') : 'N/A';
  };

  // Fetch suggestions when query changes
  const { data: suggestions, isFetching } = useQuery({
    queryKey: ['medicines', query],
    queryFn: () => medicineService.searchMedicines(query),
    enabled: query.length > 1,
  });

  const handleSelect = (medicine: any) => {
    setSelectedMedicine(medicine);
    setQuery('');
    setIsFocused(false);
  };

  const currentList = suggestions || [];

  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Pill className="h-4 w-4 text-primary" /> Medicine Quick Lookup
      </h3>

      <div className="relative z-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              if (selectedMedicine) setSelectedMedicine(null);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search for a medication..."
            className="pl-9 pr-9 bg-muted/50 border-border"
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
          {query && !isFetching && (
            <button onClick={() => { setQuery(''); setSelectedMedicine(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        <AnimatePresence>
          {isFocused && query.length > 1 && currentList.length > 0 && !selectedMedicine && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} 
              className="absolute top-full left-0 right-0 mt-1 p-1 glass-card shadow-lg border border-border rounded-xl max-h-60 overflow-y-auto z-50"
            >
               {currentList.map((m: any) => (
                 <button key={m.name} onClick={() => handleSelect(m)}
                    className="w-full flex flex-col p-2 hover:bg-muted/80 rounded-lg text-left transition-colors"
                 >
                    <div className="text-sm font-semibold text-foreground">{m.name}</div>
                    <div className="text-[10px] text-muted-foreground">{m.drugClass}</div>
                 </button>
               ))}
            </motion.div>
          )}
          {isFocused && query.length > 1 && currentList.length === 0 && !isFetching && !selectedMedicine && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} 
              className="absolute top-full left-0 right-0 mt-1 p-3 glass-card shadow-lg border border-border rounded-xl text-center text-xs text-muted-foreground z-50"
            >
              No medicines found matching "{query}"
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Medicine Details */}
      <AnimatePresence mode="wait">
        {selectedMedicine && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-3">
              <div>
                <div className="font-bold text-foreground">{selectedMedicine.name}</div>
                <div className="text-xs font-semibold text-primary">{selectedMedicine.drugClass}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Common Uses</div>
                <p className="text-xs text-foreground">{formatList(selectedMedicine.uses)}</p>
              </div>
              <div className="bg-warning/5 border border-warning/10 p-2 rounded-lg">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-warning flex items-center gap-1 mb-0.5"><AlertCircle className="h-3 w-3" /> Side Effects</div>
                <p className="text-[11px] text-muted-foreground">{formatList(selectedMedicine.sideEffects)}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
