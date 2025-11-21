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
<script src="https://cdn.jsdelivr.net/npm/gantt-canvas-chart/dist/gantt-chart.min.js"></script>
```

## Usage Example

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
