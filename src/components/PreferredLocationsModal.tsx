'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Plus, Loader2, Check, Sparkles } from 'lucide-react';
import LocationPicker, { LocationResult } from '@/components/LocationPicker';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sounds';

interface PreferredLocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (locations: string[]) => Promise<void>;
}

export default function PreferredLocationsModal({
  isOpen,
  onClose,
  onSave,
}: PreferredLocationsModalProps) {
  const [locations, setLocations] = useState<string[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationResult | null>(null);
  const [saving, setSaving] = useState(false);
  const maxLocations = 3;

  const handleAddLocation = () => {
    if (!currentLocation || locations.length >= maxLocations) return;
    // Don't add duplicates
    if (locations.some(l => l.toLowerCase() === currentLocation.name.toLowerCase())) return;
    playSound('pop');
    setLocations(prev => [...prev, currentLocation.name]);
    setCurrentLocation(null);
  };

  const handleRemoveLocation = (index: number) => {
    setLocations(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (locations.length === 0) return;
    setSaving(true);
    try {
      await onSave(locations);
      playSound('success');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={handleSkip}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--teal-100)] to-[var(--lime-100)] dark:from-[var(--teal-500)]/20 dark:to-[var(--lime-500)]/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[var(--teal-600)] dark:text-[var(--teal-400)]" />
                </div>
                <button
                  onClick={handleSkip}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Where are you looking?
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Set up to {maxLocations} preferred locations so we only send you listings that matter.
              </p>
            </div>

            {/* Selected locations */}
            {locations.length > 0 && (
              <div className="px-6 pb-3">
                <div className="flex flex-wrap gap-2">
                  {locations.map((loc, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/20 text-[var(--teal-700)] dark:text-[var(--teal-300)] text-sm font-medium"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {loc}
                      <button
                        onClick={() => handleRemoveLocation(i)}
                        className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center hover:bg-[var(--teal-200)] dark:hover:bg-[var(--teal-500)]/30 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location picker */}
            {locations.length < maxLocations && (
              <div className="px-6 pb-4">
                <LocationPicker
                  value={currentLocation}
                  onChange={(loc) => setCurrentLocation(loc)}
                  placeholder="Search for a location..."
                  label={locations.length === 0 ? 'Add a location' : `Add another (${locations.length}/${maxLocations})`}
                />
                {currentLocation && (
                  <button
                    onClick={handleAddLocation}
                    className="mt-3 w-full py-2.5 rounded-xl border-2 border-dashed border-[var(--teal-300)] dark:border-[var(--teal-600)] flex items-center justify-center gap-2 text-sm font-medium text-[var(--teal-600)] dark:text-[var(--teal-400)] hover:bg-[var(--teal-50)] dark:hover:bg-[var(--teal-500)]/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add &ldquo;{currentLocation.name}&rdquo;
                  </button>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 py-3 px-4 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm"
              >
                Skip for now
              </button>
              <button
                onClick={handleSave}
                disabled={locations.length === 0 || saving}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all",
                  locations.length > 0 && !saving
                    ? "bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121]"
                    : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
                )}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save Locations
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
