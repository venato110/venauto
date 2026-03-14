import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export interface Filters {
  types: string[];
  priceRange: [number, number];
  availableOnly: boolean;
}

const TYPES = [
  { value: "garage", label: "Garage", emoji: "🏠" },
  { value: "parking_lot", label: "Parking Lot", emoji: "🅿️" },
  { value: "arena", label: "Arena", emoji: "🏟️" },
  { value: "mall", label: "Mall", emoji: "🏬" },
];

const DEFAULT_FILTERS: Filters = {
  types: [],
  priceRange: [0, 50],
  availableOnly: false,
};

interface MapFiltersProps {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const MapFilters = ({ filters, onChange }: MapFiltersProps) => {
  const [open, setOpen] = useState(false);

  const activeCount =
    (filters.types.length > 0 ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 50 ? 1 : 0) +
    (filters.availableOnly ? 1 : 0);

  const toggleType = (t: string) => {
    const types = filters.types.includes(t)
      ? filters.types.filter((x) => x !== t)
      : [...filters.types, t];
    onChange({ ...filters, types });
  };

  const reset = () => onChange({ ...DEFAULT_FILTERS });

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="glass-card relative flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
      >
        <SlidersHorizontal className="h-4 w-4 text-foreground" />
        {activeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1050]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute left-0 right-0 top-12 z-[1051] mx-4 rounded-2xl bg-card border border-border shadow-2xl p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">Filters</h3>
                <div className="flex gap-2">
                  {activeCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={reset} className="text-xs text-muted-foreground">
                      Reset
                    </Button>
                  )}
                  <button onClick={() => setOpen(false)}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Type filter */}
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Type</p>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => toggleType(t.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        filters.types.includes(t.value)
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Price range</p>
                  <p className="text-xs font-semibold text-foreground">
                    {filters.priceRange[0]} – {filters.priceRange[1]} AZN/hr
                  </p>
                </div>
                <Slider
                  min={0}
                  max={50}
                  step={1}
                  value={filters.priceRange}
                  onValueChange={(v) => onChange({ ...filters, priceRange: v as [number, number] })}
                  className="w-full"
                />
              </div>

              {/* Availability */}
              <div>
                <button
                  onClick={() => onChange({ ...filters, availableOnly: !filters.availableOnly })}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                    filters.availableOnly
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <span className="mr-2">{filters.availableOnly ? "✅" : "⬜"}</span>
                  Available only
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export { DEFAULT_FILTERS };
export default MapFilters;
