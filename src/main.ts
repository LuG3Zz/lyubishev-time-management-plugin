import { Plugin, Modal, Setting, App, PluginSettingTab, MarkdownView,Notice } from 'obsidian';
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

    // 添加导出数据为 CSV 的按钮
    new Setting(containerEl)
      .setName('Export Data as CSV')
      .setDesc('Export time table data as a CSV file for the selected date range.')
      .addButton(button => {
        button
          .setButtonText('Export CSV')
          .onClick(async () => {
            if (!this.startDate || !this.endDate) {
              new Notice('Please select both start and end dates.');
              return;
            }

            // 调用导出 CSV 的方法
            try {
            this.exportDataAsCSV(this.startDate, this.endDate);
              new Notice('CSV data exported successfully!'); // 弹出导入成功的通知
          } catch (error) {
              console.error('Error importing CSV:', error);
              new Notice('Failed to export CSV. Please check the console for details.'); // 弹出导入失败的通知
          }

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

   // 添加导入 CSV 按钮
   new Setting(containerEl)
   .setName('Import CSV')
   .setDesc('Import time table data from a CSV file.')
   .addButton(button => {
       button
           .setButtonText('Import CSV')
           .setCta() // 设置为高亮按钮
           .onClick(() => {
               // 创建文件输入元素
               const fileInput = document.createElement('input');
               fileInput.type = 'file';
               fileInput.accept = '.csv'; // 只接受 CSV 文件

               // 监听文件选择事件
               fileInput.onchange = async (event) => {
                   const file = (event.target as HTMLInputElement).files?.[0];
                   if (file) {
                       try {
                           const fileContent = await file.text(); // 读取文件内容
                           this.importCSVData(fileContent); // 解析并导入数据
                           new Notice('CSV data imported successfully!'); // 弹出导入成功的通知
                           this.display();
                       } catch (error) {
                           console.error('Error importing CSV:', error);
                           new Notice('Failed to import CSV. Please check the console for details.'); // 弹出导入失败的通知
                       }
                   }
               };

               fileInput.click(); // 触发文件选择对话框
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
new Setting(containerEl)
    .setName('Save Settings')
    .setDesc('Save all changes made to the settings.')
    .addButton(button => {
        button
            .setButtonText('Save')
            .setCta() // 设置为高亮按钮
            .onClick(async () => {
                try {
                    await this.plugin.saveSettings(); // 保存设置
                    new Notice('Settings saved successfully!'); // 弹出保存成功的通知
                } catch (error) {
                    console.error('Error saving settings:', error);
                    new Notice('Failed to save settings. Please check the console for details.'); // 弹出保存失败的通知
                }
            });
    });

  }
 // 解析并导入 CSV 数据
 importCSVData(csvContent: string): void {
  const lines = csvContent.split('\n'); // 按行分割 CSV 内容
  if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows.');
  }

  const headers = lines[0].split(','); // 获取表头

  // 检查 CSV 格式是否正确
  if (
      headers.length !== 6 ||
      headers[0] !== 'Date' ||
      headers[1] !== 'Weekday' ||
      headers[2] !== 'Hour' ||
      headers[3] !== 'Color' ||
      headers[4] !== 'Activity' ||
      headers[5] !== 'Category'
  ) {
      throw new Error(
          'Invalid CSV format. Please ensure the CSV file has the correct columns: Date, Weekday, Hour, Color, Activity, Category.'
      );
  }

  // 用于存储所有唯一的分类和颜色
  const uniqueCategories = new Set<string>();
  const uniqueColors = new Set<string>();

  // 解析 CSV 数据
  for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // 跳过空行

      const values = line.split(','); // 按逗号分割每行数据
      if (values.length !== 6) {
          throw new Error(`Invalid data format in line ${i + 1}. Expected 6 columns, found ${values.length}.`);
      }

      const [date, weekday, hour, color, activity, category] = values;

      // 如果分类不为空，则添加到唯一分类集合中
      if (category) {
          uniqueCategories.add(category);
      }

      // 如果颜色不为空，则添加到唯一颜色集合中
      if (color) {
          uniqueColors.add(color);
      }

      // 如果日期不存在于 cellColors 中，则初始化
      if (!this.plugin.cellColors[date]) {
          this.plugin.cellColors[date] = {
              date: date,
              weekday: weekday,
              hours: Array(24).fill({ color: '#ffffff', activity: '', category: '' }), // 初始化 24 小时数据
          };
      }

      // 解析小时
      const hourIndex = parseInt(hour.split(':')[0], 10);
      if (isNaN(hourIndex) || hourIndex < 0 || hourIndex >= 24) {
          throw new Error(`Invalid hour value in line ${i + 1}: ${hour}. Hour must be between 00:00 and 23:00.`);
      }

      // 更新指定小时的数据
      this.plugin.cellColors[date].hours[hourIndex] = {
          color: color,
          activity: activity,
          category: category,
      };
  }

  // 将唯一分类添加到设置中
  uniqueCategories.forEach((category) => {
      if (!this.plugin.settings.activityCategories.includes(category)) {
          this.plugin.settings.activityCategories.push(category);
      }
  });

  // 将唯一颜色添加到颜色预设中
  uniqueColors.forEach((color) => {
      if (!this.plugin.settings.colorPresets.includes(color)) {
          this.plugin.settings.colorPresets.push(color);
      }
  });

  // 保存更新后的数据
  this.plugin.saveCellColors(this.plugin.cellColors);
  this.plugin.saveSettings(); // 保存分类和颜色预设
}

  // 导出数据为 CSV 的方法
  exportDataAsCSV(startDate: string, endDate: string) {
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

    // 添加生成甘特图代码块的命令
    this.addCommand({
      id: 'generate-gantt-chart',
      name: 'Generate Gantt Chart',
      callback: () => {
        this.createGanttChartModal();
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

  // 创建甘特图 Modal
  createGanttChartModal() {
    const modal = new Modal(this.app);
    modal.titleEl.setText("Select Date Range for Gantt Chart");

    const container = modal.contentEl.createDiv();
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';

    // 开始日期选择器
    const startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.value = new Date().toISOString().split('T')[0];
    container.appendChild(startDateInput);

    // 结束日期选择器
    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.value = new Date().toISOString().split('T')[0];
    container.appendChild(endDateInput);

    // 确认按钮
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

  // 生成甘特图代码块
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

    // 生成甘特图数据
    const ganttData = this.generateGanttData(start, end);

    // 插入到当前编辑器视图中
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const editor = activeView.editor;
      const cursor = editor.getCursor();
      editor.replaceRange(ganttData, cursor);
    } else {
      new Notice('No active editor found.');
    }
  }
  generateGanttData(start: Date, end: Date): string {
    let ganttChart = "```mermaid\ngantt\n";
    ganttChart += `    title Lyubishev Time Management Gantt Chart (${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]})\n`;
    ganttChart += "    dateFormat  YYYY-MM-DDTHH:mm\n"; // 支持小时和分钟
    ganttChart += "    axisFormat  %m-%d %H:%M\n"; // 横坐标显示为小时和分钟

    // 用于存储按分类分组后的活动数据
    const activitiesByCategory: Record<string, { name: string, start: string, end: string }[]> = {};

    // 遍历日期范围
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        const dayData = this.cellColors[dateString];

        if (dayData) {
            dayData.hours.forEach((hour, hourIndex) => {
                if (hour.activity) {
                    const activityName = hour.activity;
                    const category = hour.category || 'no category';
                    const hourString = String(hourIndex).padStart(2, '0');
                    const timeString = `${dateString}T${hourString}:00`; // 格式为 YYYY-MM-DDTHH:mm

                    // 如果分类不存在于 activitiesByCategory 中，则初始化
                    if (!activitiesByCategory[category]) {
                        activitiesByCategory[category] = [];
                    }

                    // 查找是否已经存在相同名称的活动时间段
                    const existingActivity = activitiesByCategory[category].find(
                        (act) => act.name === activityName
                    );

                    if (existingActivity) {
                        // 检查是否连续
                        const lastEndTime = new Date(existingActivity.end).getTime();
                        const currentStartTime = new Date(timeString).getTime();

                        // 如果当前时间段与上一个时间段连续，则延长结束时间
                        if (currentStartTime === lastEndTime + 60 * 60 * 1000) { // 1 小时 = 60 * 60 * 1000 毫秒
                            existingActivity.end = timeString;
                        } else {
                            // 如果不连续，则添加新的活动时间段
                            activitiesByCategory[category].push({
                                name: activityName,
                                start: timeString,
                                end: timeString,
                            });
                        }
                    } else {
                        // 如果不存在，则添加新的活动时间段
                        activitiesByCategory[category].push({
                            name: activityName,
                            start: timeString,
                            end: timeString,
                        });
                    }
                }
            });
        }
    }

    // 生成甘特图数据
    Object.entries(activitiesByCategory).forEach(([category, activities]) => {
        ganttChart += `    section ${category}\n`;

        activities.forEach((activity, index) => {
            const startDate = activity.start;
            const endDate = activity.end;

            // 计算任务持续时间（小时）
            const start = new Date(startDate);
            const end = new Date(endDate);
            const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)) + 1; // 转换为小时

            ganttChart += `    ${activity.name.replace(/ /g, '_')} :${category}_${index + 1}, ${startDate}, ${duration}h\n`;
        });
    });

    ganttChart += "```";
    return ganttChart;
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