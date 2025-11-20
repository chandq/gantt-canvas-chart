import { GanttChart } from './core/ganttChart';
// import { getDemo1Data } from './data/demo1';
// import { getDemo2Data } from './data/demo2';
import './styles/gantt.css';

export { GanttChart };

// For backward compatibility with existing HTML
export function initializeGantt(container: HTMLElement, data: any, config: any) {
  return new GanttChart(container, data, config);
}