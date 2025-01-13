import { Plugin, Modal } from 'obsidian';
import { createApp } from 'vue';
import TimeTable from './components/TimeTable.vue';

export default class LyubishevPlugin extends Plugin {
  cellColors: Record<string, { date: string, weekday: string, hours: { color: string, activity: string }[] }> = {}; // 存储每个日期的颜色和活动数据

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
  async saveCellColors(cellColors: Record<string, { date: string, weekday: string, hours: { color: string, activity: string }[] }>): Promise<void> {
    try {
      await this.saveData(cellColors); // 保存数据到 data.json
      console.log("Cell colors and activities saved.");
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
        console.log("Cell colors and activities loaded.");
      } else {
        // 如果没有保存的数据，则使用默认颜色和活动
        this.cellColors = this.generateDefaultData();
        console.log("No saved data found, using default colors and activities.");
      }
    } catch (error) {
      console.error("Error loading cell colors:", error);
    }
  }

  // 生成默认数据并保存到 data.json
  generateDefaultData(): Record<string, { date: string, weekday: string, hours: { color: string, activity: string }[] }> {
    const defaultData: Record<string, { date: string, weekday: string, hours: { color: string, activity: string }[] }> = {};
    const today = new Date();
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
    // 生成当前周的日期、星期和24小时颜色和活动数组
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + i); // 调整为周一至周日
      const dateString = date.toISOString().split('T')[0]; // 格式化日期为 "2025-01-01"
      const weekday = weekdays[date.getDay()]; // 获取星期信息
  
      defaultData[dateString] = {
        date: dateString,
        weekday: weekday,
        hours: Array(24).fill({ color: '#ffffff', activity: '' }), // 每天24个默认白色且没有活动的格子
      };
    }
  
    // 保存默认数据到 data.json
    this.saveData(defaultData);
  
    return defaultData; // 返回生成的默认数据
  }

  // 创建 Modal 并插入 Vue 组件
  createModal() {
    const modal = new Modal(this.app);

    // 创建标题并居中
    const titleEl = modal.contentEl.createEl('h2', { text: 'Lyubishev Time Table' });
    titleEl.style.textAlign = 'center';  // 居中标题
    
    // 创建 Vue 容器并挂载组件
    const container = modal.contentEl.createDiv();
    // 设置容器居中
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.height = '100%';  // 确保容器占满整个 Modal
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
