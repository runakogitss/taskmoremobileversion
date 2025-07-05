import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Goal } from './GoalContext';

export interface ProgressEntry {
  id: string;
  goalId: string;
  date: string;
  value: number;
  notes?: string;
}

export interface ProductivitySession {
  id: string;
  date: string;
  duration: number; // in minutes
  goalId?: string;
  type: 'work' | 'break' | 'focus';
  completed: boolean;
}

export interface AnalyticsData {
  progressEntries: ProgressEntry[];
  productivitySessions: ProductivitySession[];
  goalHistory: Goal[];
}

interface AnalyticsContextType {
  analyticsData: AnalyticsData;
  addProgressEntry: (entry: Omit<ProgressEntry, 'id'>) => void;
  addProductivitySession: (session: Omit<ProductivitySession, 'id'>) => void;
  getGoalProgressHistory: (goalId: string, days?: number) => ProgressEntry[];
  getProductivityStats: (days?: number) => {
    totalWorkTime: number;
    totalBreakTime: number;
    averageSessionLength: number;
    completionRate: number;
    mostProductiveDay: string;
  };
  getCategoryAnalytics: () => {
    category: string;
    totalGoals: number;
    completedGoals: number;
    averageProgress: number;
    totalTimeSpent: number;
  }[];
  generateProductivityReport: (startDate: string, endDate: string) => {
    summary: {
      totalGoals: number;
      completedGoals: number;
      totalWorkTime: number;
      averageDailyProgress: number;
      mostProductiveCategory: string;
    };
    dailyProgress: Array<{
      date: string;
      progress: number;
      workTime: number;
      goalsUpdated: number;
    }>;
    goalBreakdown: Array<{
      goalId: string;
      title: string;
      category: string;
      progress: number;
      timeSpent: number;
      status: string;
    }>;
  };
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(() => {
    const saved = localStorage.getItem('analytics_data');
    return saved ? JSON.parse(saved) : {
      progressEntries: [],
      productivitySessions: [],
      goalHistory: []
    };
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('analytics_data', JSON.stringify(analyticsData));
  }, [analyticsData]);

  const addProgressEntry = (entry: Omit<ProgressEntry, 'id'>) => {
    const newEntry: ProgressEntry = {
      ...entry,
      id: Date.now().toString()
    };
    setAnalyticsData(prev => ({
      ...prev,
      progressEntries: [...prev.progressEntries, newEntry]
    }));
  };

  const addProductivitySession = (session: Omit<ProductivitySession, 'id'>) => {
    const newSession: ProductivitySession = {
      ...session,
      id: Date.now().toString()
    };
    setAnalyticsData(prev => ({
      ...prev,
      productivitySessions: [...prev.productivitySessions, newSession]
    }));
  };

  const getGoalProgressHistory = (goalId: string, days: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return analyticsData.progressEntries
      .filter(entry => entry.goalId === goalId && new Date(entry.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getProductivityStats = (days: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentSessions = analyticsData.productivitySessions
      .filter(session => new Date(session.date) >= cutoffDate);

    const workSessions = recentSessions.filter(s => s.type === 'work');
    const breakSessions = recentSessions.filter(s => s.type === 'break');
    
    const totalWorkTime = workSessions.reduce((sum, session) => sum + session.duration, 0);
    const totalBreakTime = breakSessions.reduce((sum, session) => sum + session.duration, 0);
    const averageSessionLength = workSessions.length > 0 
      ? totalWorkTime / workSessions.length 
      : 0;
    const completionRate = workSessions.length > 0 
      ? (workSessions.filter(s => s.completed).length / workSessions.length) * 100 
      : 0;

    // Find most productive day
    const dailyWorkTime = recentSessions
      .filter(s => s.type === 'work')
      .reduce((acc, session) => {
        const date = session.date.split('T')[0];
        acc[date] = (acc[date] || 0) + session.duration;
        return acc;
      }, {} as Record<string, number>);

    const mostProductiveDay = Object.entries(dailyWorkTime)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data';

    return {
      totalWorkTime,
      totalBreakTime,
      averageSessionLength,
      completionRate,
      mostProductiveDay
    };
  };

  const getCategoryAnalytics = () => {
    const categoryMap = new Map<string, {
      totalGoals: number;
      completedGoals: number;
      totalProgress: number;
      totalTimeSpent: number;
    }>();

    // Initialize categories from goal history
    analyticsData.goalHistory.forEach(goal => {
      if (!categoryMap.has(goal.category || 'Uncategorized')) {
        categoryMap.set(goal.category || 'Uncategorized', {
          totalGoals: 0,
          completedGoals: 0,
          totalProgress: 0,
          totalTimeSpent: 0
        });
      }
      
      const category = categoryMap.get(goal.category || 'Uncategorized')!;
      category.totalGoals++;
      if (goal.status === 'completed') {
        category.completedGoals++;
      }
      category.totalProgress += (goal.currentValue / goal.targetValue) * 100;
    });

    // Add time spent data
    analyticsData.productivitySessions.forEach(session => {
      if (session.goalId) {
        const goal = analyticsData.goalHistory.find(g => g.id === session.goalId);
        if (goal && categoryMap.has(goal.category || 'Uncategorized')) {
          const category = categoryMap.get(goal.category || 'Uncategorized')!;
          category.totalTimeSpent += session.duration;
        }
      }
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalGoals: data.totalGoals,
      completedGoals: data.completedGoals,
      averageProgress: data.totalGoals > 0 ? data.totalProgress / data.totalGoals : 0,
      totalTimeSpent: data.totalTimeSpent
    }));
  };

  const generateProductivityReport = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const filteredGoals = analyticsData.goalHistory.filter(goal => {
      const goalDate = new Date(goal.createdAt);
      return goalDate >= start && goalDate <= end;
    });

    const filteredSessions = analyticsData.productivitySessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= start && sessionDate <= end;
    });

