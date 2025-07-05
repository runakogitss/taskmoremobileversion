import './ProgressChart.css';
import { Goal } from '../context/GoalContext';

interface ProgressChartProps {
  goals: Goal[];
}

export function ProgressChart({ goals }: ProgressChartProps) {
  const generateChartData = () => {
    const data = [];
    const endDate = new Date();
    const days = 7; // Show last 7 days by default

    // Generate data for the last 7 days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - i);
      
      // Calculate progress for this date based on goals
      let totalProgress = 0;
      let activeGoals = 0;
      
      goals.forEach(goal => {
        if (goal.status === 'active' && !goal.archived) {
          activeGoals++;
          totalProgress += (goal.currentValue / goal.targetValue) * 100;
        }
      });
      
      const dailyProgress = activeGoals > 0 ? totalProgress / activeGoals : 0;

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        progress: Math.round(dailyProgress)
      });
    }
    
    return data;
  };

  const chartData = generateChartData();
  const maxProgress = Math.max(...chartData.map(d => d.progress), 1); // Ensure maxProgress is at least 1

  return (
    <div className="h-48">
      <div className="flex items-end justify-between h-full space-x-1">
        {chartData.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full flex-1 flex items-end">
              <div 
                className="progress-bar-segment w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t transition-all duration-300 hover:opacity-80"
                data-bar-height={`${(data.progress / maxProgress) * 100}%`}
              />
            </div>
            <span className="text-xs text-gray-400 mt-2">
                {data.date}
              </span>
          </div>
        ))}
      </div>
    </div>
  );
}