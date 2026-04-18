import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const TaskAnalytics = ({ stats, tasks }) => {
  const chartData = useMemo(() => {
    // Status distribution for doughnut chart
    const statusData = {
      labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
      datasets: [
        {
          data: [stats.completed, stats.inProgress || 0, stats.pending, stats.overdue],
          backgroundColor: [
            '#10B981', // green
            '#3B82F6', // blue
            '#F59E0B', // yellow
            '#EF4444', // red
          ],
          borderWidth: 2,
        },
      ],
    };

    // Priority distribution for bar chart
    const priorityStats = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    const priorityData = {
      labels: ['High', 'Medium', 'Low'],
      datasets: [
        {
          label: 'Tasks by Priority',
          data: [
            priorityStats.high || 0,
            priorityStats.medium || 0,
            priorityStats.low || 0,
          ],
          backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
          borderWidth: 1,
        },
      ],
    };

    return { statusData, priorityData };
  }, [stats, tasks]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const completionRate = stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) : 0;

  return (
    <div className="task-analytics">
      <div className="analytics-header">
        <h2>Task Analytics</h2>
        <div className="completion-rate">
          <span className="rate-label">Completion Rate:</span>
          <span className="rate-value">{completionRate}%</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Task Status Distribution</h3>
          <Doughnut data={chartData.statusData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3>Tasks by Priority</h3>
          <Bar data={chartData.priorityData} options={chartOptions} />
        </div>
      </div>

      <div className="analytics-insights">
        <h3>Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Productivity Trend</h4>
            <p>You've completed {stats.completed} tasks this week. Keep it up!</p>
          </div>
          <div className="insight-card">
            <h4>Attention Needed</h4>
            <p>{stats.overdue} tasks are overdue. Consider prioritizing them.</p>
          </div>
          <div className="insight-card">
            <h4>Workload Balance</h4>
            <p>You have {stats.pending} pending tasks. Plan your schedule accordingly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAnalytics;