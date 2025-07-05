import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useAnalytics } from '../context/AnalyticsContext';
import { Goal } from '../context/GoalContext';

interface AdvancedChartsProps {
  goals: Goal[];
  selectedGoalId?: string;
  timeRange: '7d' | '30d' | '90d';
}

interface WeeklyHeatmapProps {
  goals: Goal[];
}

export function ProgressTrendChart({ goals, timeRange }: AdvancedChartsProps) {
  const { getGoalProgressHistory } = useAnalytics();
  
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  const generateTrendData = () => {
    const data = [];
    const endDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      let totalProgress = 0;
      let activeGoals = 0;
      
      goals.forEach(goal => {
        if (goal.status === 'active' && !goal.archived) {
          activeGoals++;
          const history = getGoalProgressHistory(goal.id, days);
          const entry = history.find(h => h.date.startsWith(dateStr));
          if (entry) {
            totalProgress += (entry.value / goal.targetValue) * 100;
          } else {
            // Use current progress if no entry for this date
            totalProgress += (goal.currentValue / goal.targetValue) * 100;
          }
        }
      });
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        progress: activeGoals > 0 ? Math.round(totalProgress / activeGoals) : 0,
        activeGoals
      });
    }
    
    return data;
  };

  const data = generateTrendData();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Progress Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
          />
          <Area
            type="monotone"
            dataKey="progress"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPerformanceChart(): JSX.Element {
  const { getCategoryAnalytics } = useAnalytics();
  
  const categoryData = getCategoryAnalytics().map(cat => ({
    name: cat.category || 'Uncategorized',
    completed: cat.completedGoals,
    active: cat.totalGoals - cat.completedGoals,
    averageProgress: Math.round(cat.averageProgress)
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Performance</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={categoryData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
          />
          <Legend />
          <Bar dataKey="completed" fill="#10B981" name="Completed" />
          <Bar dataKey="active" fill="#3B82F6" name="Active" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProductivityTimeChart({ timeRange }: AdvancedChartsProps) {
  const { getProductivityStats } = useAnalytics();
  
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const stats = getProductivityStats(days);
  
  const data = [
    { name: 'Work Time', value: stats.totalWorkTime, color: '#3B82F6' },
    { name: 'Break Time', value: stats.totalBreakTime, color: '#10B981' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
            formatter={(value: number) => [`${value} minutes`, 'Duration']}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Session</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {Math.round(stats.averageSessionLength)} min
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {Math.round(stats.completionRate)}%
          </p>
        </div>
      </div>
    </div>
  );
}

export function GoalProgressComparison({ goals }: AdvancedChartsProps) {
  const data = goals
    .filter(goal => goal.status === 'active' && !goal.archived)
    .map(goal => ({
      name: goal.title.length > 15 ? goal.title.substring(0, 15) + '...' : goal.title,
      progress: Math.round((goal.currentValue / goal.targetValue) * 100),
      target: 100,
      color: goal.color
    }))
    .sort((a, b) => b.progress - a.progress);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Goal Progress Comparison</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            type="number"
            domain={[0, 100]}
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis 
            type="category"
            dataKey="name" 
            stroke="#6B7280"
            fontSize={12}
            width={80}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
            formatter={(value: number) => [`${value}%`, 'Progress']}
          />
          <Bar dataKey="progress" fill="#3B82F6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyHeatmap({ goals }: WeeklyHeatmapProps): JSX.Element {
  const generateHeatmapData = (): Array<{ day: string; productivity: number; sessions: number }> => {
    const data: Array<{ day: string; productivity: number; sessions: number }> = [];
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Calculate productivity based on goals
    const activeGoals = goals.filter(goal => goal.status === 'active' && !goal.archived).length;
    
    daysOfWeek.forEach(day => {
      // Use actual goal data when available, fallback to random for demo
      const productivity = activeGoals > 0 ? 
        Math.floor((goals.filter(g => g.status === 'active').length / goals.length) * 100) : 
        Math.floor(Math.random() * 100);
      
      data.push({
        day,
        productivity,
        sessions: Math.floor(Math.random() * 8) + 1
      });
    });
    
    return data;
  };

  const data = generateHeatmapData();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Activity Heatmap</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="day" 
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
          />
          <Bar 
            dataKey="productivity" 
            fill="#3B82F6" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 