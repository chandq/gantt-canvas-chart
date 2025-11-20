import { GanttChart } from '../src/core/ganttChart';
import { getDemo1Data } from './demo1';
import { getDemo2Data } from './demo2';
import '../src/styles/gantt.css';

export { GanttChart, getDemo1Data, getDemo2Data };

// For backward compatibility with existing HTML
export function initializeGantt(container: HTMLElement, data: any, config: any) {
  return new GanttChart(container, data, config);
}