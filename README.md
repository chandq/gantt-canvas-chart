# Gantt Canvas Chart

A high-performance Gantt chart implementation using HTML5 Canvas with virtual rendering for optimal performance. This component is framework-agnostic and can be integrated into any web application regardless of the technology stack.

## Features

### High-Performance Virtual Rendering

- Utilizes HTML5 Canvas for efficient rendering
- Implements virtual scrolling to handle large datasets without performance degradation
- Only renders visible elements, optimizing both memory and CPU usage
- Smooth scrolling experience even with thousands of tasks

### Framework Agnostic

- Pure TypeScript implementation with no framework dependencies
- Can be easily integrated into React, Vue, Angular, or vanilla JavaScript projects
- Simple API for initialization and data updates
- Lightweight and fast integration

### Comprehensive Gantt Functionality

- **Multiple View Modes**: Day, Week, Month, and Year views
- **Task Visualization**: Plan vs Actual progress comparison
- **Dependency Lines**: Visualize task dependencies with smart routing
- **Customizable Styling**: Configurable colors and appearance
- **Interactive Elements**: Tooltip support with detailed information
- **Today Indicator**: Clear visualization of current date
- **Grid Lines**: Toggle row and column lines for better readability
- **Responsive Design**: Automatically adapts to container size changes

### Rich Visualization Options

- Plan timelines with customizable border colors
- Actual progress bars with configurable background colors
- Support for different task types including leave/vacation tasks
- Multiple annotation options (left, center, right remarks)
- Custom CSS classes for specific styling needs

## Installation

```bash
npm install gantt-canvas-chart
```

Or include directly via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/gantt-canvas-chart/dist/index.umd.js"></script>
```

## Usage Example

> Requirements for examples: Node.js version 22.12.+, if you installed nvm, you can execute `nvm use` to switch to the specified version.

```bash
1. npm run dev
2. npm run dev:mock # if as needs,Run mock server for show load more functions demo
```

![Project plan](/assets/project-plan.jpg)
![Project member tasks](/assets/project-member-task.jpg)

```typescript
import { GanttChart } from 'gantt-canvas-chart';

// Prepare your data
const ganttData = [
  {
    name: 'Project Phase 1',
    tasks: [
      {
        id: '1',
        name: 'Research',
        planStart: '2023-06-01',
        planEnd: '2023-06-15',
        actualStart: '2023-06-01',
        actualEnd: '2023-06-17',
        dependencies: []
      },
      {
        id: '2',
        name: 'Design',
        planStart: '2023-06-16',
        planEnd: '2023-06-30',
        actualStart: '2023-06-18',
        actualEnd: '2023-07-05',
        dependencies: ['1']
      }
    ]
  },
  {
    name: 'Project Phase 2',
    tasks: [
      {
        id: '3',
        name: 'Implementation',
        planStart: '2023-07-01',
        planEnd: '2023-07-31',
        actualStart: '2023-07-06',
        actualEnd: '2023-07-28',
        dependencies: ['2']
      }
    ]
  }
];

// Configuration options
const config = {
  viewMode: 'Month',
  rowHeight: 48,
  headerHeight: 56,
  showPlan: true,
  showActual: true,
  showTooltip: true
};

// Initialize the chart
const container = document.getElementById('gantt-container');
const ganttChart = new GanttChart(container, ganttData, config);

// Update data dynamically
ganttChart.setData(newData);

// Update configuration
ganttChart.updateConfig({ viewMode: 'Week' });
```

## Full options list

```typescript
interface Task {
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
  _data?: any; // Store custom data
  planOffsetPercent?: [number, number]; // Draw daily task progress (plan) based on [start coordinate offset percentage, progress percentage]
  actualOffsetPercent?: [number, number]; // Draw daily task progress (actual) based on [start coordinate offset percentage, progress percentage]
}

interface Row {
  id: string;
  name: string;
  hide?: boolean; // Whether to hide this row
  tasks: Task[];
}

type GanttData = Row[];

type LoadMoreDirection = 'left' | 'right' | 'bottom';

interface GanttConfig {
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
  queryStartDate?: Date | null; // Set start date of gantt timeline, default from calculate from the first task
  queryEndDate?: Date | null; // Set end date of gantt timeline, default from calculate from the last task
  tooltipColor?: 'black' | 'white';
  todayColor?: string;
  weekendBgColor?: string; // Weekend/holiday header background color
  holidays?: string[]; // Collection of holiday dates, recommended format yyyy/MM/dd
  dateSeparator?: string; // Date format separator in GanttData, default '/'
  offsetTop?: number; // Tooltip position top offset (when embedded in micro frontend framework, child app page elements have offset relative to main app)
  offsetLeft?: number; // Tooltip position left offset (when embedded in micro frontend framework, child app page elements have offset relative to main app)
  scrollEdgeThresholds?: number; // Scroll edge threshold to trigger load more
  xGap?: number; // Gap between tasks, default 0
  enabledLoadMore?: [LoadMoreDirection?, LoadMoreDirection?, LoadMoreDirection?];
  viewFactors?: { Day: number; Week: number; Month: number; Year: number };
  tooltipFormat?: null | ((task: Row, date: Date, config: GanttConfig) => string);
}

interface TaskPosition {
  x_plan_start: number;
  x_plan_end: number;
  x_actual_start: number | null;
  x_actual_end: number | null;
  x_plan_width: number;
  x_actual_width: number;
  offset_x_plan_start: number | null; // real x_plan_start with offsetPercent
  offset_x_plan_end: number | null; // real x_plan_end with offsetPercent
  offset_x_actual_start: number | null; // real x_actual_start with offsetPercent
  offset_x_actual_end: number | null; // real x_actual_end with offsetPercent
  y: number;
  row: number;
}
```
