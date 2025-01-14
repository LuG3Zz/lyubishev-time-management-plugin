import { Plugin, Modal, Setting, App, PluginSettingTab } from 'obsidian';
import { createApp } from 'vue';
import TimeTable from './components/TimeTable.vue';
import TimeStatistics from './components/TimeStatistics.vue';
import { reactive } from 'vue';

interface PluginSettings {
  colorPresets: string[]; // 自定义颜色预设
  activityCategories: string[]; // 活动分类标签
}

class LyubishevSettingTab extends PluginSettingTab {
  plugin: LyubishevPlugin;
  startDate: string = ''; // 声明 startDate 属性
  endDate: string = ''; // 声明 endDate 属性

  constructor(app: App, plugin: LyubishevPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    // 添加颜色预设设置
    new Setting(containerEl)
      .setName('Color Presets')
      .setDesc('Add or remove custom color presets for quick selection.')
      .addButton(button => {
        button
          .setButtonText('Add Preset')
          .onClick(async () => {
            const newColor = '#ffffff'; // 默认颜色
            this.plugin.settings.colorPresets.push(newColor);
            await this.plugin.saveSettings(); // 保存设置
            this.display(); // 刷新设置页面
          });
      });

    // 显示颜色预设列表
    this.plugin.settings.colorPresets.forEach((color, index) => {
      new Setting(containerEl)
        .setName(`Preset ${index + 1}`)
        .addColorPicker(colorPicker => {
          colorPicker
            .setValue(color)
            .onChange(async (newColor) => {
              this.plugin.settings.colorPresets[index] = newColor;
              await this.plugin.saveSettings(); // 保存设置
            });
        })
        .addButton(button => {
          button
            .setButtonText('Remove')
            .onClick(async () => {
              this.plugin.settings.colorPresets.splice(index, 1);
              await this.plugin.saveSettings(); // 保存设置
              this.display(); // 刷新设置页面
            });
        });
    });

    // 添加活动分类设置
    new Setting(containerEl)
      .setName('Activity Categories')
      .setDesc('Add or remove activity categories for tagging.')
      .addButton(button => {
        button
          .setButtonText('Add Category')
          .onClick(async () => {
            const newCategory = 'New Category'; // 默认分类名称
            this.plugin.settings.activityCategories.push(newCategory);
            await this.plugin.saveSettings(); // 保存设置
            this.display(); // 刷新设置页面
          });
      });

    // 显示活动分类列表
    this.plugin.settings.activityCategories.forEach((category, index) => {
      new Setting(containerEl)
        .setName(`Category ${index + 1}`)
        .addText(text => {
          text
            .setValue(category)
            .onChange(async (newCategory) => {
              this.plugin.settings.activityCategories[index] = newCategory;
              await this.plugin.saveSettings(); // 保存设置
            });
        })
        .addButton(button => {
          button
            .setButtonText('Remove')
            .onClick(async () => {
              this.plugin.settings.activityCategories.splice(index, 1);
              await this.plugin.saveSettings(); // 保存设置
              this.display(); // 刷新设置页面
            });
        });
    });

    // 添加清空所有数据的按钮
    new Setting(containerEl)
      .setName('Clear All Data')
      .setDesc('This will remove all color presets, activity categories, and time table data.')
      .addButton(button => {
        button
          .setButtonText('Clear Data')
          .setWarning() // 设置为警告样式（红色按钮）
          .onClick(async () => {
            // 弹出确认对话框
            const confirmed = confirm('Are you sure you want to clear all data? This action cannot be undone.');
            if (!confirmed) return;

            // 清空所有数据
            this.plugin.settings.colorPresets = []; // 清空颜色预设
            this.plugin.settings.activityCategories = []; // 清空活动分类
            this.plugin.cellColors = {}; // 清空时间表数据

            // 保存清空后的数据
            await this.plugin.saveSettings();
            await this.plugin.saveCellColors(this.plugin.cellColors);

            // 刷新设置页面
            this.display();
          });
      });

   

    // 添加导出数据为 CSV 的按钮
    new Setting(containerEl)
      .setName('Export Data as CSV')
      .setDesc('Export time table data as a CSV file for the selected date range.')
      .addButton(button => {
        button
          .setButtonText('Export CSV')
          .onClick(async () => {
            if (!this.startDate || !this.endDate) {
              alert('Please select both start and end dates.');
              return;
            }

            // 调用导出 CSV 的方法
            this.exportDataAsCSV(this.startDate, this.endDate);
          });
      });
 // 添加日期选择器
    const dateRangeContainer = containerEl.createDiv();
    dateRangeContainer.style.display = 'flex';
    dateRangeContainer.style.gap = '10px';
    dateRangeContainer.style.marginBottom = '20px';

    // 开始日期选择器
    const startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.value = this.startDate;
    startDateInput.addEventListener('change', (event) => {
      this.startDate = (event.target as HTMLInputElement).value;
    });
    dateRangeContainer.appendChild(startDateInput);

    // 结束日期选择器
    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.value = this.endDate;
    endDateInput.addEventListener('change', (event) => {
      this.endDate = (event.target as HTMLInputElement).value;
    });
    dateRangeContainer.appendChild(endDateInput);
  }

