// src/components/analytics/AnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, DatePicker, Select, Button, Spin } from 'antd';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import { useAnalytics } from '../../hooks/useAnalytics';
import { DateRange, AnalyticsFilter } from '../../types/analytics';
import './AnalyticsDashboard.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface AnalyticsDashboardProps {
  userId?: string;
  projectId?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  projectId
}) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  const [filters, setFilters] = useState<AnalyticsFilter>({
    status: 'all',
    priority: 'all',
    assignee: 'all'
  });

  const {
    taskMetrics,
    productivityData,
    performanceData,
    timeTrackingData,
    loading,
    error,
    exportReport,
    refreshData
  } = useAnalytics({ userId, projectId, dateRange, filters });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      await exportReport(format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <Spin size="large" />
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Analytics & Reporting</h2>
        <div className="analytics-controls">
          <RangePicker
            value={[dateRange.startDate, dateRange.endDate]}
            onChange={(dates) => {
              if (dates) {
                setDateRange({
                  startDate: dates[0]?.toDate() || new Date(),
                  endDate: dates[1]?.toDate() || new Date()
                });
              }
            }}
          />
          <Select
            placeholder="Filter by Status"
            style={{ width: 150 }}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Option value="all">All Status</Option>
            <Option value="todo">To Do</Option>
            <Option value="in-progress">In Progress</Option>
            <Option value="completed">Completed</Option>
          </Select>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleExport('pdf')}
          >
            Export Report
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {/* Key Metrics Cards */}
        <Col span={6}>
          <Card className="metric-card">
            <div className="metric-content">
              <h3>Total Tasks</h3>
              <div className="metric-value">{taskMetrics?.totalTasks || 0}</div>
              <div className="metric-change positive">
                +{taskMetrics?.taskGrowth || 0}% from last period
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="metric-card">
            <div className="metric-content">
              <h3>Completion Rate</h3>
              <div className="metric-value">
                {taskMetrics?.completionRate || 0}%
              </div>
              <div className="metric-change positive">
                +{taskMetrics?.completionGrowth || 0}% improvement
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="metric-card">
            <div className="metric-content">
              <h3>Avg. Completion Time</h3>
              <div className="metric-value">
                {taskMetrics?.avgCompletionTime || 0}h
              </div>
              <div className="metric-change negative">
                -{taskMetrics?.timeImprovement || 0}% faster
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="metric-card">
            <div className="metric-content">
              <h3>Productivity Score</h3>
              <div className="metric-value">
                {productivityData?.score || 0}/100
              </div>
              <div className="metric-change positive">
                +{productivityData?.scoreChange || 0} points
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Task Completion Trend */}
        <Col span={12}>
          <Card title="Task Completion Trend" className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={taskMetrics?.completionTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#52c41a"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#1890ff"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Task Status Distribution */}
        <Col span={12}>
          <Card title="Task Status Distribution" className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskMetrics?.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(taskMetrics?.statusDistribution || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Productivity Analysis */}
        <Col span={24}>
          <Card title="Productivity Analysis" className="chart-card">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={productivityData?.dailyProductivity || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="tasksCompleted"
                  stackId="1"
                  stroke="#52c41a"
                  fill="#52c41a"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="hoursWorked"
                  stackId="2"
                  stroke="#1890ff"
                  fill="#1890ff"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="focusTime"
                  stackId="3"
                  stroke="#722ed1"
                  fill="#722ed1"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Performance Metrics */}
        <Col span={12}>
          <Card title="Performance by Priority" className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData?.priorityMetrics || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#52c41a" />
                <Bar dataKey="overdue" fill="#ff4d4f" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Time Tracking */}
        <Col span={12}>
          <Card title="Time Tracking Overview" className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeTrackingData?.weeklyHours || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="planned" fill="#1890ff" />
                <Bar dataKey="actual" fill="#52c41a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsDashboard;