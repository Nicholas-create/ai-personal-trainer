'use client';

import { format, differenceInDays } from 'date-fns';
import type { WorkoutPlan } from '@/types/plan';
import { StatusBadge } from './StatusBadge';

interface ProgramListProps {
  plans: WorkoutPlan[];
  selectedPlan: WorkoutPlan | null;
  onSelectPlan: (plan: WorkoutPlan) => void;
}

export function ProgramList({ plans, selectedPlan, onSelectPlan }: ProgramListProps) {
  if (plans.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <p className="text-gray-500 mb-4">No programs yet</p>
        <p className="text-sm text-gray-400">
          Create your first program by talking to the AI Coach
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const isSelected = selectedPlan?.id === plan.id;
        const startDate = plan.startedAt || plan.generatedAt;
        const duration = differenceInDays(plan.validUntil, startDate);
        const daysRemaining = differenceInDays(plan.validUntil, new Date());

        return (
          <button
            key={plan.id}
            onClick={() => onSelectPlan(plan)}
            className={`w-full text-left p-4 rounded-xl transition-all ${
              isSelected
                ? 'bg-blue-50 ring-2 ring-blue-400'
                : 'bg-white hover:bg-gray-50 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{plan.name}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {format(startDate, 'MMM d, yyyy')} - {format(plan.validUntil, 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {duration} days
                  {plan.status === 'active' && daysRemaining > 0 && (
                    <span className="ml-2">({daysRemaining} days remaining)</span>
                  )}
                </p>
              </div>
              <StatusBadge status={plan.status} size="sm" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
