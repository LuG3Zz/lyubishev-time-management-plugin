// main.ts
import { Plugin, Modal, App, MarkdownView, Notice } from 'obsidian';
import { createApp } from 'vue';
import TimeTable from './components/TimeTable.vue';
import TimeStatistics from './components/TimeStatistics.vue';
import { LyubishevSettingTab } from './settings';
import { PluginSettings, CellColors } from './types';
import { Utils } from './utils';

export default class LyubishevPlugin extends Plugin {
  settings: PluginSettings = {
    colorPresets: [],
    activityCategories: [],
  };
  cellColors: CellColors = {};
  selectedRange: 'week' | 'month' = 'week';
  currentYear: number = new Date().getFullYear();

  async onload() {
    console.log("Lyubishev Time Management Plugin Loaded");
    await this.loadSettings();
    this.addSettingTab(new LyubishevSettingTab(this.app, this));
    this.loadCellColors();

    this.addCommand({
      id: 'show-time-table',
      name: 'Show Lyubishev Time Table',
      callback: () => this.createModal(),
    });

    this.addCommand({
      id: 'show-time-statistics',
      name: 'Show Time Statistics',
      callback: () => this.createStatisticsModal(),
    });

    this.addCommand({
      id: 'generate-gantt-chart',
      name: 'Generate Gantt Chart',
      callback: () => this.createGanttChartModal(),
    });
    // 在主界面添加按钮
    this.addRibbonIcon('bar-chart', 'Show Statistics', () => {
      this.createStatisticsModal();
    });
  }

  async loadSettings() {
    const loadedSettings = await this.loadData();
    if (loadedSettings) {
      this.settings = Object.assign({ colorPresets: [], activityCategories: [] }, loadedSettings);
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async saveCellColors(cellColors: CellColors): Promise<void> {
    await this.saveData(cellColors);
  }

  async loadCellColors(): Promise<void> {
    const savedData = await this.loadData();
    if (savedData) {
      this.cellColors = savedData;
    } else {
      this.cellColors = Utils.generateDefaultData();
    }
  }

  createModal() {
    const modal = new Modal(this.app);
    const container = modal.contentEl.createDiv();
    const app = createApp(TimeTable, {
      cellColors: this.cellColors,
      saveCellColors: this.saveCellColors.bind(this),
      currentYear: this.currentYear,
      changeYear: (delta: number) => {
        this.currentYear += delta;
        this.cellColors = Utils.generateDefaultData(this.selectedRange);
        modal.close();
        this.createModal();
      },
      colorPresets: this.settings.colorPresets,
      activityCategories: this.settings.activityCategories,
    });
    app.mount(container);
    modal.open();
  }

  createStatisticsModal() {
    const modal = new Modal(this.app);
    const container = modal.contentEl.createDiv();
    const app = createApp(TimeStatistics, {
      cellColors: this.cellColors,
      onClose: () => modal.close(), // 传递关闭函数
      onSwitchToTable: () => {
        modal.close(); // 关闭当前模态框
        this.createModal(); // 打开表格模态框
      },
    });
    app.mount(container);
    modal.open();
  }

  createGanttChartModal() {
    const modal = new Modal(this.app);
    modal.titleEl.setText("Select Date Range for Gantt Chart");
    const container = modal.contentEl.createDiv();
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';

    const startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.value = new Date().toISOString().split('T')[0];
    container.appendChild(startDateInput);

    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.value = new Date().toISOString().split('T')[0];
    container.appendChild(endDateInput);

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Generate Gantt Chart';
    confirmButton.onclick = () => {
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;
      this.generateGanttChart(startDate, endDate);
      modal.close();
    };
    container.appendChild(confirmButton);

    modal.open();
  }

  generateGanttChart(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      new Notice('Invalid date format. Please use YYYY-MM-DD.');
      return;
    }

    if (start > end) {
      new Notice('Start date must be before end date.');
      return;
    }

    const ganttData = Utils.generateGanttData(start, end, this.cellColors);
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const editor = activeView.editor;
      const cursor = editor.getCursor();
      editor.replaceRange(ganttData, cursor);
    } else {
      new Notice('No active editor found.');
    }
  }
}