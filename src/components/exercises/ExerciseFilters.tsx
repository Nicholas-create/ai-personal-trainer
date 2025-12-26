'use client';

import { useState, useEffect } from 'react';
import type { ExerciseFilters as ExerciseFiltersType } from '@/types/exercise';
import {
  MUSCLE_GROUP_OPTIONS,
  EQUIPMENT_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
} from '@/types/exercise';

interface ExerciseFiltersProps {
  filters: ExerciseFiltersType;
  onChange: (filters: ExerciseFiltersType) => void;
  onClear: () => void;
  totalCount: number;
  filteredCount: number;
}

export function ExerciseFilters({
  filters,
  onChange,
  onClear,
  totalCount,
  filteredCount,
}: ExerciseFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.searchTerm || '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.searchTerm) {
        onChange({ ...filters, searchTerm: searchInput || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters, onChange]);

  // Update local state when filters change externally (e.g., clear)
  useEffect(() => {
    if (!filters.searchTerm) {
      setSearchInput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.searchTerm]);

  const hasActiveFilters =
    filters.muscleGroup ||
    filters.equipment ||
    filters.difficulty ||
    filters.searchTerm;

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search exercises..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base text-gray-900 bg-white"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-2">
        {/* Muscle Group */}
        <select
          value={filters.muscleGroup || ''}
          onChange={(e) =>
            onChange({
              ...filters,
              muscleGroup: e.target.value
                ? (e.target.value as ExerciseFiltersType['muscleGroup'])
                : undefined,
            })
          }
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:outline-none min-w-[140px]"
        >
          <option value="">All Muscles</option>
          {MUSCLE_GROUP_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Equipment */}
        <select
          value={filters.equipment || ''}
          onChange={(e) =>
            onChange({
              ...filters,
              equipment: e.target.value
                ? (e.target.value as ExerciseFiltersType['equipment'])
                : undefined,
            })
          }
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:outline-none min-w-[160px]"
        >
          <option value="">All Equipment</option>
          {EQUIPMENT_TYPE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Difficulty */}
        <select
          value={filters.difficulty || ''}
          onChange={(e) =>
            onChange({
              ...filters,
              difficulty: e.target.value
                ? (e.target.value as ExerciseFiltersType['difficulty'])
                : undefined,
            })
          }
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:outline-none min-w-[130px]"
        >
          <option value="">All Levels</option>
          {DIFFICULTY_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {hasActiveFilters ? (
          <span>
            Showing {filteredCount} of {totalCount} exercises
          </span>
        ) : (
          <span>{totalCount} exercises</span>
        )}
      </div>
    </div>
  );
}