  // 导出数据为 CSV 的方法
  exportDataAsCSV(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
  
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert('Invalid date format. Please use YYYY-MM-DD.');
      return;
    }
  
    if (start > end) {
      alert('Start date must be before end date.');
      return;
    }
  
    // 生成 CSV 数据
    const csvData = this.generateCSVData(start, end);
  
    // 添加 BOM（Byte Order Mark）以确保 Excel 正确识别 UTF-8 编码
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvData], { type: 'text/csv;charset=utf-8;' });
  
    // 创建 CSV 文件并下载
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lyubishev_time_table_${startDate}_to_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } 

  // 生成 CSV 数据
  generateCSVData(start: Date, end: Date): string {
    let csv = 'Date,Weekday,Hour,Color,Activity,Category\n'; // CSV 表头

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      const dayData = this.plugin.cellColors[dateString];

      if (dayData) {
        dayData.hours.forEach((hour, hourIndex) => {
          csv += `${dateString},${dayData.weekday},${hourIndex}:00,${hour.color},${hour.activity},${hour.category}\n`;
        });
      }
    }

    return csv;
  }
}


export default class LyubishevPlugin extends Plugin {
  settings: PluginSettings = {
    colorPresets: [],
    activityCategories: [],
  };
  cellColors: Record<string, { date: string, weekday: string, hours: { color: string, activity: string, category?: string }[] }> = {};
  selectedRange: 'week' | 'month' = 'week';
  currentYear: number = new Date().getFullYear();

  async onload() {
    console.log("Lyubishev Time Management Plugin Loaded");

    // 加载设置
    await this.loadSettings();

    // 添加设置选项卡
    this.addSettingTab(new LyubishevSettingTab(this.app, this));

    // 添加命令
    this.addCommand({
      id: 'Show-time-table',
      name: 'Show Lyubishev Time Table',
      callback: () => {
        this.createModal();
      }
    });

    this.addCommand({
      id: 'show-time-statistics',
      name: 'Show Time Statistics',
      callback: () => {
        this.createStatisticsModal();
      }
    });

    this.loadCellColors();
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

  // 创建时间表 Modal
  createModal() {
    const modal = new Modal(this.app);
    const container = modal.contentEl.createDiv();
    container.style.width = '100%'; // 设置宽度为 100%
    container.style.height = '100%'; // 设置高度为 100%


    // 将 cellColors 转换为 Vue 的响应式对象
    const reactiveCellColors = reactive(this.cellColors);

    const app = createApp(TimeTable, {
      cellColors: reactiveCellColors,
      saveCellColors: this.saveCellColors.bind(this),
      currentYear: this.currentYear,
      changeYear: (delta: number) => {
        this.currentYear += delta;
        this.cellColors = this.generateDefaultData(this.selectedRange);
        modal.close();
        this.createModal();
      },
      colorPresets: this.settings.colorPresets, // 传递颜色预设
      activityCategories: this.settings.activityCategories, // 传递活动分类
    });
    app.mount(container);

    modal.open();
  }

  // 创建统计 Modal
  createStatisticsModal() {
    const modal = new Modal(this.app);
    const container = modal.contentEl.createDiv();

    // 将 cellColors 转换为 Vue 的响应式对象
    const reactiveCellColors = reactive(this.cellColors);

    const app = createApp(TimeStatistics, {
      cellColors: reactiveCellColors,
    });
    app.mount(container);

    modal.open();
  }

  async saveCellColors(cellColors: Record<string, { date: string, weekday: string, hours: { color: string, activity: string, category?: string }[] }>): Promise<void> {
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

  generateDefaultData(range: 'week' | 'month' = 'week'): Record<string, { date: string, weekday: string, hours: { color: string, activity: string, category?: string }[] }> {
    const defaultData: Record<string, { date: string, weekday: string, hours: { color: string, activity: string, category?: string }[] }> = {};
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
          hours: Array(24).fill({ color: '#ffffff', activity: '', category: '' }), // 每天24个默认白色且没有活动的格子
        };
      }
    }
    this.saveData(defaultData);
    return defaultData;
  }

  onunload() {
    console.log("Lyubishev Time Management Plugin Unloaded");
  }
}