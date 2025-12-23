
export interface Task {
  id: string;
  name: string;
  type?: 'task' | 'leave' | 'overtime' | string;
  planStart?: string; // Plan start date, date separated by '/'
  planEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  dependencies?: string[];
  leftRemark?: string;
  rightRemark?: string;
  centerRemark?: string;
  styleClass?: string;
  planBorderColor?: string;
  actualBgColor?: string;
  hide?: boolean; // Whether to hide this data, default false
  _data?: any;  // Store custom data
  planOffsetPercent?: [number, number]; // Draw daily task progress (plan) based on [start coordinate offset percentage, progress percentage]
  actualOffsetPercent?: [number, number]; // Draw daily task progress (actual) based on [start coordinate offset percentage, progress percentage]
}

export interface Row {
  id: string;
  name: string;
  hide?: boolean; // Whether to hide this row
  tasks: Task[];
}

export type GanttData = Row[]

export type LoadMoreDirection = 'left' | 'right' | 'bottom'

export interface GanttConfig {
  viewMode?: 'Day' | 'Week' | 'Month' | 'Year';
  planBorderColor?: string;
  actualBgColor?: string;
  headerBgColor?: string;
  rowHeight?: number;
  headerHeight?: number;
  showPlan?: boolean;
  showActual?: boolean;
  showRowLines?: boolean;
  showColLines?: boolean;
  showLeftRemark?: boolean;
  showRightRemark?: boolean;
  showCenterRemark?: boolean;
  showTooltip?: boolean;
  queryStartDate?: Date;  // Set start date of gantt timeline, default from calculate from the first task
  queryEndDate?: Date;  // Set end date of gantt timeline, default from calculate from the last task
  tooltipColor?: 'black' | 'white';
  todayColor?: string;
  weekendBgColor?: string;  // Weekend/holiday header background color
  holidays?: string[]; // Collection of holiday dates, recommended format yyyy/MM/dd
  dateSeparator?: string; // Date format separator in GanttData, default '/'
  offsetTop?: number; // Tooltip position top offset (when embedded in micro frontend framework, child app page elements have offset relative to main app)
  offsetLeft?: number; // Tooltip position left offset (when embedded in micro frontend framework, child app page elements have offset relative to main app)
  scrollEdgeThresholds?: number; // Scroll edge threshold to trigger load more
  xGap?: number;  // Gap between tasks, default 0
  enabledLoadMore?: [LoadMoreDirection?, LoadMoreDirection?, LoadMoreDirection?]
  viewFactors?: { Day: number, Week: number, Month: number, Year: number },
  tooltipFormat?: null | ((task: Row, date: Date, config: GanttConfig) => string);
}

export interface TaskPosition {
  x_plan_start: number;
  x_plan_end: number;
  x_actual_start: number | null;
  x_actual_end: number | null;
  x_plan_width: number;
  x_actual_width: number;
  offset_x_plan_start: number | null;  // real x_plan_start with offsetPercent
  offset_x_plan_end: number | null;  // real x_plan_end with offsetPercent
  offset_x_actual_start: number | null;   // real x_actual_start with offsetPercent
  offset_x_actual_end: number | null;   // real x_actual_end with offsetPercent
  y: number;
  row: number;
}

export interface VisibleDateRange {
  start: Date;
  end: Date;
}