// src/types/analytics.ts
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface AnalyticsFilter {
  status: string;
  priority: string;
  assignee: string;
  category?: string;
  project?: string;
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  taskGrowth: number;
  completionGrowth: number;
  avgCompletionTime: number;
  timeImprovement: number;
  completionTrend: ChartDataPoint[];
  statusDistribution: PieChartData[];
  priorityBreakdown: BarChartData[];
}

export interface ProductivityData {
  score: number;
  scoreChange: number;
  dailyProductivity: ChartDataPoint[];
  weeklyTrends: ChartDataPoint[];
  focusTimeAnalysis: FocusTimeData;
  distractionMetrics: DistractionData;
  peakHours: PeakHoursData[];
  burnoutRisk: BurnoutRiskData;
}

export interface PerformanceData {
  priorityMetrics: PriorityMetric[];
  velocityTrend: ChartDataPoint[];
  qualityScore: QualityMetric;
  estimationAccuracy: EstimationData;
  teamComparison: TeamComparisonData[];
  bottleneckAnalysis: BottleneckData[];
}

export interface TimeTrackingData {
  totalHours: number;
  billableHours: number;
  weeklyHours: ChartDataPoint[];
  projectBreakdown: ProjectTimeData[];
  categoryAnalysis: CategoryTimeData[];
  utilizationRate: number;
  overtimeAnalysis: OvertimeData;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

export interface BarChartData {
  category: string;
  value: number;
  target?: number;
}

export interface FocusTimeData {
  averageFocusTime: number;
  focusTrend: ChartDataPoint[];
  interruptionCount: number;
  deepWorkHours: number;
}

export interface DistractionData {
  totalDistractions: number;
  distractionTypes: PieChartData[];
  impactOnProductivity: number;
  timeWasted: number;
}

export interface PeakHoursData {
  hour: number;
  productivity: number;
  taskCount: number;
}

export interface BurnoutRiskData {
  riskLevel: 'low' | 'medium' | 'high';
  score: number;
  factors: string[];
  recommendations: string[];
}

export interface PriorityMetric {
  priority: string;
  completed: number;
  overdue: number;
  avgCompletionTime: number;
}

export interface QualityMetric {
  score: number;
  bugRate: number;
  reworkRate: number;
  customerSatisfaction: number;
}

export interface EstimationData {
  accuracy: number;
  overestimated: number;
  underestimated: number;
  trend: ChartDataPoint[];
}

export interface TeamComparisonData {
  member: string;
  productivity: number;
  quality: number;
  velocity: number;
}

export interface BottleneckData {
  stage: string;
  avgTime: number;
  taskCount: number;
  impact: 'high' | 'medium' | 'low';
}

export interface ProjectTimeData {
  project: string;
  hours: number;
  percentage: number;
  budget: number;
}

export interface CategoryTimeData {
  category: string;
  hours: number;
  billable: boolean;
  rate?: number;
}

export interface OvertimeData {
  totalOvertime: number;
  weeklyOvertime: ChartDataPoint[];
  overtimeRate: number;
  cost: number;
}

export interface ExportRequest {
  format: 'pdf' | 'excel' | 'csv';
  userId?: string;
  projectId?: string;
  dateRange: DateRange;
  filters: AnalyticsFilter;
  data: {
    taskMetrics: TaskMetrics | null;
    productivityData: ProductivityData | null;
    performanceData: PerformanceData | null;
    timeTrackingData: TimeTrackingData | null;
  };
}

export interface AnalyticsData {
  taskMetrics: TaskMetrics;
  productivityData: ProductivityData;
  performanceData: PerformanceData;
  timeTrackingData: TimeTrackingData;
}

export interface CustomReportConfig {
  id: string;
  name: string;
  description: string;
  widgets: ReportWidget[];
  filters: AnalyticsFilter;
  schedule?: ReportSchedule;
}

export interface ReportWidget {
  id: string;
  type: 'chart' | 'metric' | 'table';
  title: string;
  dataSource: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel';
}