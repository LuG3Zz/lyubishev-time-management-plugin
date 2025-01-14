<template>
  <div class="time-table" :data-range="selectedRange">
    <!-- 控制栏 -->
    <div class="controls">
      <div class="date-selector">
        <input type="date" v-model="selectedDate" @change="updateView" />
        <select v-model="selectedRange" @change="updateView">
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>
      <div class="color-picker">
        <input type="color" v-model="colorPicker" />
        <select v-model="selectedColorPreset" @change="applyColorPreset">
          <option v-for="(color, index) in colorPresets" :key="index" :value="color">
            Preset {{ index + 1 }}
          </option>
        </select>
        <input type="text" v-model="activityName" placeholder="Enter activity name" />
        <select v-model="selectedCategory">
          <option value="">no category</option>
          <option v-for="(category, index) in activityCategories" :key="index" :value="category">
            {{ category }}
          </option>
        </select>
      </div>
    </div>

    <!-- 表格部分 -->
    <div class="table-container">
      <!-- 表头 -->
      <div class="header-row">
        <div class="header-cell"></div>
        <div
          v-for="(day, dayIndex) in weekDays"
          :key="dayIndex"
          class="header-cell"
          :class="{ 'highlight': isToday(day.date) }"
        >
          <div>{{ formatDate(day.date) }}</div>
          <div>{{ day.weekday }}</div>
        </div>
      </div>

      <!-- 表格行 -->
      <div v-for="(hour, hourIndex) in hours" :key="hourIndex" class="time-row">
        <div class="time-cell">{{ hour }}</div>
        <div
          v-for="(day, dayIndex) in weekDays"
          :key="dayIndex"
          class="time-cell"
          :style="{ backgroundColor: day.hours[hourIndex].color, color: getFontColor(day.hours[hourIndex].color) }"
          @click="changeCellColor(day.date, hourIndex)"
        >
          <div class="activity-name" v-if="day.hours[hourIndex].activity">
            {{ day.hours[hourIndex].activity }}
          </div>
          <div class="activity-category" v-if="day.hours[hourIndex].category">
            {{ day.hours[hourIndex].category }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
  props: {
    cellColors: Object,
    saveCellColors: Function,
    currentYear: Number,
    changeYear: Function,
    colorPresets: Array, // 从父组件传递颜色预设
    activityCategories: Array, // 从父组件传递活动分类
  },
  data() {
    return {
      hours: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      colorPicker: '#ffffff',
      activityName: '',
      selectedDate: new Date().toISOString().split('T')[0],
      selectedRange: 'week',
      selectedColorPreset: '', // 当前选中的颜色预设
      selectedCategory: '', // 当前选中的活动分类
    };
  },
  computed: {
    // 根据选择的日期和范围生成周或月的日期数据
    weekDays() {
      const startDate = new Date(this.selectedDate);
      const endDate = new Date(startDate);

      if (this.selectedRange === 'week') {
        startDate.setDate(startDate.getDate() - startDate.getDay()); // 调整为周一开始
        endDate.setDate(startDate.getDate() + 6); // 周日结束
      } else if (this.selectedRange === 'month') {
        startDate.setDate(1); // 本月第一天
        endDate.setMonth(startDate.getMonth() + 1, 0); // 本月最后一天
      }

      const days = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];

        // 如果已有数据，则保留；否则生成默认数据
        if (this.cellColors[dateString]) {
          days.push(this.cellColors[dateString]);
        } else {
          days.push({
            date: dateString,
            weekday: weekday,
            hours: Array(24).fill({ color: '#ffffff', activity: '', category: '' }), // 每天24个默认白色且没有活动的格子
          });
        }
      }

      return days;
    },
      // 动态计算表头和表格列的宽度
  tableCellWidth() {
    if (this.selectedRange === 'month') {
      const daysInMonth = this.weekDays.length; // 当前月份的天数
      return `calc(100% / ${daysInMonth})`; // 均匀分布宽度
    }
    return '30px'; // 周视图时固定宽度
  },
  },
  methods: {
    // 应用选中的颜色预设
    applyColorPreset() {
      this.colorPicker = this.selectedColorPreset;
    },

    // 更新视图
    updateView() {
      this.$forceUpdate(); // 强制更新视图
    },

    // 选择颜色后更新单元格颜色
    changeCellColor(date, hourIndex) {
      if (!this.cellColors[date]) {
        const newDate = new Date(date);
        const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][newDate.getDay()];
        this.cellColors[date] = {
          date: date,
          weekday: weekday,
          hours: Array(24).fill({ color: '#ffffff', activity: '', category: '' }), // 初始化24小时数据
        };
      }

      // 创建一个新的对象，避免修改引用
      const updatedCell = {
        color: this.colorPicker,
        activity: this.activityName,
        category: this.selectedCategory, // 添加分类标签
      };

      // 更新指定日期和小时的颜色和活动名称
      const day = this.cellColors[date];
      day.hours = [...day.hours]; // 创建新的数组副本
      day.hours[hourIndex] = updatedCell; // 更新指定小时的数据

      // 保存颜色数据到父组件
      this.saveCellColors(this.cellColors); // 保存数据

      // 强制 Vue 更新组件视图
      this.$forceUpdate(); // 强制 Vue 更新视图
    },

    // 计算背景色的亮度，返回合适的字体颜色
    getFontColor(backgroundColor) {
      const hex = backgroundColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return brightness < 128 ? '#ffffff' : '#000000';
    },

    // 判断是否为当天日期
    isToday(dateString) {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      return dateString === todayString;
    },

    // 格式化日期为 "MM-DD"
    formatDate(dateString) {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}-${day}`;
    },
  },
};
</script>

<style scoped>
.time-table {
  display: flex;
  flex-direction: column;
  align-items: stretch; /* 使子元素拉伸以填满宽度 */
  padding: 10px;
  width: 100%;
  height: 100%;
  box-sizing: border-box; /* 确保 padding 不会影响整体尺寸 */
}

/* 控制栏（date-selector 和 color-picker） */
.controls {
  display: flex;
  justify-content: space-center;
  align-items: center;
  width: 50%;
  margin-bottom: 5px;
}

.date-selector {
  display: flex;
  align-items: center;
}

.date-selector input[type="date"],
.date-selector select {
  margin: 0 10px;
  padding: 5px;
  font-size: 14px;
}

.color-picker {
  display: flex;
  align-items: center;
}

.color-picker input {
  margin: 0 5px;
  padding: 5px;
}

.color-picker input[type="color"] {
  width: 40px;
  height: 40px;
  border: none;
}

.color-picker input[type="text"] {
  padding: 5px;
  width: 100px;
}

.color-picker select {
  padding: 5px;
  font-size: 14px;
}

/* 表格容器 */
.table-container {
  flex: 1; /* 使表格容器占据剩余空间 */
  width: 100%;
  overflow-x: auto; /* 水平滚动条 */
  overflow-y: auto; /* 垂直滚动条 */
  margin: 0 auto; /* 水平居中 */
}

/* 表头 */
.header-row {
  display: flex;
  width: 100%; /* 表头宽度为 100% */
  margin-bottom: 5px;
  margin-top: 5px;
}

.header-cell {
  flex: 1; /* 单元格宽度均匀分布 */
  height: 30px; /* 固定高度为 30px */
  text-align: center;
  font-size: 10px;
  justify-content: center;
  align-items: center;
  border-radius: 3px;
  background-color: transparent;
  margin-inline: 1% 1%;
  writing-mode: horizontal-tb;
  font-weight: bold;
}

.header-cell.highlight {
  color: #ffcc00;
  font-weight: bold;
}

/* 表格行 */
.time-row {
  display: flex;
  width: 100%; /* 表格行宽度为 100% */
  margin-bottom: 5px;
}

.time-cell {
  flex: 1; /* 单元格宽度均匀分布 */
  height: 30px; /* 固定高度为 30px */
  text-align: center;
  cursor: pointer;
  background-color: #ffffff;
  border: 1px solid #ccc;
  margin-right: 5px; /* 单元格间隔 */
  font-size: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 3px;
  position: relative;
}

.time-cell:first-child {
  flex: 0 0 50px; /* 第一列（时间列）宽度固定为 50px */
  background-color: transparent;
  font-size: 15px;
  font-weight: bold;
  white-space: nowrap; /* 防止时间文本换行 */
}

/* 活动名称悬浮提示 */
.time-cell:hover .activity-name {
  display: block;
}

.activity-name {
  display: none;
  font-size: 16px;
  text-align: center;
  z-index: 10;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px;
  border-radius: 3px;
  white-space: nowrap; /* 防止文本换行 */
}

.activity-category {
  font-size: 13px;
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  color: inherit;
  white-space: nowrap; /* 防止时间文本换行 */
}

/* 月视图时表头和表格行的宽度一致 */
.time-table[data-range="month"] .header-row,
.time-table[data-range="month"] .time-row {
  width: 100%; /* 月视图时宽度为 100% */
}

.time-table[data-range="month"] .header-cell{
  flex: 1; /* 月视图时单元格宽度均匀分布 */
min-width: 10px; /* 最小宽度为 30px */
padding: 0 0 0 25px;
margin-bottom: 10px;
}
.time-table[data-range="month"] .time-cell {
  flex: 1; /* 月视图时单元格宽度均匀分布 */
  min-width: 30px; /* 最小宽度为 30px */
  max-width: 100%; /* 防止单元格过宽 */
}

/* 月视图时时间列的宽度固定 */
.time-table[data-range="month"] .time-cell:first-child {
  flex: 0 0 50px; /* 时间列宽度固定为 50px */
  white-space: nowrap; /* 防止时间文本换行 */
}
</style>