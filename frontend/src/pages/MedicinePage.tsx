import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { medicineService } from '@/services/medicineService';
import { Input } from '@/components/ui/input';
import { Search, Pill, AlertCircle, Info, X, Loader2, Filter, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

// Helper
const getCleanArray = (data: any): string[] => {
  if (!data) return [];
  const str = Array.isArray(data) ? data.join(',') : String(data);
  return str.replace(/[\[\]"']/g, '').split(',').map(s => s.trim()).filter(Boolean);
};

// Highlighter Component
const HighlightText = ({ text, highlights }: { text: string, highlights: string[] }) => {
  if (!text || !highlights.length) return <>{text}</>;
  
  // Filter out single characters to avoid messy highlights on common letters
  const validHighlights = highlights.filter(h => h.length > 1);
  if (validHighlights.length === 0) return <>{text}</>;

  const sortedHighlights = [...validHighlights].sort((a, b) => b.length - a.length);
  const regex = new RegExp(`(${sortedHighlights.join('|')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        sortedHighlights.some(h => h.toLowerCase() === part.toLowerCase()) 
          ? <mark key={i} className="bg-warning/30 text-warning px-0.5 rounded-sm font-semibold bg-transparent">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
};

type FilterType = { category: string; value: string };

const COMMON_DRUG_CLASSES = [
  'ACE Inhibitor', 'Analgesic/Antipyretic', 'Antibiotic', 'Anticoagulant', 
  'Anticonvulsant', 'Antidepressant', 'Antidiabetic (Biguanide)', 
  'Antihistamine', 'Antihypertensive (Beta-Blocker)', 'NSAID', 'Statin'
];

const COMMON_DOSAGE_FORMS = [
  'Capsule', 'Tablet', 'Injection', 'Syrup', 'Cream', 'Ointment', 'Drops'
];

const COMMON_ROUTES = [
  'Oral', 'Intravenous', 'Intramuscular', 'Subcutaneous', 'Topical', 'Inhalation', 'Rectal'
];

const COMMON_STRENGTHS = [
  '5mg', '10mg', '20mg', '50mg', '100mg', '250mg', '500mg', '625mg', '1000mg'
];

export default function MedicinePage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const isMouseDownInDropdown = useRef(false);

  // Debounce input for smooth UX
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.toLowerCase().trim());
    }, 400); // Increased debounce to 400ms since it makes network requests
    return () => clearTimeout(handler);
  }, [query]);

  // Construct search parameters for the backend
  const searchParams = useMemo(() => {
    const params: any = { q: debouncedQuery };
    activeFilters.forEach(f => {
      if (f.category === 'Drug Class') params.drugClass = f.value;
      if (f.category === 'Dosage Form') params.dosageForm = f.value;
      if (f.category === 'Disease/Uses') params.uses = f.value;
      if (f.category === 'Ingredients') params.ingredients = f.value;
      if (f.category === 'Route') params.routeOfAdministration = f.value;
      if (f.category === 'Strength') params.dosageStrength = f.value;
      if (f.category === 'Availability') {
        if (f.value === 'OTC') params.isAvailableOTC = 'true';
        if (f.value === 'Prescription Required') params.requiresPrescription = 'true';
      }
    });
    return params;
  }, [debouncedQuery, activeFilters]);

  // Fetch medicines dynamically from the backend using Server-Side Search
  const { data: filteredMedicines = [], isLoading, isFetching } = useQuery({
    queryKey: ['medicines', 'search', searchParams],
    queryFn: () => medicineService.searchMedicines(searchParams),
    staleTime: 5 * 60 * 1000,
  });

  // Since we rely on server-side search, we use predefined common dropdowns for Class and Form
  const filterOptions = useMemo(() => ({
    'Drug Class': COMMON_DRUG_CLASSES.sort(),
    'Dosage Form': COMMON_DOSAGE_FORMS.sort(),
    'Route': COMMON_ROUTES.sort(),
    'Strength': COMMON_STRENGTHS.sort(),
    'Availability': ['OTC', 'Prescription Required']
  }), []);

  // Autocomplete Suggestions logic - We now use the CURRENTLY RETURNED search items
  const suggestions = useMemo(() => {
    if (debouncedQuery.length < 2) return null;
    if (!filteredMedicines.length) return null;
    
    const meds = filteredMedicines.filter((m: any) => m.name.toLowerCase().includes(debouncedQuery)).slice(0, 3).map((m: any) => m.name);
    
    const exactUses = new Set<string>();
    const exactIng = new Set<string>();
    
    filteredMedicines.forEach((m: any) => {
       getCleanArray(m.uses).forEach(u => {
           if (u.toLowerCase().includes(debouncedQuery)) exactUses.add(u);
       });
       getCleanArray(m.ingredients).forEach(i => {
           if (i.toLowerCase().includes(debouncedQuery)) exactIng.add(i);
       });
    });
    
    return {
       'Medicines': Array.from(meds),
       'Diseases / Conditions': Array.from(exactUses).slice(0, 3),
       'Active Ingredients': Array.from(exactIng).slice(0, 3)
    };
  }, [debouncedQuery, filteredMedicines]);

  // Handlers
  const toggleFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      const exists = prev.find(f => f.category === category && f.value === value);
      if (exists) return prev.filter(f => !(f.category === category && f.value === value));
      return [...prev, { category, value }];
    });
  };

  const handleAutocompleteSelect = (category: string, value: string) => {
    if (category === 'Medicines') {
        setQuery(value);
    } else {
        const filterCatMap: Record<string, string> = {
            'Diseases / Conditions': 'Disease/Uses',
            'Active Ingredients': 'Ingredients'
        };
        const actualCat = filterCatMap[category];
        if (actualCat) {
            const exists = activeFilters.find(f => f.category === actualCat && f.value === value);
            if (!exists) setActiveFilters(prev => [...prev, { category: actualCat, value }]);
            setQuery(''); // clear typed text
        }
    }
    setIsFocused(false);
  };

  const activeTerms = debouncedQuery.split(' ').filter(Boolean);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2 mt-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Pill className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Medicine Database</h1>
          <p className="text-muted-foreground text-sm">
            Search dynamically by name, disease, ingredients, or multi-keywords.
          </p>
        </div>

        {/* Search Bar Block */}
        <form 
          className="relative" style={{ zIndex: 50 }}
          onSubmit={(e) =>{
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search e.g. 'hypertension atenolol' or 'amlodipine'..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                if (!isMouseDownInDropdown.current) setIsFocused(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              className="bg-card border-border pl-11 pr-11 h-14 rounded-xl shadow-sm text-base focus-visible:ring-primary/30"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-muted p-1 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Grouped Autocomplete Suggestions */}
          <AnimatePresence>
            {isFocused && suggestions && Object.values(suggestions).some(arr => arr.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 right-0 mt-2 glass-card shadow-2xl border border-border rounded-xl overflow-hidden py-2"
                style={{ zIndex: 9999 }}
                onMouseDown={() => { isMouseDownInDropdown.current = true; }}
                onMouseUp={() => { isMouseDownInDropdown.current = false; }}
              >
                {Object.entries(suggestions).map(([groupName, items]) => {
                  if (!items.length) return null;
                  return (
                    <div key={groupName} className="mb-2 last:mb-0">
                      <div className="px-4 py-1 text-[10px] font-black text-muted-foreground uppercase tracking-wider bg-muted/20">
                        {groupName}
                      </div>
                      {items.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => handleAutocompleteSelect(groupName, item)}
                          className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/80 transition-colors flex items-center gap-2"
                        >
                          <Search className="h-3 w-3 text-muted-foreground" />
                          <HighlightText text={item} highlights={activeTerms} />
                        </button>
                      ))}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Compact Filters UI */}
        <div className="flex flex-wrap items-center gap-2">
           <Filter className="h-4 w-4 text-muted-foreground mr-1" />
           {Object.entries(filterOptions).map(([catName, options]) => (
              <Popover key={catName}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-border bg-card hover:bg-muted text-xs rounded-full">
                    {catName} <ChevronDown className="h-3 w-3 ml-1.5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 rounded-xl" align="start">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">Filter by {catName}</div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {options.map(opt => {
                      const isSelected = activeFilters.some(f => f.category === catName && f.value === opt);
                      return (
                        <button
                          key={opt}
                          onClick={() => toggleFilter(catName, opt)}
                          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted text-sm text-left transition-colors"
                        >
                          <span className={isSelected ? 'font-medium text-primary' : 'text-foreground'}>{opt}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
           ))}
        </div>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center bg-muted/30 p-2 rounded-xl border border-border">
            <span className="text-xs text-muted-foreground mx-2 font-medium">Active Filters:</span>
            {activeFilters.map(f => (
              <span key={`${f.category}-${f.value}`} className="group flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold cursor-default">
                <span className="opacity-70 font-normal mr-0.5">{f.category}:</span> {f.value}
                <button 
                  onClick={() => toggleFilter(f.category, f.value)}
                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button onClick={() => setActiveFilters([])} className="ml-auto text-xs text-muted-foreground hover:text-foreground px-2 py-1">Clear All</button>
          </div>
        )}

        {/* Results Mapping */}
        {filteredMedicines.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-10 text-center border-dashed">
             {isLoading || isFetching ? (
               <div className="flex flex-col items-center justify-center py-4">
                 <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                 <p className="text-sm text-muted-foreground">Searching medicine database...</p>
               </div>
             ) : (
               <>
                 <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                 <h3 className="text-lg font-semibold text-foreground">No matches found</h3>
                 <p className="text-sm text-muted-foreground mt-1">Try relaxing your filters or checking your spelling.</p>
                 <Button onClick={() => { setQuery(''); setActiveFilters([]); }} variant="outline" className="mt-4">Reset Search</Button>
               </>
             )}
          </motion.div>
        ) : (
          <div className="space-y-4 pb-10">
             <div className="flex justify-between items-center px-1">
                <div className="text-xs text-muted-foreground">
                    {filteredMedicines.length === 50 ? 'Top 50 medicines found' : `${filteredMedicines.length} medicines found`}
                </div>
                {isFetching && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />}
             </div>
             
             <AnimatePresence>
               {filteredMedicines.map((med: any) => (
                 <motion.div
                   key={med._id || med.name}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="glass-card p-6 space-y-4"
                 >
                   <div className="flex justify-between items-start">
                     <div className="space-y-1">
                       <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-foreground">
                             <HighlightText text={med.brandName || med.name} highlights={activeTerms} />
                          </h2>
                          {med.isAvailableOTC && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">OTC</span>
                          )}
                          {med.requiresPrescription && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">Rx</span>
                          )}
                       </div>
                       {med.genericName && (
                         <p className="text-sm text-muted-foreground italic">
                           Generic: <HighlightText text={med.genericName} highlights={activeTerms} />
                         </p>
                       )}
                       <div className="flex gap-2 items-center mt-1 text-sm font-medium">
                          {med.drugClass && <span className="text-primary"><HighlightText text={med.drugClass} highlights={activeTerms} /></span>}
                          {med.dosageForm && <span className="text-muted-foreground border-l border-border pl-2"><HighlightText text={med.dosageForm} highlights={activeTerms} /></span>}
                          {med.routeOfAdministration && <span className="text-muted-foreground border-l border-border pl-2"><HighlightText text={med.routeOfAdministration} highlights={activeTerms} /></span>}
                       </div>
                     </div>
                     
                     {(med.dosageStrength || med.dosageFrequency) && (
                       <div className="text-right">
                         {med.dosageStrength && <div className="text-lg font-bold text-primary">{med.dosageStrength}</div>}
                         {med.dosageFrequency && <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{med.dosageFrequency}</div>}
                       </div>
                     )}
                   </div>

                   {med.uses?.length > 0 && (
                     <div>
                       <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5"><Info className="h-3.5 w-3.5 text-muted-foreground" /> Uses & Conditions</h3>
                       <p className="text-sm text-muted-foreground leading-relaxed">
                         {getCleanArray(med.uses).map((u, i, arr) => (
                           <span key={i}>
                             <HighlightText text={u} highlights={activeTerms} />{i < arr.length - 1 ? ', ' : ''}
                           </span>
                         ))}
                       </p>
                     </div>
                   )}

                   <div className="grid sm:grid-cols-2 gap-6">
                      {med.ingredients?.length > 0 && (
                       <div>
                         <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><Pill className="h-3.5 w-3.5 text-info" /> Active Ingredients</h3>
                         <div className="space-y-2">
                           {getCleanArray(med.ingredients).map((ing: string) => {
                             const percentage = med.ingredient_percentages?.[ing] || (med.ingredient_percentages instanceof Map ? med.ingredient_percentages.get(ing) : med.ingredient_percentages?.[ing]);
                             return (
                               <div key={ing} className="flex flex-col gap-1">
                                 <div className="flex justify-between items-center text-xs">
                                   <span className="font-medium text-foreground/80"><HighlightText text={ing} highlights={activeTerms} /></span>
                                   {percentage && <span className="text-primary font-bold">{percentage}</span>}
                                 </div>
                                 {percentage && (
                                   <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                                     <div 
                                       className="bg-primary h-full rounded-full opacity-60" 
                                       style={{ width: percentage.includes('%') ? percentage : `${percentage}%` }}
                                     />
                                   </div>
                                 )}
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     )}

                     <div className="space-y-4">
                       {med.sideEffects?.length > 0 && (
                         <div className="p-3 rounded-lg bg-warning/5 border border-warning/10">
                           <h3 className="text-[10px] font-bold uppercase tracking-wider text-warning mb-1.5 flex items-center gap-1">
                             <AlertCircle className="h-3 w-3" /> Side Effects
                           </h3>
                           <div className="flex flex-wrap gap-1">
                             {getCleanArray(med.sideEffects).map((se: string) => (
                               <span key={se} className="text-xs text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded">
                                 {se}
                               </span>
                             ))}
                           </div>
                         </div>
                       )}
                       
                       {(med.dosage || med.precautions?.length > 0) && (
                         <div className="p-3 rounded-lg bg-muted/20 border border-border">
                           <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 mb-1.5">Guidelines & Precautions</h3>
                           {med.dosage && <p className="text-xs text-foreground font-medium mb-2">{med.dosage.replace(/["[\]]/g, '')}</p>}
                           {med.precautions?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {getCleanArray(med.precautions).map((p: string) => (
                                  <span key={p} className="text-[10px] text-muted-foreground italic">• {p}</span>
                                ))}
                              </div>
                           )}
                         </div>
                       )}
                     </div>
                   </div>
                 </motion.div>
               ))}
             </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
