import { Plugin, Modal } from 'obsidian';
import { createApp } from 'vue';
import TimeTable from './components/TimeTable.vue';

export default class LyubishevPlugin extends Plugin {
  cellColors: Record<string, { date: string, weekday: string, hours: string[] }> = {}; // 存储每个日期的颜色数据

  onload() {
    console.log("Lyubishev Time Management Plugin Loaded");

    // 注册命令来插入时间表
    this.addCommand({
      id: 'insert-time-table',
      name: 'Insert Lyubishev Time Table',
      callback: () => {
        this.createModal();
      }
    });

    // 加载已保存的数据
    this.loadCellColors();
  }

  // 将颜色数据保存到磁盘（data.json）
  async saveCellColors(cellColors: Record<string, { date: string, weekday: string, hours: string[] }>): Promise<void> {
    try {
      await this.saveData(cellColors); // 保存数据到 data.json
      console.log("Cell colors saved.");
    } catch (error) {
      console.error("Error saving cell colors:", error);
    }
  }

  // 从磁盘加载颜色数据（data.json）
  async loadCellColors(): Promise<void> {
    try {
      const savedData = await this.loadData();
      console.log("Saved data:", savedData); // 查看加载的数据
      if (savedData) {
        this.cellColors = savedData;
        console.log("Cell colors loaded.");
      } else {
        // 如果没有保存的数据，则使用默认颜色
        this.cellColors = this.generateDefaultData();
        console.log("No saved data found, using default colors.");
      }
    } catch (error) {
      console.error("Error loading cell colors:", error);
    }
  }

  // 生成默认数据并保存到 data.json
  generateDefaultData(): Record<string, { date: string, weekday: string, hours: string[] }> {
    const defaultData: Record<string, { date: string, weekday: string, hours: string[] }> = {};
    const today = new Date();
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
    // 生成当前周的日期、星期和24小时颜色数组
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + i); // 调整为周一至周日
      const dateString = date.toISOString().split('T')[0]; // 格式化日期为 "2025-01-01"
      const weekday = weekdays[date.getDay()]; // 获取星期信息
  
      defaultData[dateString] = {
        date: dateString,
        weekday: weekday,
        hours: Array(24).fill('#ffffff'), // 每天24个白色格子
      };
    }
  
    // 保存默认数据到 data.json
    this.saveData(defaultData);
  
    return defaultData; // 返回生成的默认数据
  }

  // 创建 Modal 并插入 Vue 组件
  createModal() {
    const modal = new Modal(this.app);
    modal.contentEl.createEl('h2', { text: 'Lyubishev Time Table' });

    const container = modal.contentEl.createDiv();
    const app = createApp(TimeTable, {
      cellColors: this.cellColors,
      saveCellColors: this.saveCellColors.bind(this)
    });
    app.mount(container);

    modal.open();
  }

  onunload() {
    console.log("Lyubishev Time Management Plugin Unloaded");
  }
}
