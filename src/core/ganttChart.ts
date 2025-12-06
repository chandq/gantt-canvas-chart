import { DateUtils } from './dateUtils';
import type {
  GanttData,
  GanttConfig,
  TaskPosition,
  VisibleDateRange,
  Task
} from './types';
import { firstValidValue } from './utils';

export class GanttChart {
  private rootContainer: HTMLElement;
  public container: HTMLElement;
  private data: GanttData;
  private config: Required<GanttConfig>;

  private headerCanvas: HTMLCanvasElement;
  private mainCanvas: HTMLCanvasElement;
  private scrollDummy: HTMLElement;
  private tooltip: HTMLElement;
  private scrolling: boolean;
  private showTooltip: boolean;

  private headerCtx: CanvasRenderingContext2D;
  private mainCtx: CanvasRenderingContext2D;

  private timelineStart: Date;
  private timelineEnd: Date;
  public minDate: Date | null;
  public maxDate: Date | null;
  private pixelsPerDay: number;
  private scrollLeft: number;
  private scrollTop: number;
  private visibleDateRange: VisibleDateRange;
  public today: Date;
  private devicePixelRatio: number;
  private viewportWidth: number;
  private viewportHeight: number;
  private totalWidth: number;
  private totalHeight: number;

  private resizeObserver: ResizeObserver | null;

  private taskPositions: Map<string, TaskPosition>;
  private taskMap: Map<string, { row: number; task: Task }>;

  private isLoadingData: boolean = false;
  private hasMoreDataLeft: boolean = true;
  private hasMoreDataRight: boolean = true;
  private hasMoreDataBottom: boolean = true;
  private lastScrollLeft: number = 0;
  private lastScrollTop: number = 0;
  private onDataLoad: ((direction: 'left' | 'right' | 'bottom', params?: any) => Promise<GanttData | null>) | null = null;
  private scrollLoadTimer: number | null = null;

  constructor(rootContainer: HTMLElement, data: GanttData, config: GanttConfig = {}) {

    if (rootContainer.querySelector('.__gantt-chart-container')) {
      throw new Error('GanttChart already exists in this container');
    }

    const container = document.createElement('div');
    const scrollEl = document.createElement('div');
    const headerCanvas = document.createElement('canvas');
    const mainCanvas = document.createElement('canvas');
    // container.setAttribute('id', '__gantt-chart-container');
    container.classList.add('__gantt-chart-container');

    // scrollEl.setAttribute('id', '__gantt-scroll-dummy');
    scrollEl.classList.add('__gantt-scroll-dummy');
    // headerCanvas.setAttribute('id', '__gantt-header-canvas');
    headerCanvas.classList.add('__gantt-header-canvas');
    // mainCanvas.setAttribute('id', '__gantt-main-canvas');
    mainCanvas.classList.add('__gantt-main-canvas');

    container.appendChild(scrollEl)
    container.appendChild(headerCanvas)
    container.appendChild(mainCanvas)

    rootContainer.classList.add('__gantt-chart-wrapper');
    rootContainer.appendChild(container);


    this.resizeObserver = null;
    this.rootContainer = rootContainer;
    this.container = container;
    this.data = data;
    this.scrolling = false;
    this.showTooltip = false;
    this.config = {
      viewMode: 'Month',
      rowHeight: 48,
      headerHeight: 56,
      showPlan: true,
      showActual: true,
      showRowLines: true,
      showColLines: true,
      showLeftRemark: false,
      showRightRemark: false,
      showCenterRemark: false,
      showTooltip: true,
      tooltipFormat: null,
      tooltipColor: 'black',
      todayColor: '#ff4d4f',
      offsetTop: 0,
      offsetLeft: 0,
      enabledLoadMore: [],
      viewFactors: { Day: 80, Week: 20, Month: 15, Year: 6 },

      planBorderColor: '#C1EFCF',
      actualBgColor: '#5AC989',
      headerBgColor: '#f9f9f9',
      ...config
    };
    this.updateLoadMoreConf()

    this.headerCanvas = headerCanvas as HTMLCanvasElement;
    this.mainCanvas = mainCanvas as HTMLCanvasElement;
    this.scrollDummy = scrollEl!;
    const tooltip = document.createElement('div');
    // tooltip.setAttribute('id', '__gantt-tooltip');
    tooltip.classList.add('__gantt-tooltip');
    document.body.appendChild(tooltip);
    this.tooltip = tooltip!;
    this.mainCanvas.style.top = `${this.config.headerHeight}px`;

    this.headerCtx = this.headerCanvas.getContext('2d')!;
    this.mainCtx = this.mainCanvas.getContext('2d')!;

    this.timelineStart = new Date();
    this.timelineEnd = new Date();
    this.minDate = null;
    this.maxDate = null;
    this.pixelsPerDay = 40;
    this.scrollLeft = 0;
    this.scrollTop = 0;
    this.visibleDateRange = { start: new Date(), end: new Date() };
    this.today = new Date(new Date().setHours(0, 0, 0, 0));
    this.devicePixelRatio = window.devicePixelRatio || 1;

    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.totalWidth = 0;
    this.totalHeight = 0;

    this.taskPositions = new Map();
    this.taskMap = new Map();

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.horizontalScrollTo = this.horizontalScrollTo.bind(this);
    this.verticalScrollTo = this.verticalScrollTo.bind(this);
    this.handleResize = this.handleResize.bind(this);


    this.init();
  }


  private init(): void {
    this.buildTaskMap();
    this.calculateFullTimeline();
    this.updatePixelsPerDay();
    this.setupEvents();
    this.handleResize();
  }

