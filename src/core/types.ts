
export interface Task {
  id: string;
  name: string;
  type?: 'task' | 'leave';
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
  tooltipColor?: 'black' | 'white';
  todayColor?: string;
  offsetTop?: number; // tooltip位置的顶部偏移量（嵌入在微前端框架中时，子应用页面元素相对主应用的顶部位置有偏移量）
  offsetLeft?: number; // tooltip位置的左侧偏移量（嵌入在微前端框架中时，子应用页面元素相对主应用的左侧位置有偏移量）
  scrollEdgeThresholds?: number; // 滚动边缘触发加载更多
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
  offset_x_plan_start: number;  // real x_plan_start with offsetPercent
  offset_x_plan_end: number;  // real x_plan_end with offsetPercent
  offset_x_actual_start: number | null;   // real x_actual_start with offsetPercent
  offset_x_actual_end: number | null;   // real x_actual_end with offsetPercent
  y: number;
  row: number;
}

export interface VisibleDateRange {
  start: Date;
  end: Date;
}