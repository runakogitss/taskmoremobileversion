import { useState } from 'react';
import { useGoals } from '../context/GoalContext';
import { ProgressChart } from '../components/ProgressChart';
import { Notification } from '../components/Notification';
import { TrendingUp, Award, Target, BarChart3, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '../context/AnalyticsContext';
import { 
  ProgressTrendChart, 
  CategoryPerformanceChart, 
  ProductivityTimeChart, 
  GoalProgressComparison,
  WeeklyHeatmap 
} from '../components/AdvancedCharts';
import { ProductivityReport } from '../components/ProductivityReport';
import { GoalCard } from '../components/GoalCard';

export function Progress() {
  const { t } = useTranslation();
  const { goals } = useGoals();
  const { getProductivityStats, getCategoryAnalytics } = useAnalytics();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'insights'>('overview');
  const [showReport, setShowReport] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const activeGoals = goals.filter(goal => goal.status === 'active' && !goal.archived);
  const completedGoals = goals.filter(goal => goal.status === 'completed' && !goal.archived);
  const allGoals = goals.filter(goal => !goal.archived);
  const overallProgress = allGoals.length > 0
    ? allGoals.reduce((sum, goal) => sum + (goal.currentValue / goal.targetValue) * 100, 0) / allGoals.length
    : 0;

  const productivityStats = getProductivityStats(7);
  const categoryAnalytics = getCategoryAnalytics();

  // Helper to get progress subtitle key
  const getProgressSubtitleKey = (progress: number) => {
    if (progress < 33) return 'progress_subtitle_low';
    if (progress < 66) return 'progress_subtitle_mid';
    return 'progress_subtitle_high';
  };

  return (
    <div className="p-6 pb-24 bg-white dark:bg-black min-h-screen transition-colors duration-300">
      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
      {showReport && <ProductivityReport onClose={() => setShowReport(false)} />}
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('progress_tracking')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('monitor_journey')}</p>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 text-sm"
          >
            <FileText size={16} />
            <span>{t('generate_report')}</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('overview')}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 size={16} className="inline mr-2" />
            {t('analytics')}
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'insights'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={16} className="inline mr-2" />
            {t('insights')}
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{t('overall_progress')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(overallProgress)}%</p>
                </div>
                <TrendingUp size={24} className="text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{t('completed')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedGoals.length}</p>
                </div>
                <Award size={24} className="text-green-400" />
              </div>
            </div>
          </div>

          {/* Progress Chart */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 mb-8 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('progress_overview')}</h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-2"
                aria-label="Select date for progress overview"
              />
            </div>
            <ProgressChart goals={goals} />
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-4">{t(getProgressSubtitleKey(overallProgress))}</p>
          </div>

          {/* Goal Progress List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('goal_details')}</h3>
            {activeGoals.length > 0 ? (
              activeGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))
            ) : (
            <div className="text-center py-12">
              <Target size={48} className="text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('no_active_goals')}</h3>
              <p className="text-gray-500 dark:text-gray-500">{t('create_some_goals')}</p>
            </div>
            )}
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Time Range Selector */}
          <div className="flex justify-center space-x-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Advanced Charts */}
          <ProgressTrendChart goals={goals} timeRange={timeRange} />
          <CategoryPerformanceChart />
          <ProductivityTimeChart goals={goals} timeRange={timeRange} />
          <GoalProgressComparison goals={goals} timeRange={timeRange} />
          <WeeklyHeatmap goals={goals} />
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Productivity Insights */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-4">{t('productivity_insights')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-100 text-sm">{t('total_work_time')}</p>
                <p className="text-2xl font-bold">{Math.round(productivityStats.totalWorkTime / 60 * 10) / 10}h</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">{t('avg_session_length')}</p>
                <p className="text-2xl font-bold">{Math.round(productivityStats.averageSessionLength)}m</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">{t('completion_rate')}</p>
                <p className="text-2xl font-bold">{Math.round(productivityStats.completionRate)}%</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">{t('most_productive_day')}</p>
                <p className="text-2xl font-bold">{productivityStats.mostProductiveDay}</p>
              </div>
            </div>
          </div>

          {/* Category Insights */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('category_insights')}</h3>
            <div className="space-y-4">
              {categoryAnalytics.map((category) => (
                <div key={category.category} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{category.category}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {category.completedGoals}/{category.totalGoals} {t('completed')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{Math.round(category.averageProgress)}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round(category.totalTimeSpent / 60 * 10) / 10}h
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">{t('recommendations')}</h3>
            <div className="space-y-3 text-green-800 dark:text-green-200">
              {productivityStats.averageSessionLength < 25 && (
                <p>• {t('try_longer_sessions')}</p>
              )}
              {productivityStats.completionRate < 70 && (
                <p>• {t('focus_on_completion')}</p>
              )}
              {categoryAnalytics.length > 0 && (
                <p>• {t('focus_on_category', { category: categoryAnalytics[0].category })}</p>
              )}
              <p>• {t('maintain_consistency')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}