  private updateLoadMoreConf() {
    this.hasMoreDataLeft = this.config.enabledLoadMore.includes('left')
    this.hasMoreDataRight = this.config.enabledLoadMore.includes('right')
    this.hasMoreDataBottom = this.config.enabledLoadMore.includes('bottom')
  }

  private buildTaskMap(): void {
    this.taskMap.clear();
    this.data.forEach((row, rowIndex) => {
      row.tasks.forEach(task => this.taskMap.set(task.id, { row: rowIndex, task }));
    });
  }

  private setupEvents(): void {
    this.container.addEventListener('scroll', this.handleScroll);
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      setTimeout(() => {
        this.resizeObserver!.observe(this.rootContainer);
      }, 100);

    }
    // window.addEventListener('resize', this.handleResize.bind(this));
    if (this.config.showTooltip) {
      this.mainCanvas.addEventListener('mousemove', this.handleMouseMove);
      this.mainCanvas.addEventListener('mouseleave', this.handleMouseLeave);
    }
  }

  public updateConfig(newConfig: GanttConfig): void {
    Object.assign(this.config, newConfig);
    if (newConfig.viewMode) {
      this.container.scrollLeft = 0;
      this.scrollLeft = 0;
      this.updatePixelsPerDay();
      this.calculateFullTimeline();
    }
    this.updateLoadMoreConf();
    this.updateDimensions();
    this.render();
  }

  public setData(newData: GanttData, newConfig?: GanttConfig): void {
    this.data = newData;
    this.buildTaskMap();
    if (newConfig) {
      this.updateConfig(newConfig);
    } else {
      this.calculateFullTimeline();
      this.updateDimensions();
      this.render();
    }
  }

  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.container.removeEventListener('scroll', this.handleScroll);
    this.mainCanvas.removeEventListener('mousemove', this.handleMouseMove);
    this.mainCanvas.removeEventListener('mouseleave', this.handleMouseLeave);

    this.data = [];
    this.taskMap.clear();
    this.taskPositions.clear();
    this.container.remove();
    // window.removeEventListener('resize', this.handleResize);
  }

  private calculateFullTimeline(): void {
    const currentYear = this.today.getFullYear()

    let minDate = new Date(9999, 0, 1);
    let maxDate = new Date(1000, 0, 1);
    if (this.data.length === 0) {
      minDate = new Date();
      maxDate = DateUtils.addDays(new Date(), 60);
    } else {
      this.taskMap.forEach(({ task }) => {
        const pStart = new Date(task.planStart!);
        const pEnd = new Date(task.planEnd!);
        if (pStart < minDate) minDate = pStart;
        if (pEnd > maxDate) maxDate = pEnd;
        if (task.actualStart) {
          const aStart = new Date(task.actualStart);
          const aEnd = new Date(task.actualEnd!);
          if (aStart < minDate) minDate = aStart;
          if (aEnd > maxDate) maxDate = aEnd;
        }
      });
    }
    this.minDate = minDate;
    this.maxDate = maxDate;
    const minYear = minDate.getFullYear();
    const maxYear = maxDate.getFullYear();
    // Add buffer
    minDate = DateUtils.addDays(minYear === 9999 ? new Date(currentYear, 0, 1) : minDate, -7);
    maxDate = DateUtils.addDays(maxYear === 1000 ? new Date(currentYear + 1, 0, 1) : maxDate, 14);

    switch (this.config.viewMode) {
      case 'Year':
        this.timelineStart = DateUtils.getStartOfYear(minDate);
        this.timelineEnd = DateUtils.addDays(DateUtils.addYears(DateUtils.getStartOfYear(maxDate), 1), -1);
        break;
      case 'Month':
        this.timelineStart = DateUtils.getStartOfMonth(minDate);
        this.timelineEnd = DateUtils.addDays(DateUtils.addMonths(DateUtils.getStartOfMonth(maxDate), 1), -1);
        break;
      case 'Week':
        this.timelineStart = DateUtils.getStartOfWeek(minDate);
        this.timelineEnd = DateUtils.addDays(DateUtils.getStartOfWeek(maxDate), 7);
        break;
      case 'Day':
      default:
        this.timelineStart = DateUtils.addDays(minDate, -3);
        this.timelineEnd = DateUtils.addDays(maxDate, 3);
        break;
    }
  }

  private updatePixelsPerDay(): void {
    // const viewFactors = { Day: 80, Week: 20, Month: 15, Year: 6 };
    this.pixelsPerDay = this.config.viewFactors[this.config.viewMode];
  }

  private dateToX(date: Date): number {
    return DateUtils.diffDays(this.timelineStart, date) * this.pixelsPerDay;
  }

  private xToDate(x: number): Date {
    return DateUtils.addDays(this.timelineStart, x / this.pixelsPerDay);
  }

  private handleResize(): void {
    this.viewportWidth = this.container.clientWidth;
    this.viewportHeight = this.container.clientHeight;

    this.mainCanvas.style.top = `${this.config.headerHeight}px`;

    this.headerCtx = this.setupCanvas(this.headerCanvas, this.viewportWidth, this.config.headerHeight);
    this.mainCtx = this.setupCanvas(this.mainCanvas, this.viewportWidth, this.viewportHeight - this.config.headerHeight);

    this.updateDimensions();
    this.render();
  }

  // Add this method to register the data loading callback
  public setOnDataLoadCallback(callback: (direction: 'left' | 'right' | 'bottom', params?: any) => Promise<GanttData>): void {
    this.onDataLoad = callback;
  }


  private handleScroll(e: Event): void {
    if (this.showTooltip) {
      this.handleMouseLeave();
    }
    const target = e.target as HTMLElement;
    this.scrollLeft = target.scrollLeft;
    this.scrollTop = target.scrollTop;

    const event = new CustomEvent('ganttscroll', {
      detail: { scrollTop: this.scrollTop, scrollLeft: this.scrollLeft }
    });
    this.container.dispatchEvent(event);

    if (this.config.enabledLoadMore.length > 0) {

      // Clear any existing scroll load timer
      if (this.scrollLoadTimer !== null) {
        clearTimeout(this.scrollLoadTimer);
        this.scrollLoadTimer = null;
      }

      // Schedule scroll load check with proper typing
      this.scrollLoadTimer = window.setTimeout(() => {
        this.checkScrollLoad();
        this.scrollLoadTimer = null;
      }, 100);
    }

    requestAnimationFrame(() => {
      this.scrolling = true;
      this.render(true)
      this.scrolling = false;
    });
  }
  //  checkScrollLoad method
  private async checkScrollLoad(): Promise<void> {
    if (this.isLoadingData || !this.onDataLoad) {
      return;
    }

    const scrollLeft = this.scrollLeft;
    const scrollTop = this.scrollTop;
    const viewportWidth = this.viewportWidth;
    const viewportHeight = this.viewportHeight;
    const totalWidth = this.totalWidth;
    const totalHeight = this.totalHeight;

    // Check if we're actually at the edges with proper thresholds
    const atLeftEdge = scrollLeft <= 5;
    const atRightEdge = scrollLeft + viewportWidth >= totalWidth - 5;
    const atBottomEdge = scrollTop + viewportHeight >= totalHeight - 5;

    // Only trigger one direction at a time based on priority and current position
    try {
      if (this.hasMoreDataLeft && atLeftEdge && scrollLeft < this.lastScrollLeft) {
        // Moving left and at left edge
        await this.loadMoreData('left');
        // console.log('left-loadMoreData::', this.data)
      } else if (this.hasMoreDataRight && atRightEdge && scrollLeft > this.lastScrollLeft) {
        // Moving right and at right edge
        await this.loadMoreData('right');
        // console.log('right-loadMoreData::', this.data)
      } else if (this.hasMoreDataBottom && atBottomEdge && scrollTop > this.lastScrollTop) {
        // Moving down and at bottom edge
        await this.loadMoreData('bottom');
        // console.log('bottom-loadMoreData::', this.data)
      }
    } finally {
      // Always update last scroll positions
      this.lastScrollLeft = scrollLeft;
      this.lastScrollTop = scrollTop;
    }
  }
  // Add this method to reset scroll loading state
  public resetScrollLoadingState(): void {

    this.updateLoadMoreConf();
    this.lastScrollLeft = 0;
    this.lastScrollTop = 0;

    // Clear any pending scroll load timers
    if (this.scrollLoadTimer !== null) {
      clearTimeout(this.scrollLoadTimer);
      this.scrollLoadTimer = null;
    }
  }

  // Add this new method to load additional data
  private async loadMoreData(direction: 'left' | 'right' | 'bottom'): Promise<void> {
    if (this.isLoadingData || !this.onDataLoad) {
      return;
    }

    this.isLoadingData = true;

    try {
      let newData: GanttData | null = null;

      switch (direction) {
        case 'left':
          newData = await this.onDataLoad('left', { date: this.minDate });
          if (newData && newData.length > 0) {
            this.prependData(newData);
          } else {
            this.hasMoreDataLeft = false;
          }
          break;

        case 'right':
          newData = await this.onDataLoad('right', { date: this.maxDate });
          if (newData && newData.length > 0) {
            this.appendData(newData);
          } else {
            this.hasMoreDataRight = false;
          }
          break;

        case 'bottom':
          const currentRowCount = this.data.length;
          newData = await this.onDataLoad('bottom', { offset: currentRowCount });
          if (newData && newData.length > 0) {
            this.appendRows(newData);
          } else {
            this.hasMoreDataBottom = false;
          }
          break;
      }

      if (newData && newData.length > 0) {
        // Recalculate timeline and update dimensions
        this.buildTaskMap();
        this.calculateFullTimeline();
        this.updateDimensions();
        this.render();
      }
    } catch (error) {
      console.error('Error loading additional data:', error);
    } finally {
      this.isLoadingData = false;
    }
  }

  // Add this method to append data to the right
  private appendData(newData: GanttData): void {
    // Merge new data with existing data
    newData.forEach((newRow, index) => {
      if (index < this.data.length) {
        // Append tasks to existing rows
        this.data[index].tasks = [...this.data[index].tasks, ...newRow.tasks];
      } else {
        // Add new rows if needed
        this.data.push(newRow);
      }
    });
  }

  // Add this method to prepend data to the left
  private prependData(newData: GanttData): void {
    // Update timeline start to account for prepended data
    // This requires adjusting all existing task dates

    // For simplicity in this example, we'll just append the data
    // A full implementation would need to properly adjust dates and positions
    newData.forEach((newRow, index) => {
      if (index < this.data.length) {
        // Prepend tasks to existing rows
        this.data[index].tasks = [...newRow.tasks, ...this.data[index].tasks];
      } else {
        // Add new rows if needed
        this.data.push(newRow);
      }
    });
  }

  // Add this method to append rows to the bottom
  private appendRows(newData: GanttData): void {
    // Simply add new rows at the bottom
    this.data.push(...newData);
  }

  public setScrollTop(scrollTop: number): void {
    if (this.scrollTop !== scrollTop) this.container.scrollTop = scrollTop;
  }

  private updateVirtualRanges(): void {
    const buffer = 200;
    this.visibleDateRange = {
      start: this.xToDate(this.scrollLeft - buffer),
      end: this.xToDate(this.scrollLeft + this.viewportWidth + buffer)
    };
  }

  private updateDimensions(): void {
    const totalDays = DateUtils.diffDays(this.timelineStart, this.timelineEnd) + 1;
    const newTotalWidth = totalDays * this.pixelsPerDay;
    const newTotalHeight = this.data.length * this.config.rowHeight + this.config.headerHeight;

    // Only update if changed
    if (this.totalWidth !== newTotalWidth || this.totalHeight !== newTotalHeight) {
      this.totalWidth = newTotalWidth;
      this.totalHeight = newTotalHeight;
      this.scrollDummy.style.width = `${this.totalWidth}px`;
      this.scrollDummy.style.height = `${this.totalHeight}px`;
    }
  }

  private setupCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
    canvas.width = width * this.devicePixelRatio;
    canvas.height = height * this.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    return ctx
  }

  private calculateAllTaskPositions(): void {
    this.taskPositions.clear();
    for (let i = 0; i < this.data.length; i++) {
      const row = this.data[i];
      const y = i * this.config.rowHeight;
      row.tasks.forEach(task => {

        const x_plan_start = this.dateToX(new Date(task.planStart!));
        const x_plan_end = this.dateToX(DateUtils.addDays(task.planEnd!, 1));

        let x_actual_start: number | null = null,
          x_actual_end: number | null = null;
        let offset_x_plan_start: number = NaN,
          offset_x_plan_end: number = NaN;
        let offset_x_actual_start: number | null = null,
          offset_x_actual_end: number | null = null;
        let x_plan_width = 0;
        let x_actual_width = 0

        const [offsetX_actual, percent_actual] = this.config.viewMode === 'Day' && task.actualOffsetPercent ? task.actualOffsetPercent : [0, 1];
        const [offsetX, percent_plan] = this.config.viewMode === 'Day' && task.planOffsetPercent ? task.planOffsetPercent : [0, 1];

        if (x_plan_start && x_plan_end) {
          x_plan_width = x_plan_end - x_plan_start;
          offset_x_plan_start = x_plan_start + x_plan_width * offsetX;
          x_plan_end && (offset_x_plan_end = offset_x_plan_start + x_plan_width * percent_plan);
        }
        if (task.actualStart) {
          x_actual_start = this.dateToX(new Date(task.actualStart));
        }
        if (task.actualEnd) {
          x_actual_end = this.dateToX(DateUtils.addDays(task.actualEnd, 1));
        }
        if (x_actual_start) {
          x_actual_width = (x_actual_end ? x_actual_end : this.dateToX(this.today))! - x_actual_start;
          offset_x_actual_start = Math.round(x_actual_start + x_actual_width * offsetX_actual);
          x_actual_end && (offset_x_actual_end = offset_x_actual_start + x_actual_width * percent_actual);
        }
        this.taskPositions.set(task.id, {
          x_plan_start,
          x_plan_end,
          x_actual_start,
          x_actual_end,
          offset_x_plan_start,
          offset_x_plan_end,
          offset_x_actual_start,
          offset_x_actual_end,
          x_plan_width,
          x_actual_width,
          y: y + this.config.rowHeight * 0.5,
          row: i
        });
      });
    }
  }

  private getIterationStartDate(date: Date): Date {
    switch (this.config.viewMode) {
      case 'Year':
        return DateUtils.getStartOfYear(date);
      case 'Month':
        return DateUtils.getStartOfMonth(date);
      case 'Week':
        return DateUtils.getStartOfWeek(date);
      case 'Day':
      default:
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
  }

  public render(scrolling = false): void {
    // const timeStart = performance.now();
    // console.log('renderFn', scrolling);
    // console.trace()
    this.updateVirtualRanges();
    if (!scrolling) {
      this.calculateAllTaskPositions();
    }
    this.renderHeader();
    this.renderMain();
    // const timeEnd = performance.now();
    // console.log(`renderFn time: ${timeEnd - timeStart}ms`);
  }

  private renderHeader(): void {
    const ctx = this.headerCtx;
    const h = this.config.headerHeight;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.translate(-this.scrollLeft, 0);

    ctx.fillStyle = this.config.headerBgColor;
    ctx.fillRect(this.scrollLeft, 0, this.viewportWidth, h);

    ctx.textBaseline = 'middle';
    ctx.textRendering = 'optimizeLegibility';

    let currentDate = new Date(this.visibleDateRange.start);
    currentDate = this.getIterationStartDate(currentDate);

    // Keep track of currently visible year/month blocks
    const visibleBlocks: Array<{ startX: number, endX: number, text: string, yPos: number }> = [];

    // Pre-calculate all visible date blocks with their year/month labels
    let calcDate = new Date(currentDate);

    while (calcDate <= this.visibleDateRange.end) {
      let nextDate: Date;
      let upperText = '';

      switch (this.config.viewMode) {
        case 'Day':
          upperText = DateUtils.format(calcDate, 'yyyy年MM月');
          nextDate = DateUtils.addDays(calcDate, 1);
          break;
        case 'Week':
          const weekStart = DateUtils.getStartOfWeek(calcDate);
          upperText = DateUtils.format(weekStart, 'yyyy年MM月');
          nextDate = DateUtils.addDays(weekStart, 7);
          break;
        case 'Month':
          upperText = `${calcDate.getFullYear()}年`;
          nextDate = DateUtils.addMonths(calcDate, 1);
          break;
        case 'Year':
          if (calcDate.getMonth() === 0 && calcDate.getDate() === 1) {
            upperText = `${calcDate.getFullYear()}年`;
            nextDate = DateUtils.addMonths(calcDate, 6);
          } else if (calcDate.getMonth() === 6 && calcDate.getDate() === 1) {
            upperText = `${calcDate.getFullYear()}年`;
            nextDate = DateUtils.addMonths(calcDate, 6);
          } else {
            calcDate = DateUtils.addDays(calcDate, 1);
            continue;
          }
          break;
        default:
          nextDate = DateUtils.addDays(calcDate, 1);
          break;
      }

      const startX = this.dateToX(calcDate);
      const endX = this.dateToX(nextDate);

      // Add block info for later rendering
      visibleBlocks.push({
        startX,
        endX,
        text: upperText,
        yPos: h * 0.35
      });

      calcDate = nextDate;
    }

    // Render the lower text (day/week/month indicators) as before
    let currentDateForLower = new Date(currentDate);

    while (this.dateToX(currentDateForLower) < this.scrollLeft - this.pixelsPerDay * 7) {
      let nextDate: Date;
      switch (this.config.viewMode) {
        case 'Day':
          nextDate = DateUtils.addDays(currentDateForLower, 1);
          break;
        case 'Week':
          nextDate = DateUtils.addDays(currentDateForLower, 7);
          break;
        case 'Month':
          nextDate = DateUtils.addMonths(currentDateForLower, 1);
          break;
        case 'Year':
          nextDate = DateUtils.addMonths(currentDateForLower, 6);
          break;
        default:
          nextDate = DateUtils.addDays(currentDateForLower, 1);
          break;
      }
      if (nextDate.getTime() === currentDateForLower.getTime()) {
        currentDateForLower = DateUtils.addDays(currentDateForLower, 1);
      } else {
        currentDateForLower = nextDate;
      }
    }

    // Group consecutive blocks with same upperText
    const groupedBlocks = this.groupConsecutiveBlocks(visibleBlocks);

    // Render year/month headers that span across multiple units
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    ctx.textAlign = 'left';

    groupedBlocks.forEach(group => {
      // Only render if the block is visible
      const visibleStart = Math.max(group.startX, this.scrollLeft);
      const visibleEnd = Math.min(group.endX, this.scrollLeft + this.viewportWidth);

      if (visibleEnd > visibleStart) {
        // Draw background for the header area
        ctx.fillStyle = this.config.headerBgColor;
        ctx.fillRect(visibleStart, 0, visibleEnd - visibleStart, h * 0.5);

        // Draw the year/month text
        ctx.fillStyle = '#333';
        ctx.fillText(group.text, visibleStart + 5, group.yPos);
      }
    });

    // Render lower text and grid lines
    while (currentDateForLower <= this.visibleDateRange.end) {
      const x = this.dateToX(currentDateForLower);
      let lowerText = '';
      let nextDate: Date;

      switch (this.config.viewMode) {
        case 'Day':
          lowerText = `${DateUtils.format(currentDateForLower, 'd')} ${DateUtils.format(currentDateForLower, 'W')}`;
          nextDate = DateUtils.addDays(currentDateForLower, 1);
          break;
        case 'Week':
          const weekStart = DateUtils.getStartOfWeek(currentDateForLower);
          lowerText = `第${DateUtils.getWeekNumber(weekStart)}周`;
          nextDate = DateUtils.addDays(weekStart, 7);
          break;
        case 'Month':
          lowerText = `${currentDateForLower.getMonth() + 1}月`;
          nextDate = DateUtils.addMonths(currentDateForLower, 1);
          break;
        case 'Year':
          if (currentDateForLower.getMonth() === 0 && currentDateForLower.getDate() === 1) {
            lowerText = `上半年`;
            nextDate = DateUtils.addMonths(currentDateForLower, 6);
          } else if (currentDateForLower.getMonth() === 6 && currentDateForLower.getDate() === 1) {
            lowerText = `下半年`;
            nextDate = DateUtils.addMonths(currentDateForLower, 6);
          } else {
            currentDateForLower = DateUtils.addDays(currentDateForLower, 1);
            continue;
          }
          break;
        default:
          nextDate = DateUtils.addDays(currentDateForLower, 1);
          break;
      }

      const unitWidth = this.dateToX(nextDate) - x;

      // Render lower text
      ctx.fillStyle = '#000412';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lowerText, Math.round(x + unitWidth / 2), Math.round(h * 0.7));

      // Render grid lines
      ctx.beginPath();
      ctx.moveTo(x, h * 0.5);
      ctx.lineTo(x, h);
      ctx.strokeStyle = '#e0e0e0';
      ctx.stroke();

      if (nextDate.getTime() === currentDateForLower.getTime()) {
        currentDateForLower = DateUtils.addDays(currentDateForLower, 1);
      } else {
        currentDateForLower = nextDate;
      }
    }

    // Draw bottom border
    ctx.beginPath();
    ctx.moveTo(this.scrollLeft, h - 0.5);
    ctx.lineTo(this.scrollLeft + this.viewportWidth, h - 0.5);
    ctx.strokeStyle = '#e0e0e0';
    ctx.stroke();

    ctx.restore();
  }

  // Helper method to group consecutive blocks with same text
  private groupConsecutiveBlocks(blocks: Array<{ startX: number, endX: number, text: string, yPos: number }>):
    Array<{ startX: number, endX: number, text: string, yPos: number }> {

    if (blocks.length === 0) return [];

    const grouped: Array<{ startX: number, endX: number, text: string, yPos: number }> = [];
    let currentGroup = { ...blocks[0] };

    for (let i = 1; i < blocks.length; i++) {
      if (blocks[i].text === currentGroup.text &&
        Math.abs(blocks[i].startX - currentGroup.endX) < 1) { // Consecutive blocks
        currentGroup.endX = blocks[i].endX;
      } else {
        grouped.push(currentGroup);
        currentGroup = { ...blocks[i] };
      }
    }

    grouped.push(currentGroup);
    return grouped;
  }


  private renderMain(): void {
    const ctx = this.mainCtx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();

    ctx.translate(-this.scrollLeft, -this.scrollTop);

    const { start: startDate, end: endDate } = this.visibleDateRange;

    this.drawGrid(ctx, startDate, endDate);
    this.drawToday(ctx);
    this.drawAllDependencies(ctx);
    this.drawAllTasks(ctx);

    ctx.restore();
  }

  // Helper: Draw arrow
  private drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, direction: string): void {
    const size = 6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (direction === 'right') {
      ctx.lineTo(x - size, y - size * 0.6);
      ctx.lineTo(x - size, y + size * 0.6);
    } else if (direction === 'down') {
      ctx.lineTo(x - size * 0.6, y - size);
      ctx.lineTo(x + size * 0.6, y - size);
    } else if (direction === 'up') {
      ctx.lineTo(x - size * 0.6, y + size);
      ctx.lineTo(x + size * 0.6, y + size);
    }
    ctx.fillStyle = ctx.strokeStyle; // Use stroke color for fill
    ctx.fill();
  }

  private drawAllDependencies(ctx: CanvasRenderingContext2D): void {
    const lineColor = '#64748b';
    const lineWidth = 1;

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.taskMap.forEach(({ task }) => {
      if (!task.dependencies || task.dependencies.length === 0) return;
      const toPos = this.taskPositions.get(task.id);
      if (!toPos) return;

      const toRowIndex = this.taskMap.get(task.id)!.row;

      task.dependencies.forEach(depId => {
        const fromPos = this.taskPositions.get(depId);
        if (!fromPos) return;

        const fromRowIndex = this.taskMap.get(depId)!.row;
        const isAdjacent = Math.abs(toRowIndex - fromRowIndex) === 1;

        const fromX = Math.max(fromPos.offset_x_plan_end, fromPos.offset_x_actual_end || fromPos.offset_x_plan_end);
        const fromY = fromPos.y;
        const toX = Math.min(toPos.offset_x_plan_start, toPos.offset_x_actual_start || toPos.offset_x_plan_start);
        const toY = toPos.y;

        ctx.beginPath();

        // Strategy A: Adjacent rows (vertical connection)
        if (isAdjacent) {
          // Determine direction: down or up
          const isDown = toRowIndex > fromRowIndex;
          const rowH = this.config.rowHeight;

          // Source point: from task bottom (or top)
          // Assuming task bar height ratio 0.7, center is y. Bottom is y + rowH*0.35
          const fromY_Edge = fromY + (isDown ? rowH * 0.3 : -rowH * 0.3);
          const toY_Edge = toY + (isDown ? -rowH * 0.3 : rowH * 0.3);

          // Middle separator line position
          const midY = (fromY + toY) / 2;

          ctx.moveTo(fromX, fromY_Edge);
          ctx.lineTo(fromX, midY);
          ctx.lineTo(toX, midY);
          ctx.lineTo(toX, toY_Edge);

          ctx.stroke();
          this.drawArrow(ctx, toX, toY_Edge, isDown ? 'down' : 'up');
        }
        // Strategy B: Distant rows or same row (standard right-in-left-out, or optimized anti-intersection)
        else {
          // Standard Manhattan: Right -> Vertical -> Left -> Vertical -> Right (anti-intersection)
          // Or: Right -> Vertical -> Right (if not overlapping)

          const gap = 15;
          const exitX = fromX + gap;

          ctx.moveTo(fromX, fromY);

          if (toX > exitX + gap) {
            // Target is far right: go directly
            // Right -> Vertical -> Right
            ctx.lineTo(exitX, fromY);
            ctx.lineTo(exitX, toY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            this.drawArrow(ctx, toX, toY, 'right');
          } else {
            // Target is on the left or too close: need to detour
            // Avoid intersecting tasks: use target row's upper (or lower) gap
            const isDown = toRowIndex > fromRowIndex;
            const rowH = this.config.rowHeight;

            // Find target row's "previous" gap
            const targetGapY = toY - (isDown ? rowH / 2 : -rowH / 2);
            const entryX = toX - gap;

            ctx.lineTo(exitX, fromY); // Right
            ctx.lineTo(exitX, targetGapY); // Vertical to target gap
            ctx.lineTo(entryX, targetGapY); // Left back to target front
            ctx.lineTo(entryX, toY); // Vertical to target center Y
            ctx.lineTo(toX, toY); // Right in

            ctx.stroke();
            this.drawArrow(ctx, toX, toY, 'right');
          }
        }
      });
    });
  }

  private drawAllTasks(ctx: CanvasRenderingContext2D): void {
    ctx.textBaseline = 'middle';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    ctx.textRendering = 'optimizeSpeed';
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < this.data.length; i++) {
      const row = this.data[i];
      const y = i * this.config.rowHeight;

      if (y + this.config.rowHeight < this.scrollTop || y > this.scrollTop + this.viewportHeight) continue;

      row.tasks.forEach(task => {
        const pos = this.taskPositions.get(task.id);
        if (!pos) return;

        if (pos.x_plan_end < this.scrollLeft || pos.x_plan_start > this.scrollLeft + this.viewportWidth) {
          if (
            !pos.x_actual_start ||
            pos.x_actual_end! < this.scrollLeft ||
            pos.x_actual_start > this.scrollLeft + this.viewportWidth
          )
            return;
        }
        this.drawTask(ctx, task, y, pos);
      });
    }
  }

  private drawGrid(ctx: CanvasRenderingContext2D, startDate: Date, endDate: Date): void {
    ctx.strokeStyle = '#e6e6e6';
    ctx.lineWidth = 1;
    ctx.beginPath();

    if (this.config.showRowLines) {
      for (let i = 0; i <= this.data.length; i++) {
        const y = i * this.config.rowHeight;
        if (y < this.scrollTop || y > this.scrollTop + this.viewportHeight) continue;
        ctx.moveTo(this.scrollLeft, y);
        ctx.lineTo(this.scrollLeft + this.viewportWidth, y);
      }
    }

    if (this.config.showColLines) {
      let currentDate = startDate;
      switch (this.config.viewMode) {
        case 'Day':
          currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          break;
        case 'Week':
          currentDate = DateUtils.getStartOfWeek(startDate);
          break;
        case 'Month':
          currentDate = DateUtils.getStartOfMonth(startDate);
          break;
        case 'Year':
          currentDate = DateUtils.getStartOfYear(startDate);
          break;
      }

      let nextDate: Date;
      while (this.dateToX(currentDate) < this.scrollLeft - this.pixelsPerDay * 7) {
        switch (this.config.viewMode) {
          case 'Day':
            nextDate = DateUtils.addDays(currentDate, 1);
            break;
          case 'Week':
            nextDate = DateUtils.addDays(currentDate, 7);
            break;
          case 'Month':
            nextDate = DateUtils.addMonths(currentDate, 1);
            break;
          case 'Year':
            nextDate = currentDate.getMonth() === 0 && currentDate.getDate() === 1
              ? DateUtils.addMonths(currentDate, 6)
              : DateUtils.addMonths(currentDate, 6);
            break;
          default:
            nextDate = DateUtils.addDays(currentDate, 1);
            break;
        }
        currentDate = nextDate;
      }

      while (currentDate <= endDate) {
        const x = this.dateToX(currentDate);
        ctx.moveTo(x, this.scrollTop);
        ctx.lineTo(x, this.scrollTop + this.viewportHeight);

        switch (this.config.viewMode) {
          case 'Day':
            nextDate = DateUtils.addDays(currentDate, 1);
            break;
          case 'Week':
            nextDate = DateUtils.addDays(currentDate, 7);
            break;
          case 'Month':
            nextDate = DateUtils.addMonths(currentDate, 1);
            break;
          case 'Year':
            if (currentDate.getMonth() === 0 && currentDate.getDate() === 1)
              nextDate = DateUtils.addMonths(currentDate, 6);
            else if (currentDate.getMonth() === 6 && currentDate.getDate() === 1)
              nextDate = DateUtils.addMonths(currentDate, 6);
            else nextDate = DateUtils.addDays(currentDate, 1);
            break;
          default:
            nextDate = DateUtils.addDays(currentDate, 1);
            break;
        }
        if (nextDate.getTime() === currentDate.getTime()) currentDate = DateUtils.addDays(currentDate, 1);
        else currentDate = nextDate;
      }
    }
    ctx.stroke();
  }

  private drawToday(ctx: CanvasRenderingContext2D): void {
    const x = this.dateToX(this.today);
    if (x >= this.scrollLeft && x <= this.scrollLeft + this.viewportWidth) {
      ctx.strokeStyle = this.config.todayColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, this.scrollTop);
      ctx.lineTo(x, this.scrollTop + this.viewportHeight);
      ctx.stroke();
    }
  }

  private drawTask(ctx: CanvasRenderingContext2D, task: Task, y: number, pos: TaskPosition): void {
    const offset = 4;
    const taskY = y + this.config.rowHeight * 0.15 + offset;
    const taskHeight = this.config.rowHeight * 0.7 - offset;
    // const styles = this.getTaskStyles(task);
    const textY = y + this.config.rowHeight / 2 + offset;

    // @ts-ignore
    const [offsetX_actual, percent_actual] = this.config.viewMode === 'Day' && task.actualOffsetPercent ? task.actualOffsetPercent : [0, 1];
    // const x_today = this.dateToX(this.today);
    if (this.config.showActual && pos.x_actual_start) {
      ctx.fillStyle = task.actualBgColor ? task.actualBgColor : this.config.actualBgColor;
      ctx.fillRect(pos.offset_x_actual_start!, Math.round(taskY + 2), Math.round(pos.x_actual_width * percent_actual), Math.round(taskHeight - 2));
    }

    if (this.config.showPlan && pos.x_plan_start && pos.x_plan_end) {
      ctx.strokeStyle = task.planBorderColor ? task.planBorderColor : this.config.planBorderColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pos.offset_x_plan_start + offset / 2, taskY);
      ctx.lineTo(pos.offset_x_plan_end - offset / 2, taskY);
      ctx.stroke();
    }

    ctx.fillStyle = '#000';
    if (this.config.showLeftRemark && task.leftRemark) {
      ctx.textAlign = 'right';
      ctx.fillText(task.leftRemark, Math.round(Math.min(...[pos.offset_x_plan_start, pos.offset_x_actual_start].filter(val => val !== null && val !== undefined)) - 8), Math.round(textY));
    }
    if (this.config.showRightRemark && task.rightRemark) {
      ctx.textAlign = 'left';
      ctx.fillText(task.rightRemark, Math.round(Math.max(...[pos.offset_x_plan_end, pos.offset_x_actual_end].filter(val => val !== null && val !== undefined)) + 8), Math.round(textY));
    }
    if (this.config.showCenterRemark && task.centerRemark) {
      const centerX = pos.offset_x_actual_start! + (pos.offset_x_actual_end! - pos.offset_x_actual_start!) / 2;

      ctx.textAlign = 'center';
      ctx.fillText(task.centerRemark, Math.round(centerX!), Math.round(textY), Math.round(pos.offset_x_actual_end! - pos.offset_x_actual_start!));
    }

  }

  private getTaskStyles(task: Task): { planBorder: string; actualBg: string } {
    let styles = { planBorder: '#2563eb', actualBg: '#3b82f6' };
    if (task.styleClass === 'demo1-task') {
      styles.planBorder = '#fb923c';
      styles.actualBg = '#fdba74';
    }
    if (task.styleClass === 'demo2-plan') {
      styles.planBorder = '#22c55e';
    }
    if (task.styleClass === 'demo2-completed') {
      styles.actualBg = '#86efac';
    }
    if (task.styleClass === 'demo2-leave') {
      styles.actualBg = '#f43f5e';
    }
    return styles;
  }

  private handleMouseMove(e: MouseEvent): void {

    if (this.scrolling) {
      return
    }
    const rect = this.mainCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const chartX = mouseX + this.scrollLeft;
    const chartY = mouseY + this.scrollTop;
    const rowIndex = Math.floor(chartY / this.config.rowHeight);
    const date = this.xToDate(chartX);

    if (rowIndex < 0 || rowIndex >= this.data.length) return this.handleMouseLeave();
    const row = this.data[rowIndex];

    if (this.config.tooltipFormat) {
      const htmlStr = this.config.tooltipFormat(row, date, this.config);
      if (!htmlStr) {
        this.handleMouseLeave();
        return
      }
      this.tooltip.innerHTML = htmlStr;
    } else {
      const overlappingTasks = row.tasks.filter(task => {
        const pStart = new Date(task.planStart!).setHours(0, 0, 0, 0),
          pEnd = DateUtils.addDays(task.planEnd!, 1);
        if ((date as any) >= pStart && date < pEnd) return true;
        if (task.actualStart) {
          const aStart = new Date(task.actualStart).setHours(0, 0, 0, 0),
            aEnd = DateUtils.addDays(task.actualEnd!, 1);
          if (date as any >= aStart && date < aEnd) return true;
        }
        return false;
      });

      if (overlappingTasks.length === 0) return this.handleMouseLeave();

      let html = `<strong>${row.name}</strong> (${DateUtils.format(
        date,
        'yyyy-MM-dd'
      )})<hr class="__gantt_tooltip-divider">`;
      overlappingTasks.forEach(task => (html += this.getTaskTooltipHtml(task)));
      this.tooltip.innerHTML = html;
    }

    this.tooltip.style.display = 'block';
    this.showTooltip = true;
    if (this.config.tooltipColor === 'white') {
      this.tooltip.style.background = '#fff';
      this.tooltip.style.color = '#000'
    }
    const tipRect = this.tooltip.getBoundingClientRect();
    let x = e.clientX + 15,
      y = e.clientY + 15;
    if (x + tipRect.width > window.innerWidth) x = e.clientX - 15 - tipRect.width;
    if (y + tipRect.height > window.innerHeight) y = e.clientY - 15 - tipRect.height;
    this.tooltip.style.left = `${x + this.config.offsetLeft}px`;
    this.tooltip.style.top = `${y + this.config.offsetTop}px`;
  }

  private getTaskTooltipHtml(task: Task): string {
    if (task.type === 'leave') {
      const days = DateUtils.diffDaysInclusive(new Date(task.actualStart!), new Date(task.actualEnd!));
      return `<div><span style="color: ${firstValidValue(task.actualBgColor, this.config.actualBgColor, '#f43f5e')};">■</span> <strong>${task.name} (${days}天)</strong><br><span class="__gantt_tooltip-indent">${task.actualStart} 到 ${task.actualEnd}</span></div>`;
    }
    let html = `<div><span style="color: ${firstValidValue(task.actualBgColor, this.config.actualBgColor, this.config.planBorderColor, this.getTaskStyles(task).planBorder)};">■</span> <strong>${task.name
      }</strong><br>`;
    if (this.config.showPlan) {
      const days = DateUtils.diffDaysInclusive(new Date(task.planStart!), new Date(task.planEnd!));
      html += `<span class="__gantt_tooltip-indent">计划: ${task.planStart} - ${task.planEnd} (${days}天)</span><br>`;
    }
    if (this.config.showActual && task.actualStart) {
      const days = DateUtils.diffDaysInclusive(new Date(task.actualStart), new Date(task.actualEnd!));
      html += `<span class="__gantt_tooltip-indent">实际: ${task.actualStart} - ${task.actualEnd} (${days}天)</span><br>`;
    }
    return html + '</div>';
  }

  private handleMouseLeave(): void {
    this.tooltip.style.display = 'none';
    this.showTooltip = false;
  }
  /**
   * 计算任务宽度占的百分比（方便绘制精确到具体时间的每日任务）
   * @param diffMilliseconds 距离目标日期时间的差异毫秒数
   * @param pixelsPerDay 每日的像素数
   * @returns
   */
  static getTaskWidthPercent(diffMilliseconds: number, pixelsPerDay: number): number {
    return diffMilliseconds * pixelsPerDay / DateUtils.ONE_DAY_MS;
  }

  /**
   * horizontal scroll to specified date position, default to minDate
   *
   * @param date
   */
  horizontalScrollTo(date?: Date): void {
    const startDate = date ? date : this.minDate;
    if (startDate) {
      const xPosition = this.dateToX(startDate);
      this.container.scrollTo({ left: xPosition - 80, });
    }
  }

  /**
   * vertical scroll to specified position
   *
   * @param  params
   */
  verticalScrollTo(params: { rowId: string, rowIndex: number }): void {
    if (params && (params.rowId || params.rowIndex)) {

      const rowIndex = params.rowIndex ? params.rowIndex : this.data.findIndex(row => row.id === params.rowId);
      const yPosition = this.config.rowHeight * rowIndex;
      this.container.scrollTo({ top: yPosition - 80, });
    }
  }

}