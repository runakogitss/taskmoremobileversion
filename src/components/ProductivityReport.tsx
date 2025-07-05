import { useState } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { useTranslation } from 'react-i18next';
import { Download, Calendar, TrendingUp, Clock, Target, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ProductivityReportProps {
  onClose: () => void;
}

export function ProductivityReport({ onClose }: ProductivityReportProps) {
  const { t } = useTranslation();
  const { generateProductivityReport } = useAnalytics();
  
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<{
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
      title: string;
      category: string;
      progress: number;
      timeSpent: number;
      status: string;
    }>;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = () => {
    setIsGenerating(true);
    try {
      const report = generateProductivityReport(startDate, endDate);
      setReportData(report);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Productivity Report Summary'],
      [''],
      ['Report Period', `${startDate} to ${endDate}`],
      ['Generated On', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
      [''],
      ['Key Metrics', 'Value'],
      ['Total Goals', reportData.summary.totalGoals],
      ['Completed Goals', reportData.summary.completedGoals],
      ['Completion Rate', `${Math.round((reportData.summary.completedGoals / reportData.summary.totalGoals) * 100)}%`],
      ['Total Work Time (hours)', Math.round(reportData.summary.totalWorkTime / 60 * 10) / 10],
      ['Average Daily Progress', `${reportData.summary.averageDailyProgress}%`],
      ['Most Productive Category', reportData.summary.mostProductiveCategory],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Daily Progress Sheet
    const dailyProgressData = [
      ['Date', 'Progress (%)', 'Work Time (min)', 'Goals Updated'],
      ...reportData.dailyProgress.map((day: {
        date: string;
        progress: number;
        workTime: number;
        goalsUpdated: number;
      }) => [
        day.date,
        day.progress,
        day.workTime,
        day.goalsUpdated
      ])
    ];

    const dailyProgressSheet = XLSX.utils.aoa_to_sheet(dailyProgressData);
    XLSX.utils.book_append_sheet(workbook, dailyProgressSheet, 'Daily Progress');

    // Goal Breakdown Sheet
    const goalBreakdownData = [
      ['Goal Title', 'Category', 'Progress (%)', 'Time Spent (min)', 'Status'],
      ...reportData.goalBreakdown.map((goal: {
        title: string;
        category: string;
        progress: number;
        timeSpent: number;
        status: string;
      }) => [
        goal.title,
        goal.category,
        goal.progress,
        goal.timeSpent,
        goal.status
      ])
    ];

    const goalBreakdownSheet = XLSX.utils.aoa_to_sheet(goalBreakdownData);
    XLSX.utils.book_append_sheet(workbook, goalBreakdownSheet, 'Goal Breakdown');

    // Export the file
    const fileName = `productivity_report_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // PDF Export (Bluebook SAT style)
  const exportToPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    // Bluebook-style header
    doc.setFillColor(33, 87, 194); // Blue
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Productivity Report', 14, 17);
    doc.setFontSize(12);
    doc.text(`${startDate} to ${endDate}`, 150, 17, { align: 'right', maxWidth: 50 });
    doc.setTextColor(0, 0, 0);
    let y = 32;
    // Summary Section
    doc.setFontSize(15);
    doc.text('Summary', 14, y);
    y += 6;
    (doc as unknown as { autoTable: (options: {
      startY: number;
      head: string[][];
      body: (string | number)[][];
      theme: string;
      headStyles: { fillColor: number[] };
      styles: { fontSize: number };
      margin: { left: number; right: number };
    }) => void }).autoTable({
      startY: y,
      head: [['Key Metric', 'Value']],
      body: [
        ['Total Goals', reportData.summary.totalGoals],
        ['Completed Goals', reportData.summary.completedGoals],
        ['Completion Rate', `${Math.round((reportData.summary.completedGoals / reportData.summary.totalGoals) * 100)}%`],
        ['Total Work Time (hours)', Math.round(reportData.summary.totalWorkTime / 60 * 10) / 10],
        ['Average Daily Progress', `${reportData.summary.averageDailyProgress}%`],
        ['Most Productive Category', reportData.summary.mostProductiveCategory],
      ],
      theme: 'grid',
      headStyles: { fillColor: [33, 87, 194] },
      styles: { fontSize: 11 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    // Daily Progress Section
    doc.setFontSize(15);
    doc.text('Daily Progress', 14, y);
    y += 6;
    (doc as unknown as { autoTable: (options: {
      startY: number;
      head: string[][];
      body: (string | number)[][];
      theme: string;
      headStyles: { fillColor: number[] };
      styles: { fontSize: number };
      margin: { left: number; right: number };
    }) => void }).autoTable({
      startY: y,
      head: [['Date', 'Progress (%)', 'Work Time (min)', 'Goals Updated']],
      body: reportData.dailyProgress.map((day: {
        date: string;
        progress: number;
        workTime: number;
        goalsUpdated: number;
      }) => [day.date, day.progress, day.workTime, day.goalsUpdated]),
      theme: 'grid',
      headStyles: { fillColor: [33, 87, 194] },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    // Goal Breakdown Section
    doc.setFontSize(15);
    doc.text('Goal Breakdown', 14, y);
    y += 6;
    (doc as unknown as { autoTable: (options: {
      startY: number;
      head: string[][];
      body: (string | number)[][];
      theme: string;
      headStyles: { fillColor: number[] };
      styles: { fontSize: number };
      margin: { left: number; right: number };
    }) => void }).autoTable({
      startY: y,
      head: [['Goal Title', 'Category', 'Progress (%)', 'Time Spent (min)', 'Status']],
      body: reportData.goalBreakdown.map((goal: {
        title: string;
        category: string;
        progress: number;
        timeSpent: number;
        status: string;
      }) => [goal.title, goal.category, goal.progress, goal.timeSpent, goal.status]),
      theme: 'grid',
      headStyles: { fillColor: [33, 87, 194] },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });
    doc.save(`productivity_report_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FileText size={24} className="text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('productivity_report')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Date Range Selection */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar size={20} className="mr-2" />
              {t('select_date_range')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('start_date')}
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  aria-label="Start date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('end_date')}
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  aria-label="End date"
                />
              </div>
            </div>
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="mt-4 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <TrendingUp size={20} className="mr-2" />
                  {t('generate_report')}
                </>
              )}
            </button>
          </div>

          {/* Report Results */}
          {reportData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">{t('total_goals')}</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {reportData.summary.totalGoals}
                      </p>
                    </div>
                    <Target size={24} className="text-blue-500" />
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">{t('completed_goals')}</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {reportData.summary.completedGoals}
                      </p>
                    </div>
                    <TrendingUp size={24} className="text-green-500" />
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400">{t('total_work_time')}</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {Math.round(reportData.summary.totalWorkTime / 60 * 10) / 10}h
                      </p>
                    </div>
                    <Clock size={24} className="text-purple-500" />
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 dark:text-orange-400">{t('avg_daily_progress')}</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {reportData.summary.averageDailyProgress}%
                      </p>
                    </div>
                    <TrendingUp size={24} className="text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {t('quick_insights')}
                </h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p>• {t('most_productive_category')}: <span className="font-semibold">{reportData.summary.mostProductiveCategory}</span></p>
                  <p>• {t('completion_rate')}: <span className="font-semibold">{Math.round((reportData.summary.completedGoals / reportData.summary.totalGoals) * 100)}%</span></p>
                  <p>• {t('average_work_session')}: <span className="font-semibold">{Math.round(reportData.summary.totalWorkTime / reportData.dailyProgress.length / 60 * 10) / 10} hours/day</span></p>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex gap-2">
                <button
                  onClick={exportToExcel}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Download size={20} className="mr-2" />
                  {t('export_to_excel')}
                </button>
                <button
                  onClick={exportToPDF}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <FileText size={20} className="mr-2" />
                  {t('export_to_pdf')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 