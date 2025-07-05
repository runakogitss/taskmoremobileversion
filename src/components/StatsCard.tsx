import React from 'react';
interface StatsCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  color: string;
}

export function StatsCard({ icon: Icon, title, value, color }: StatsCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <Icon size={24} className={color} />
      </div>
    </div>
  );
}