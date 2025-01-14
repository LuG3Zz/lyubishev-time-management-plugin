<template>
  <div class="time-table" :data-range="selectedRange">
    <!-- 控制栏 -->
    <div class="controls">
      <div class="date-selector">
        <input type="date" v-model="selectedDate" @change="updateView" />
        <select v-model="selectedRange" @change="updateView">
          <option value="week">周</option>
          <option value="month">月</option>
        </select>
      </div>
      <div class="color-picker">
        <input type="color" v-model="colorPicker" />
        <input type="text" v-model="activityName" placeholder="Enter activity name" />
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
          <div class="activity-name">{{ day.hours[hourIndex].activity }}</div>
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
    currentYear: Number, // 当前年份
    changeYear: Function, // 切换年份的函数
  },
  data() {
    return {
      hours: Array.from({ length: 24 }, (_, i) => `${i}:00`), // 24小时
      colorPicker: '#ffffff', // 默认颜色选择器的颜色
      activityName: '', // 用户输入的活动名称
      selectedDate: new Date().toISOString().split('T')[0], // 默认选择当天日期
      selectedRange: 'week', // 默认选择周视图
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
            hours: Array(24).fill({ color: '#ffffff', activity: '' }), // 每天24个默认白色且没有活动的格子
          });
        }
      }

      return days;
    },
  },
  methods: {
    // 更新视图
    updateView() {
      this.$forceUpdate(); // 强制更新视图
    },

    // 选择颜色后更新单元格颜色
    changeCellColor(date, hourIndex) {
  // 如果该日期的数据不存在，则初始化
  if (!this.cellColors[date]) {
    const newDate = new Date(date);
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][newDate.getDay()];
    this.cellColors[date] = {
      date: date,
      weekday: weekday,
      hours: Array(24).fill({ color: '#ffffff', activity: '' }), // 初始化24小时数据
    };
  }

  // 创建一个新的对象，避免修改引用
  const updatedCell = {
    color: this.colorPicker,
    activity: this.activityName,
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
      return brightness < 128 ? '#ffffff' : '#e4113b';
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
  align-items: center;
  padding: 10px;
  width: 100%;
  height: 100%;
}

/* 控制栏（date-selector 和 color-picker） */
.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
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
  width: 150px;
}

/* 表格容器 */
.table-container {
  width: 100%;
  overflow-x: auto; /* 水平滚动条 */
  overflow-y: hidden; /* 隐藏垂直滚动条 */
}

/* 表头 */
.header-row {
  display: flex;
  width: 100%;
  margin-bottom: 10px;
}

.header-cell {
  flex: 0 0 calc((100% - 50px) / 7); /* 固定宽度为 (100% - 时间列宽度) / 7 */
  text-align: center;
  font-size: 12px;
  padding: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 3px;
  background-color: transparent;
  margin-right: 5px; /* 单元格间隔 */
}

.header-cell.highlight {
  color: #ffcc00;
  font-weight: bold;
}

/* 表格行 */
.time-row {
  display: flex;
  width: 100%;
  margin-bottom: 5px;
}

.time-cell {
  flex: 0 0 calc((100% - 50px) / 7); /* 固定宽度为 (100% - 时间列宽度) / 7 */
  height: 30px;
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
  flex: 0 0 50px; /* 第一列（时间列）宽度 */
  background-color: transparent;
  font-size: 12px;
}

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

/* 响应式布局 */
@media (max-width: 600px) {
  .header-cell {
    font-size: 10px;
    padding: 3px;
  }

  .time-cell {
    height: 20px;
    font-size: 8px;
  }

  .time-cell:first-child {
    flex: 0 0 40px; /* 更小的第一列（时间列）宽度 */
    font-size: 10px;
  }

  .activity-name {
    font-size: 8px;
  }
}

/* 动态调整周视图和月视图的布局 */
.time-table[data-range="week"] .header-cell,
.time-table[data-range="week"] .time-cell {
  flex: 1; /* 周视图下，单元格宽度均匀分布 */
  height: 25px;
}

.time-table[data-range="month"] {
  width: 50%;
  height: 50%;
}

.time-table[data-range="month"] .header-cell,
.time-table[data-range="month"] .time-cell {
  flex: 0 0 calc(100%  / 7); /* 月视图下，单元格宽度固定为 (100% - 时间列宽度) / 7 */
  height: 20px;
  font-size: 8px;
}

.time-table[data-range="month"] .time-cell:first-child {
  flex: 0 0 50px; /* 月视图下，第一列（时间列）宽度 */
  font-size: 10px;
}
</style>
