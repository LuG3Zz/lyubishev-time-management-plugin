<template>
  <div class="time-table">
    <div class="header-row">
      <div class="header-cell"></div>
      <div
        v-for="(day, dayIndex) in weekDays"
        :key="dayIndex"
        class="header-cell"
      >
        <div>{{ day.date }}</div>
        <div>{{ day.weekday }}</div>
      </div>
    </div>

    <!-- 表格行，显示每个小时的时间段 -->
    <div v-for="(hour, hourIndex) in hours" :key="hourIndex" class="time-row">
      <div class="time-cell">{{ hour }}</div>
      <div
        v-for="(day, dayIndex) in weekDays"
        :key="dayIndex"
        class="time-cell"
        :style="{ backgroundColor: day.hours[hourIndex].color, color: getFontColor(day.hours[hourIndex].color) }"
        @click="changeCellColor(day.date, hourIndex)"
      >
        <!-- 将活动名称包装在一个 div 中，默认隐藏 -->
        <div class="activity-name">{{ day.hours[hourIndex].activity }}</div>
      </div>
    </div>
    
    <!-- 颜色选择器和活动名称输入框 -->
    <div class="color-picker">
      <input type="color" v-model="colorPicker" />
      <input type="text" v-model="activityName" placeholder="Enter activity name" />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  props: {
    cellColors: Object,
    saveCellColors: Function,
  },
  data() {
    return {
      hours: Array.from({ length: 24 }, (_, i) => `${i}:00`), // 24小时
      colorPicker: '#ffffff', // 默认颜色选择器的颜色
      activityName: '', // 用户输入的活动名称
    };
  },
  computed: {
    // 当前一周的日期和星期
    weekDays() {
      return Object.values(this.cellColors);
    },
  },
  methods: {
    // 选择颜色后更新单元格颜色
    changeCellColor(date, hourIndex) {
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
      // 获取背景色的 RGB 值
      const hex = backgroundColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      // 计算亮度
      const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      // 如果亮度较低，字体使用白色；亮度较高，字体使用黑色
      return brightness < 128 ? '#ffffff' : '#e4113b';
    },
  },
};
</script>

<style scoped>
.time-table-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  height: 100vh; /* 使页面在垂直方向上居中 */
  margin: 0;
}

.header-row {
  display: flex;
  background-color: transparent; /* 表头栏背景透明 */
  width: auto; /* 自动适应宽度 */
  text-align: center;
  margin-bottom: 20px; /* 表头与时间行之间的间隙 */
}

.header-cell {
  width: 40px; /* 设置表头单元格为正方形 */
  height: 40px; /* 设置表头单元格为正方形 */
  text-align: center;
  background-color: transparent; /* 表头单元格背景透明 */
  border: none; /* 去除边框 */
  margin-right: 10px; /* 单元格间隔 */
}

.time-row {
  display: flex;
  width: auto; /* 自动适应宽度 */
  margin-bottom: 5px; /* 每行之间的间隙 */
}

.time-cell {
  width: 20px; /* 固定宽度，确保为正方形 */
  height: 20px; /* 固定高度，确保为正方形 */
  text-align: center;
  cursor: pointer;
  background-color: #ffffff; /* 默认背景为白色 */
  border: 1px solid transparent; /* 透明边框 */
  margin-right: 14px; /* 单元格间隔 */
  margin-left: 15px; /* 单元格间隔 */
  margin-bottom: 3px; /* 单元格上下间隔 */
  font-size: 10px; /* 设置字体大小 */
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  border-radius: 5px; /* 添加圆角 */
  position: relative; /* 允许子元素（活动名称）使用 z-index */
}

.time-cell:first-child {
  background-color: transparent; /* 首列没有背景颜色 */
  font-size: 14px; /* 保持第一列字体正常大小 */
}

.time-cell:hover .activity-name {
  display: block; /* 鼠标悬停时显示活动信息 */
}

.activity-name {
  display: none; /* 默认隐藏活动信息 */
  font-size: 20px; /* 设置活动信息字体大小 */
  text-align: center;
  z-index: 10; /* 确保活动名称显示在最顶层 */
  position: absolute; /* 绝对定位 */
}

.time-cell:hover {
  background-color: #e0e0e0;
}

.color-picker {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
  position: relative;
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
</style>
