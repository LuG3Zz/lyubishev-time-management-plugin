import { Plugin, Modal, Setting } from 'obsidian';
import { createApp } from 'vue';
import TimeTable from './components/TimeTable.vue';
import { reactive } from 'vue'; // 引入 reactive

export default class LyubishevPlugin extends Plugin {
  cellColors: Record<string, { date: string, weekday: string, hours: { color: string, activity: string }[] }> = {};
  selectedRange: 'week' | 'month' = 'week'; // 默认时间范围为周
  currentYear: number = new Date().getFullYear();
  onload() {
    console.log("Lyubishev Time Management Plugin Loaded");

    this.addCommand({
      id: 'insert-time-table',
      name: 'Insert Lyubishev Time Table',
      callback: () => {
        this.createModal();
      }
    });
    this.loadCellColors();
  }

  async saveCellColors(cellColors: Record<string, { date: string, weekday: string, hours: { color: string, activity: string }[] }>): Promise<void> {
    try {
      await this.saveData(cellColors);
      console.log("Cell colors and activities saved.");
    } catch (error) {
      console.error("Error saving cell colors:", error);
    }
  }
  async loadCellColors(): Promise<void> {
    try {
      const savedData = await this.loadData();
      if (savedData) {
        this.cellColors = savedData;
        console.log("Cell colors and activities loaded.");
      } else {
        this.cellColors = this.generateDefaultData();
        console.log("No saved data found, using default colors and activities.");
      }
    } catch (error) {
      console.error("Error loading cell colors:", error);
    }
  }

  generateDefaultData(range: 'week' | 'month' = 'week'): Record<string, { date: string, weekday: string, hours: { color: string, activity: string }[] }> {
    const defaultData: Record<string, { date: string, weekday: string, hours: { color: string, activity: string }[] }> = {};
    const today = new Date();
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let startDate: Date = new Date();
    let endDate: Date = new Date();

    if (range === 'week') {
      startDate.setDate(today.getDate() - today.getDay()); // 调整为周一开始
      endDate.setDate(startDate.getDate() + 6); // 周日结束
    } else if (range === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1); // 本月第一天
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // 本月最后一天
    }

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      const weekday = weekdays[d.getDay()];

      // 如果已有数据，则保留；否则生成默认数据
      if (this.cellColors[dateString]) {
        defaultData[dateString] = this.cellColors[dateString];
      } else {
        defaultData[dateString] = {
          date: dateString,
          weekday: weekday,
          hours: Array(24).fill({ color: '#ffffff', activity: '' }), // 每天24个默认白色且没有活动的格子
        };
      }
    }
    this.saveData(defaultData);
    return defaultData;
  }
  createModal() {
    const modal = new Modal(this.app);
    modal.contentEl.style.width = '80%';
    modal.contentEl.style.height = '80%';
    modal.contentEl.style.maxWidth = '1200px';
    modal.contentEl.style.maxHeight = '800px';
  
  
    const container = modal.contentEl.createDiv();
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.height = '100%';
    container.style.width = '100%'; /* 容器宽度占满 Modal */
  
    // 将 cellColors 转换为 Vue 的响应式对象
    const reactiveCellColors = reactive(this.cellColors);
  
    const app = createApp(TimeTable, {
      cellColors: reactiveCellColors, // 使用响应式的 cellColors
      saveCellColors: this.saveCellColors.bind(this),
      currentYear: this.currentYear,
      changeYear: (delta: number) => {
        this.currentYear += delta;
        this.cellColors = this.generateDefaultData(this.selectedRange);
        modal.close();
        this.createModal();
      },
    });
    app.mount(container);
  
    modal.open();
  }

  onunload() {
    console.log("Lyubishev Time Management Plugin Unloaded");
  }
}