import { useTranslation } from 'react-i18next';
// import React from 'react';

import { useGoals } from '../context/GoalContext';
import { useAuth } from '../context/AuthContext';
import { GoalCard } from '../components/GoalCard';
import { StatsCard } from '../components/StatsCard';
import { Plus, Target, TrendingUp } from 'lucide-react';
import PomodoroTimer from '../components/PomodoroTimer';
import ProfilePicture from '../components/ProfilePicture';
import './Dashboard.css';
// import './Dashboard.css';

export const Dashboard = ({ onCreateGoalClick }: { onCreateGoalClick?: () => void }) => {

  const { t } = useTranslation();
  const { goals } = useGoals();
  const { user: authUser } = useAuth();
  
  // Show actual active and completed goals
  const activeGoals = goals.filter(goal => goal.status === 'active' && !goal.archived);
  const completedGoals = goals.filter(goal => goal.status === 'completed' && !goal.archived);

  // Calculate total progress (average of all goals, not just active, and not archived)
  const visibleGoals = goals.filter(goal => !goal.archived);
  const totalProgress = visibleGoals.length > 0
    ? visibleGoals.reduce((sum, goal) => sum + (goal.currentValue / goal.targetValue) * 100, 0) / visibleGoals.length
    : 0;

  // Helper to get progress subtitle key
  const getProgressSubtitleKey = (progress: number) => {
    if (progress < 33) return 'progress_subtitle_low';
    if (progress < 66) return 'progress_subtitle_mid';
    return 'progress_subtitle_high';
  };

  return (
    <div className="p-4 sm:p-6 pb-24 bg-white dark:bg-black min-h-screen h-auto transition-colors duration-300 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('greeting')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('greeting_subtitle')}</p>
        </div>
        <div>
          {authUser && (
            <ProfilePicture authUser={authUser} size="lg" />
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
        <StatsCard
          icon={Target}
          title={t('active_goals')}
          value={activeGoals.length.toString()}
          color="text-blue-400"
        />
        <StatsCard
          icon={TrendingUp}
          title="Completed"
          value={completedGoals.length.toString()}
          color="text-green-400"
        />
      </div>

      {/* Overall Progress */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 transition-colors duration-300">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-4">{t('overall_progress')}</h3>
        <div className="flex items-center mb-1 sm:mb-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 mr-2 sm:mr-4">
            <div 
              className="dashboard-progress-bar bg-gradient-to-r from-blue-500 to-purple-500 h-2 sm:h-3 rounded-full transition-all duration-300"
              data-progress-width={`${Math.round(totalProgress)}%`}
            />
          </div>
          <span className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">{Math.round(totalProgress)}%</span>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t(getProgressSubtitleKey(totalProgress))}</p>
      </div>

      {/* Pomodoro Timer */}
      <div className="mb-6 sm:mb-8">
        <PomodoroTimer />
      </div>

      {/* Quick Actions */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('your_goals')}</h3>
        <button
          onClick={onCreateGoalClick}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
          title="Create Goal"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Recent Goals */}
      <div className="space-y-4">
        {activeGoals.length > 0 ? (
          activeGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))
        ) : null}
      </div>

      {activeGoals.length === 0 && (
      <div className="text-center py-12">
        <Target size={48} className="text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('no_active_goals')}</h3>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500 mb-4">{t('no_active_goals_subtitle')}</p>
          <button
            onClick={onCreateGoalClick}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors"
        >
          {t('create_goal')}
          </button>
      </div>
      )}
    </div>
  );
}