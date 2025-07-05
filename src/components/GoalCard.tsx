import React from 'react';
import { Goal, useGoals } from '../context/GoalContext';
import { Calendar, TrendingUp } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
}

export function GoalCard({ goal, onClick }: GoalCardProps) {
  const { updateGoal, updateProgress, archiveGoal } = useGoals();
  const progress = (goal.currentValue / goal.targetValue) * 100;
  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    // Add ordinal suffix for day
    const getOrdinal = (n: number) => {
      if (n > 3 && n < 21) return 'th';
      switch (n % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    return `${day}${getOrdinal(day)} ${month} ${year} ${hours}:${minutes}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div 
      className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{goal.title}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{goal.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(goal.priority)} bg-opacity-20`}>
            {goal.priority.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600 dark:text-gray-400 text-sm">Progress</span>
          <span className="text-gray-900 dark:text-white font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${progress}%`,
              backgroundColor: goal.color 
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <TrendingUp size={16} className="mr-2" />
          <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
        </div>
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <Calendar size={16} className="mr-2" />
          <span>{formatDeadline(goal.deadline)}</span>
        </div>
      </div>
      {/* Confirm Done Button */}
      {goal.status === 'active' && !goal.archived && (
        <button
          className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition-colors font-semibold"
          onClick={e => {
            e.stopPropagation();
            updateProgress(goal.id, goal.targetValue);
            updateGoal(goal.id, { status: 'completed', currentValue: goal.targetValue });
            archiveGoal(goal.id);
          }}
        >
          Confirm Done
        </button>
      )}
    </div>
  );
}