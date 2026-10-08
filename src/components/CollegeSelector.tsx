import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import {
  Search,
  Building,
  Check,
  X,
  ChevronDown,
  MapPin,
  Award,
  Sparkles,
} from 'lucide-react';
import type { EngineeringCollege } from '../types/college';
import { searchColleges, getCollegeById, findCollegeByName, INDIAN_STATES } from '../services/college/collegeService';

export interface CollegeSelectorProps {
  value: string;
  collegeId?: string | null;
  onChange: (collegeName: string, collegeId?: string, college?: EngineeringCollege) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
}

export const CollegeSelector: React.FC<CollegeSelectorProps> = ({
  value,
  collegeId,
  onChange,
  label = 'College Name',
  required = false,
  disabled = false,
  error,
  helperText,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [colleges, setColleges] = useState<EngineeringCollege[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedCollegeObj, setSelectedCollegeObj] = useState<EngineeringCollege | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const idPrefix = useId();

  // Resolve initial college object from id or name
  useEffect(() => {
    let isMounted = true;
    const resolveInitial = async () => {
      if (collegeId) {
        const found = await getCollegeById(collegeId);
        if (isMounted && found) {
          setSelectedCollegeObj(found);
          return;
        }
      }
      if (value) {
        const foundByName = findCollegeByName(value);
        if (isMounted && foundByName) {
          setSelectedCollegeObj(foundByName);
          return;
        }
      }
      if (isMounted && !value && !collegeId) {
        setSelectedCollegeObj(null);
      }
    };
    resolveInitial();
    return () => {
      isMounted = false;
    };
  }, [collegeId, value]);

  // Perform search whenever query or state changes
  const executeSearch = useCallback(async (query: string, state: string) => {
    setIsLoading(true);
    try {
      const results = await searchColleges({
        query,
        state,
        limit: 30,
      });
      setColleges(results);
      setHighlightedIndex(0);
    } catch (err) {
      console.warn('Search colleges error:', err);
      setColleges([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      executeSearch(searchQuery, selectedState);
    }
  }, [isOpen, searchQuery, selectedState, executeSearch]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelectCollege = (college: EngineeringCollege) => {
    setSelectedCollegeObj(college);
    onChange(college.name, college.id, college);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCustomCollege = (customName: string) => {
    setSelectedCollegeObj(null);
    onChange(customName, undefined, undefined);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCollegeObj(null);
    onChange('', undefined, undefined);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < colleges.length ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (colleges[highlightedIndex]) {
        handleSelectCollege(colleges[highlightedIndex]);
      } else if (searchQuery.trim()) {
        handleCustomCollege(searchQuery.trim());
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const isSelected = Boolean(value || selectedCollegeObj);

  return (
    <div className={`relative space-y-1.5 ${className}`} ref={containerRef}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={`${idPrefix}-trigger`}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {selectedCollegeObj?.aishe_code && (
          <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
            AISHE: {selectedCollegeObj.aishe_code}
          </span>
        )}
      </div>

      {/* Main Trigger Field */}
      <div
        id={`${idPrefix}-trigger`}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${idPrefix}-listbox`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full text-left rounded-xl border transition-colors cursor-pointer px-3.5 py-2.5 flex items-center justify-between gap-2.5 ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-60 border-slate-200 dark:border-slate-800'
            : isOpen
            ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/20'
            : error
            ? 'bg-white dark:bg-slate-900 border-rose-400 dark:border-rose-600'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="text-slate-400 dark:text-slate-500 shrink-0">
            <Building className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>

          {isSelected ? (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {selectedCollegeObj ? selectedCollegeObj.name : value}
              </p>
              {selectedCollegeObj && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {selectedCollegeObj.city}, {selectedCollegeObj.state}
                  </span>
                  <span>•</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate">
                    {selectedCollegeObj.college_type}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500 truncate">
              🔍 Search your college... (e.g., Basaveshwar, RV, Bengaluru, Belgaum)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isSelected && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear college selection"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-500' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id={`${idPrefix}-listbox`}
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Search Header Bar */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 backdrop-blur-xs space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 dark:text-indigo-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by college name, abbreviation (RV, BEC), city, or state..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick State Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Filter State:
              </span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="text-[11px] rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Indian States</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">
                {colleges.length} results
              </span>
            </div>
          </div>

          {/* College Options List */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60"
          >
            {isLoading ? (
              <li className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Searching engineering colleges directory...
              </li>
            ) : colleges.length > 0 ? (
              colleges.map((col, idx) => {
                const isSelectedOption =
                  selectedCollegeObj?.id === col.id ||
                  value.toLowerCase() === col.name.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={col.id}
                    role="option"
                    aria-selected={isSelectedOption}
                    onClick={() => handleSelectCollege(col)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`p-3 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                      isHighlighted
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                        : isSelectedOption
                        ? 'bg-slate-50 dark:bg-slate-800/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {col.name}
                        </span>
                        {col.abbreviations && col.abbreviations.length > 0 && (
                          <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                            {col.abbreviations[0]}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {col.city}, {col.state}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                          <Award className="w-3 h-3 text-amber-500 shrink-0" />
                          {col.college_type}
                        </span>
                        <span>•</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          AISHE: {col.aishe_code}
                        </span>
                      </div>
                    </div>

                    {isSelectedOption && (
                      <div className="shrink-0 p-1 text-indigo-600 dark:text-indigo-400">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="p-6 text-center space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No registered engineering colleges found matching &quot;{searchQuery}&quot;
                </p>
                {searchQuery.trim().length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleCustomCollege(searchQuery.trim())}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Use &quot;{searchQuery.trim()}&quot; as custom college name
                  </button>
                )}
              </li>
            )}
          </ul>

          {/* Footer note */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Official AISHE Higher Education Directory</span>
            <span>Use ↑ ↓ to navigate, Enter to select</span>
          </div>
        </div>
      )}

      {/* Helper / Error Text */}
      {error ? (
        <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
