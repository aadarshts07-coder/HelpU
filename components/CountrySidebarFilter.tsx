'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp, Globe, Check } from 'lucide-react';
import {
  POPULAR_COUNTRIES,
  ALL_COUNTRIES,
  CountryOption,
  getCountryByCode,
  EU_COUNTRY_CODES,
} from '@/lib/countries';
import CountryFlag from './CountryFlag';

interface CountrySidebarFilterProps {
  selectedCountries: string[];
  onChange: (updated: string[]) => void;
}

export default function CountrySidebarFilter({
  selectedCountries,
  onChange,
}: CountrySidebarFilterProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const query = searchQuery.toLowerCase().trim();

  // Filter lists based on search query
  const filteredPopular = useMemo(() => {
    if (!query) return POPULAR_COUNTRIES;
    return POPULAR_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)
    );
  }, [query]);

  const filteredAll = useMemo(() => {
    if (!query) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)
    );
  }, [query]);

  const toggleCountry = (code: string) => {
    const norm = code.toLowerCase().trim();
    if (selectedCountries.includes(norm)) {
      onChange(selectedCountries.filter((c) => c !== norm));
    } else {
      onChange([...selectedCountries, norm]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="pt-3 border-t border-slate-100">
      {/* Collapsible Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider hover:text-slate-900 transition-colors focus:outline-hidden"
          aria-expanded={isExpanded}
        >
          <span>Countries</span>
          {selectedCountries.length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              {selectedCountries.length}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {selectedCountries.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Clear ({selectedCountries.length})
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-2.5">
          {/* Selected Countries Removable Chips */}
          {selectedCountries.length > 0 && (
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-0.5 custom-scrollbar">
              {selectedCountries.map((code) => {
                const match = getCountryByCode(code);
                const name = match ? match.name : code.toUpperCase();
                return (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-md text-[11px] font-medium"
                  >
                    <CountryFlag code={code} className="w-3 h-3 shrink-0" />
                    <span className="truncate max-w-[110px]">{name}</span>
                    <button
                      type="button"
                      onClick={() => toggleCountry(code)}
                      className="text-indigo-400 hover:text-indigo-800 ml-0.5"
                      title={`Remove ${name}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Search Input Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search countries..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Scrollable Country List */}
          <div
            tabIndex={0}
            role="region"
            aria-label="Country filter options"
            className="max-h-[260px] overflow-y-auto space-y-1 pr-1 text-xs border border-slate-100 rounded-xl p-1 bg-slate-50/50 custom-scrollbar focus:outline-hidden focus:ring-1 focus:ring-indigo-300"
          >
            {/* Popular Group */}
            {!query && (
              <div>
                <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-100/80 rounded-md mb-1">
                  Popular
                </div>
                {filteredPopular.map((c) => {
                  const isChecked = selectedCountries.includes(c.code);
                  return (
                    <label
                      key={`pop_${c.code}`}
                      className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-indigo-50 text-indigo-900 font-semibold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCountry(c.code)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <CountryFlag code={c.code} className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{c.name}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* All Countries Group */}
            <div>
              {!query && (
                <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-100/80 rounded-md my-1">
                  All Countries (A–Z)
                </div>
              )}
              {filteredAll.map((c) => {
                const isChecked = selectedCountries.includes(c.code);
                return (
                  <label
                    key={`all_${c.code}`}
                    className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCountry(c.code)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <CountryFlag code={c.code} className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{c.name}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {filteredAll.length === 0 && filteredPopular.length === 0 && (
              <div className="p-3 text-center text-xs text-slate-400">
                No countries match &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
