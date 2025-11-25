
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
  centerRemark?: string;
  styleClass?: string;
  planBorderColor?: string;
  actualBgColor?: string;
  _data?: any;  // 存放自定义的数据
  planOffsetPercent?: [number, number]; // 根据[起始坐标偏移百分比，显示进度百分比]绘制按日展示时任务进度（计划）
  actualOffsetPercent?: [number, number]; // 根据[起始坐标偏移百分比，显示进度百分比]绘制按日展示时任务进度（实际）

}

export interface Row {
  id: string;
  name: string;
  tasks: Task[];
}

export type GanttData = Row[]

export interface GanttConfig {
  viewMode?: 'Day' | 'Week' | 'Month' | 'Year';
  planBorderColor?: string;
  actualBgColor?: string;
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
  tooltipColor?: 'black' | 'white';
  offsetTop?: number;
  offsetLeft?: number;
  viewFactors?: { Day: number, Week: number, Month: number, Year: number },
  tooltipFormat?: null | ((task: Row, date: Date, config: GanttConfig) => string);
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