    const filteredProgress = analyticsData.progressEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= start && entryDate <= end;
    });

    // Calculate summary
    const totalGoals = filteredGoals.length;
    const completedGoals = filteredGoals.filter(g => g.status === 'completed').length;
    const totalWorkTime = filteredSessions
      .filter(s => s.type === 'work')
      .reduce((sum, session) => sum + session.duration, 0);

    const categoryAnalytics = getCategoryAnalytics();
    const mostProductiveCategory = categoryAnalytics
      .sort((a, b) => b.totalTimeSpent - a.totalTimeSpent)[0]?.category || 'None';

    // Calculate daily progress
    const dailyProgressMap = new Map<string, {
      progress: number;
      workTime: number;
      goalsUpdated: number;
    }>();

    // Initialize all days in range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyProgressMap.set(dateStr, { progress: 0, workTime: 0, goalsUpdated: 0 });
    }

    // Add progress data
    filteredProgress.forEach(entry => {
      const dateStr = entry.date.split('T')[0];
      const existing = dailyProgressMap.get(dateStr);
      if (existing) {
        existing.goalsUpdated++;
        // Calculate progress percentage for this entry
        const goal = filteredGoals.find(g => g.id === entry.goalId);
        if (goal) {
          existing.progress += (entry.value / goal.targetValue) * 100;
        }
      }
    });

    // Add work time data
    filteredSessions.forEach(session => {
      const dateStr = session.date.split('T')[0];
      const existing = dailyProgressMap.get(dateStr);
      if (existing && session.type === 'work') {
        existing.workTime += session.duration;
      }
    });

    const dailyProgress = Array.from(dailyProgressMap.entries()).map(([date, data]) => ({
      date,
      progress: Math.round(data.progress),
      workTime: data.workTime,
      goalsUpdated: data.goalsUpdated
    }));

    // Calculate average daily progress
    const totalProgress = dailyProgress.reduce((sum, day) => sum + day.progress, 0);
    const averageDailyProgress = dailyProgress.length > 0 ? totalProgress / dailyProgress.length : 0;

    // Goal breakdown
    const goalBreakdown = filteredGoals.map(goal => {
      const timeSpent = filteredSessions
        .filter(s => s.goalId === goal.id && s.type === 'work')
        .reduce((sum, session) => sum + session.duration, 0);
      
      return {
        goalId: goal.id,
        title: goal.title,
        category: goal.category,
        progress: Math.round((goal.currentValue / goal.targetValue) * 100),
        timeSpent,
        status: goal.status
      };
    });

    return {
      summary: {
        totalGoals,
        completedGoals,
        totalWorkTime,
        averageDailyProgress: Math.round(averageDailyProgress),
        mostProductiveCategory
      },
      dailyProgress,
      goalBreakdown
    };
  };

  return (
    <AnalyticsContext.Provider value={{
      analyticsData,
      addProgressEntry,
      addProductivitySession,
      getGoalProgressHistory,
      getProductivityStats,
      getCategoryAnalytics,
      generateProductivityReport
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
} 