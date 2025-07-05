import React, { useState } from 'react';
import { useGoals } from '../context/GoalContext';
import { GoalCard } from '../components/GoalCard';
import { CreateGoalModal } from '../components/CreateGoalModal';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Goals({ onCreateGoalClick }: { onCreateGoalClick?: () => void }) {
  const { t } = useTranslation();
  const { goals, clearGoals, getArchivedGoals } = useGoals();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'archive'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGoals = goals.filter(goal => {
    if (filter === 'archive') return false;
    const matchesFilter = filter === 'all' || goal.status === filter;
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (goal.category && goal.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch && !goal.archived;
  });

  const archivedGoals = getArchivedGoals().filter(goal => {
    return goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (goal.category && goal.category.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="p-6 pb-24 bg-white dark:bg-black min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('goals_title')}</h1>
        <div className="flex gap-2">
          <button
            onClick={clearGoals}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors shadow-lg"
            title="Reset All Goals"
          >
            Reset All Goals
          </button>
          <button
            onClick={onCreateGoalClick ? onCreateGoalClick : () => setShowCreateModal(true)}
            title={t('add_goal')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-colors shadow-lg"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={t('search_goals_placeholder')}
          value={searchTerm}
          onChange={handleInputChange}
          className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-gray-50 dark:bg-gray-900 rounded-xl p-1 mb-6 transition-colors duration-300">
        {[
          { key: 'all', label: t('filter_all') },
          { key: 'active', label: t('filter_active') },
          { key: 'completed', label: t('filter_completed') },
          { key: 'archive', label: 'Archives' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as 'all' | 'active' | 'completed' | 'archive')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              filter === key
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {filter === 'archive' ? (
          archivedGoals.length > 0 ? (
            archivedGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))
          ) : null
        ) : (
          filteredGoals.length > 0 ? (
          filteredGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))
          ) : null
        )}
      </div>

      {((filter === 'archive' && archivedGoals.length === 0) || (filter !== 'archive' && filteredGoals.length === 0)) && (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-600 mb-4">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="mx-auto">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            {filter === 'archive' ? 'No archived goals yet.' : t('no_goals_found')}
        </h3>
        <p className="text-gray-500 dark:text-gray-500 mb-4">
            {filter === 'archive' ? 'Completed goals you archive will appear here.' : t('create_first_goal')}
        </p>
          {filter !== 'archive' && (
        <button
              onClick={onCreateGoalClick ? onCreateGoalClick : () => setShowCreateModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
        >
          {t('create_goal')}
        </button>
          )}
      </div>
      )}

      {/* Create Goal Modal */}
      {showCreateModal && (
        <CreateGoalModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}