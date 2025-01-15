// utils.ts
import { PluginSettings, CellColors, DayData, CellColor } from './types';
import  LyubishevPlugin from './main'; 

export class Utils {
  // 生成默认的时间表数据
  static generateDefaultData(range: 'week' | 'month' = 'week'): CellColors {
    const defaultData: CellColors = {};
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

      defaultData[dateString] = {
        date: dateString,
        weekday: weekday,
        hours: Array(24).fill({ color: '#ffffff', activity: '', category: '' }),
      };
    }

    return defaultData;
  }

  // 根据背景色计算字体颜色
  static getFontColor(backgroundColor: string): string {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return brightness < 128 ? '#ffffff' : '#000000';
  }

// 导入 CSV 数据
static importCSVData(csvContent: string, plugin: LyubishevPlugin): void {
  const lines = csvContent.split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows.');
  }

  const headers = lines[0].split(',');
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

  const uniqueCategories = new Set<string>();
  const uniqueColors = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',');
    if (values.length !== 6) {
      throw new Error(`Invalid data format in line ${i + 1}. Expected 6 columns, found ${values.length}.`);
    }

    const [date, weekday, hour, color, activity, category] = values;

    if (category) {
      uniqueCategories.add(category); // 添加唯一分类
    }
    if (color) {
      uniqueColors.add(color); // 添加唯一颜色
    }

    if (!plugin.cellColors[date]) {
      plugin.cellColors[date] = {
        date: date,
        weekday: weekday,
        hours: Array(24).fill({ color: '#ffffff', activity: '', category: '' }),
      };
    }

    const hourIndex = parseInt(hour.split(':')[0], 10);
    if (isNaN(hourIndex) || hourIndex < 0 || hourIndex >= 24) {
      throw new Error(`Invalid hour value in line ${i + 1}: ${hour}. Hour must be between 00:00 and 23:00.`);
    }

    plugin.cellColors[date].hours[hourIndex] = {
      color: color,
      activity: activity,
      category: category,
    };
  }

  // 更新颜色预设
  uniqueColors.forEach((color) => {
    if (!plugin.settings.colorPresets.includes(color)) {
      plugin.settings.colorPresets.push(color);
    }
  });

  // 更新活动分类
  uniqueCategories.forEach((category) => {
    if (!plugin.settings.activityCategories.includes(category)) {
      plugin.settings.activityCategories.push(category);
    }
  });

  // 保存配置和数据
  plugin.saveSettings(); // 保存颜色预设和活动分类
  plugin.saveCellColors(plugin.cellColors); // 保存时间表数据
} 

  // 导出数据为 CSV
  static exportDataAsCSV(startDate: string, endDate: string, cellColors: CellColors): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Please use YYYY-MM-DD.');
    }

    if (start > end) {
      throw new Error('Start date must be before end date.');
    }

    const csvData = this.generateCSVData(start, end, cellColors);
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvData], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lyubishev_time_table_${startDate}_to_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // 生成 CSV 数据
  private static generateCSVData(start: Date, end: Date, cellColors: CellColors): string {
    let csv = 'Date,Weekday,Hour,Color,Activity,Category\n';

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      const dayData = cellColors[dateString];

      if (dayData) {
        dayData.hours.forEach((hour, hourIndex) => {
          csv += `${dateString},${dayData.weekday},${hourIndex}:00,${hour.color},${hour.activity},${hour.category}\n`;
        });
      }
    }

    return csv;
  }

  // 生成甘特图数据
  static generateGanttData(start: Date, end: Date, cellColors: CellColors): string {
    let ganttChart = "```mermaid\ngantt\n";
    ganttChart += `    title Lyubishev Time Management Gantt Chart (${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]})\n`;
    ganttChart += "    dateFormat  YYYY-MM-DDTHH:mm\n";
    ganttChart += "    axisFormat  %m-%d %H:%M\n";

    const activitiesByCategory: Record<string, { name: string, start: string, end: string }[]> = {};

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      const dayData = cellColors[dateString];

      if (dayData) {
        dayData.hours.forEach((hour, hourIndex) => {
          if (hour.activity) {
            const activityName = hour.activity;
            const category = hour.category || 'no category';
            const hourString = String(hourIndex).padStart(2, '0');
            const timeString = `${dateString}T${hourString}:00`;

            if (!activitiesByCategory[category]) {
              activitiesByCategory[category] = [];
            }

            const existingActivity = activitiesByCategory[category].find(
              (act) => act.name === activityName
            );

            if (existingActivity) {
              const lastEndTime = new Date(existingActivity.end).getTime();
              const currentStartTime = new Date(timeString).getTime();

              if (currentStartTime === lastEndTime + 60 * 60 * 1000) {
                existingActivity.end = timeString;
              } else {
                activitiesByCategory[category].push({
                  name: activityName,
                  start: timeString,
                  end: timeString,
                });
              }
            } else {
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

    Object.entries(activitiesByCategory).forEach(([category, activities]) => {
      ganttChart += `    section ${category}\n`;
      activities.forEach((activity, index) => {
        const startDate = activity.start;
        const endDate = activity.end;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)) + 1;
        ganttChart += `    ${activity.name.replace(/ /g, '_')} :${category}_${index + 1}, ${startDate}, ${duration}h\n`;
      });
    });

    ganttChart += "```";
    return ganttChart;
  }
}