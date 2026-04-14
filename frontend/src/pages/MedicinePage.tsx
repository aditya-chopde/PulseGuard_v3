import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { medicineService } from '@/services/medicineService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Pill, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MedicinePage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [medicinesList, setMedicinesList] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchMeds = async () => {
      try {
        const meds = await medicineService.getMedicines();
        setMedicinesList(meds);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMeds();
  }, []);

  const suggestions = query 
    ? medicinesList.filter(m => m.name.toLowerCase().includes(query.toLowerCase()) || m.drugClass.toLowerCase().includes(query.toLowerCase())).slice(0, 5) 
    : [];

  const handleSearch = async () => {
    if (!query.trim()) return;
    setShowSuggestions(false);
    try {
      const searchResults = await medicineService.searchMedicines(query);
      if (searchResults && searchResults.length > 0) {
        setResult(searchResults[0]);
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
      }
    } catch (err) {
      setResult(null);
      setNotFound(true);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2 mt-4">
           <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
             <Pill className="h-8 w-8 text-primary" />
           </div>
           <h1 className="text-3xl font-bold text-foreground">Medicine Dictionary</h1>
           <p className="text-muted-foreground text-sm">Search for cardiac medications for educational insights and dosages.</p>
        </div>

        <div className="relative z-10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="e.g. Atenolol, Lisinopril..." 
                value={query} 
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }} 
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                className="bg-card border-border pl-11 h-12 rounded-xl shadow-sm text-base" 
              />
              {query && (
                <button onClick={() => {setQuery(''); setShowSuggestions(false); setResult(null);}} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button onClick={handleSearch} className="h-12 px-6 rounded-xl gradient-primary text-primary-foreground border-0 shadow-md">Search</Button>
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && query && suggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 right-[100px] mt-2 glass-card p-2 shadow-2xl border border-border rounded-xl">
                 {suggestions.map(s => (
                    <button key={s.name} onClick={() => { setQuery(s.name); setResult(s); setShowSuggestions(false); setNotFound(false); }}
                       className="w-full flex items-center justify-between p-2 hover:bg-muted/80 rounded-lg text-left transition-colors"
                    >
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                             <Pill className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                             <div className="text-sm font-semibold text-foreground">{s.name}</div>
                             <div className="text-[10px] text-muted-foreground">{s.drugClass}</div>
                          </div>
                       </div>
                    </button>
                 ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!result && !notFound && (
           <div className="glass-card p-6 border-dashed opacity-70">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Popular Searches</h3>
              <div className="flex flex-wrap gap-2">
                {medicinesList.slice(0,6).map((m) => (
                  <button key={m.name} onClick={() => { setQuery(m.name); setResult(m); setNotFound(false); setShowSuggestions(false); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-border">
                    {m.name}
                  </button>
                ))}
              </div>
           </div>
        )}

        <AnimatePresence mode="wait">
          {notFound && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-6 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No medicine found. Try another name.</p>
            </motion.div>
          )}
          {result && (
            <motion.div key={result.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{result.name}</h2>
                <span className="text-sm text-primary font-medium">{result.drugClass}</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Uses</h3>
                <p className="text-sm text-muted-foreground">{result.uses}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Dosage</h3>
                <p className="text-sm text-muted-foreground">{result.dosage}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Side Effects</h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.sideEffects?.map((se: string) => (
                    <span key={se} className="px-2 py-0.5 rounded-full text-xs bg-warning/10 text-warning">{se}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Precautions</h3>
                <ul className="space-y-1">
                  {result.precautions?.map((p: string) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Info className="h-3.5 w-3.5 text-info mt-0.5 flex-shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                ⚠️ This information is for educational purposes only. Always consult a healthcare professional.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
