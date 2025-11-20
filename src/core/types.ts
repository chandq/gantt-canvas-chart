export interface Task {
  id: string;
  name: string;
  type?: 'task' | 'leave';
  planStart?: string;
  planEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  dependencies?: string[];
  leftRemark?: string;
  rightRemark?: string;
  styleClass?: string;
}

export interface Row {
  id: string;
  name: string;
  tasks: Task[];
}

export interface GanttData {
  rows: Row[];
}

export interface GanttConfig {
  viewMode?: 'Day' | 'Week' | 'Month' | 'Year';
  rowHeight?: number;
  headerHeight?: number;
  showPlan?: boolean;
  showActual?: boolean;
  showRowLines?: boolean;
  showColLines?: boolean;
  showLeftRemark?: boolean;
  showRightRemark?: boolean;
  showTooltip?: boolean;
}

export interface TaskPosition {
  x_plan_start: number;
  x_plan_end: number;
  x_actual_start: number | null;
  x_actual_end: number | null;
  y: number;
  row: number;
}

export interface VisibleDateRange {
  start: Date;
  end: Date;
}