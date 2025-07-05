import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const priorities = ['Low', 'Medium', 'High'] as const;

type Priority = typeof priorities[number];

interface Task {
  name: string;
  priority: Priority;
  timeSpent: number; // in minutes
  completed: boolean;
}

function getTodayString() {
  const now = new Date();
  return now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function DailyProductivity() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState({ name: '', priority: 'Medium' as Priority, timeSpent: 0 });
  const reportRef = useRef<HTMLDivElement>(null);

  // Add task
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.timeSpent <= 0) return;
    setTasks([...tasks, { ...form, completed: true }]);
    setForm({ name: '', priority: 'Medium', timeSpent: 0 });
  };

  // Stats
  const completedTasks = tasks.filter(t => t.completed);
  const totalCompleted = completedTasks.length;
  const totalTime = completedTasks.reduce((sum, t) => sum + t.timeSpent, 0);
  const goalsSet = tasks.length;
  const goalsCompleted = totalCompleted;
  const completionRate = goalsSet > 0 ? Math.round((goalsCompleted / goalsSet) * 100) : 0;
  const avgProgress = goalsSet > 0 ? Math.round((totalTime / goalsSet)) : 0;
  const productivityScore = Math.round((completionRate + avgProgress) / 2);

  // Group by priority
  const tasksByPriority = priorities.map(priority => ({
    priority,
    tasks: completedTasks.filter(t => t.priority === priority),
    count: completedTasks.filter(t => t.priority === priority).length
  }));

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${getTodayString()} Daily Report`, 14, 18);
    doc.setFontSize(12);
    doc.text(`Total Tasks Completed: ${totalCompleted}`, 14, 30);
    doc.text(`Total Work Time: ${totalTime} min`, 14, 38);
    doc.text(`Goals Set: ${goalsSet}`, 14, 46);
    doc.text(`Goals Completed: ${goalsCompleted}`, 14, 54);
    doc.text(`Completion Rate: ${completionRate}%`, 14, 62);
    doc.text(`Average Progress: ${avgProgress} min/task`, 14, 70);
    doc.text(`Productivity Score: ${productivityScore}`, 14, 78);
    let y = 90;
    priorities.forEach(priority => {
      const group = tasksByPriority.find(g => g.priority === priority)!;
      doc.setFontSize(14);
      doc.text(`${priority} Priority (${group.count})`, 14, y);
      y += 8;
      doc.setFontSize(11);
      if (group.tasks.length === 0) {
        doc.text('None', 18, y);
        y += 8;
      } else {
        group.tasks.forEach(task => {
          doc.text(`- ${task.name} (${task.timeSpent} min)`, 18, y);
          y += 8;
        });
      }
      y += 2;
    });
    doc.save(`Daily_Report_${getTodayString().replace(/\s/g, '_')}.pdf`);
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Daily Productivity Tracker</h1>
      <div className="mb-6 text-gray-500">{getTodayString()} Daily Report</div>
      {/* Task Input */}
      <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          className="flex-1 p-2 border rounded"
          placeholder="Task name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
        <label htmlFor="priority-select" className="sr-only">Priority</label>
        <select
          id="priority-select"
          className="p-2 border rounded"
          value={form.priority}
          onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
          title="Select priority"
        >
          {priorities.map(p => <option key={p}>{p}</option>)}
        </select>
        <input
          className="w-24 p-2 border rounded"
          type="number"
          min={1}
          placeholder="Time (min)"
          value={form.timeSpent || ''}
          onChange={e => setForm(f => ({ ...f, timeSpent: Number(e.target.value) }))}
          required
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" type="submit">Add Task</button>
      </form>
      {/* Dashboard */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded p-4">
          <div className="text-sm text-blue-700 font-semibold">Tasks Completed</div>
          <div className="text-2xl font-bold">{totalCompleted}</div>
        </div>
        <div className="bg-green-50 rounded p-4">
          <div className="text-sm text-green-700 font-semibold">Total Work Time</div>
          <div className="text-2xl font-bold">{totalTime} min</div>
        </div>
        <div className="bg-purple-50 rounded p-4">
          <div className="text-sm text-purple-700 font-semibold">Goals Set vs Completed</div>
          <div className="text-2xl font-bold">{goalsCompleted} / {goalsSet} ({completionRate}%)</div>
        </div>
        <div className="bg-yellow-50 rounded p-4">
          <div className="text-sm text-yellow-700 font-semibold">Productivity Score</div>
          <div className="text-2xl font-bold">{productivityScore}</div>
        </div>
      </div>
      {/* Task Breakdown by Priority */}
      <div className="mb-6" ref={reportRef}>
        {tasksByPriority.map(group => (
          <div key={group.priority} className="mb-4">
            <div className="font-semibold text-lg mb-1">{group.priority} Priority ({group.count})</div>
            <ul className="list-disc ml-6">
              {group.tasks.length === 0 ? (
                <li className="text-gray-400">None</li>
              ) : (
                group.tasks.map((task, i) => (
                  <li key={i}>{task.name} <span className="text-xs text-gray-500">({task.timeSpent} min)</span></li>
                ))
              )}
            </ul>
          </div>
        ))}
      </div>
      {/* Generate Report */}
      <button className="bg-green-600 text-white px-6 py-2 rounded font-semibold" onClick={exportPDF}>
        Export PDF
      </button>
    </div>
  );
} 