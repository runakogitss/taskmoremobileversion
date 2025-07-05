import React, { useState, useEffect } from 'react';
import { useGoals } from '../context/GoalContext';
import { X } from 'lucide-react';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGoalModal({ isOpen, onClose }: CreateGoalModalProps) {
  const { addGoal } = useGoals();
  // Helper to get current datetime-local string rounded up to next minute
  const getNowLocal = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    now.setMinutes(now.getMinutes() + 1); // always at least next minute
    return now.toISOString().slice(0, 16);
  };
  const [minDeadline, setMinDeadline] = useState(getNowLocal());
  const [formData, setFormData] = useState({
    title: '',
    deadline: getNowLocal(),
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  // Update minDeadline and default deadline every time modal is opened
  useEffect(() => {
    if (isOpen) {
      const nowLocal = getNowLocal();
      setMinDeadline(nowLocal);
      setFormData(f => ({ ...f, deadline: nowLocal }));
    }
  }, [isOpen]);

  // Helper to check if selected date is today
  const isToday = (dateStr: string) => {
    const selected = new Date(dateStr);
    return new Date().toISOString().slice(0, 10) === selected.toISOString().slice(0, 10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.deadline) return;
    const selected = new Date(formData.deadline);
    const min = new Date(minDeadline);
    if (selected < min) {
      alert('Deadline cannot be in the past.');
      return;
    }
    addGoal({
      title: formData.title,
      description: '',
      category: '',
      targetValue: 1,
      currentValue: 0,
      unit: '',
      deadline: formData.deadline,
      priority: formData.priority,
      status: 'active',
      color: '#3B82F6',
      archived: false
    });
    onClose();
    const nowLocal = getNowLocal();
    setMinDeadline(nowLocal);
    setFormData({
      title: '',
      deadline: nowLocal,
      priority: 'medium',
    });
  };

  // When user changes the date, if it's today, keep min as now; if future, min is 00:00 of that day
  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, deadline: value });
    const selected = new Date(value);
    if (isToday(value)) {
      setMinDeadline(getNowLocal());
    } else {
      // Set min to 00:00 of selected day
      const minDate = new Date(selected);
      minDate.setHours(0, 0, 0, 0);
      setMinDeadline(minDate.toISOString().slice(0, 16));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Goal</h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Goal Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              placeholder="Enter goal name"
              required
              title="Goal details"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Deadline</label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={handleDeadlineChange}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              required
              title="Pick your deadline date and time"
              min={minDeadline}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Priority</label>
            <div className="flex space-x-2">
              {(['low', 'medium', 'high'] as const).map(priority => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    formData.priority === priority
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              title="Submit goal"
            >
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}