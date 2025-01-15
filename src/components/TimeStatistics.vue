<template>
  <div class="time-statistics">
    <h2>Time Statistics</h2>
    <div class="controls">
      <div class="date-range">
        <label for="startDate">Start Date:</label>
        <input type="date" v-model="startDate" @change="updateChart" />
        <label for="endDate">End Date:</label>
        <input type="date" v-model="endDate" @change="updateChart" />
      </div>
      <div class="chart-type">
        <label for="chartType">Chart Type:</label>
        <select v-model="chartType" @change="updateChart">
          <option value="bar">Bar Chart</option>
          <option value="pie">Pie Chart</option>
          <option value="line">Line Chart</option>
        </select>
      </div>
      <div class="data-type">
        <label for="dataType">Group By:</label>
        <select v-model="dataType" @change="updateChart">
          <option value="activity">By Activity</option>
          <option value="category">By Category</option>
        </select>
      </div>
    </div>
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
      <p v-if="noData" class="no-data-message">No data available for the selected date range.</p>
    </div>
    <div class="footer">
      <button @click="closeModal">Close</button>
      <button @click="switchToTable">Switch to Table</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';

export default {
  props: {
    cellColors: Object, // 从父组件传递的时间表数据
    onClose: Function, // 父组件传递的关闭模态框的函数
    onSwitchToTable: Function, // 父组件传递的切换到表格模态框的函数
  },
  setup(props) {
    const chartCanvas = ref(null);
    const startDate = ref(new Date().toISOString().split('T')[0]); // 默认开始日期为当天
    const endDate = ref(new Date().toISOString().split('T')[0]); // 默认结束日期为当天
    const chartType = ref('bar'); // 默认图表类型为柱状图
    const dataType = ref('activity'); // 默认按活动分组
    const noData = ref(false); // 是否没有数据
    let chartInstance = null;

    // 预定义颜色列表
    const colors = [
      'rgba(75, 192, 192, 0.2)',
      'rgba(255, 99, 132, 0.2)',
      'rgba(54, 162, 235, 0.2)',
      'rgba(255, 206, 86, 0.2)',
      'rgba(153, 102, 255, 0.2)',
      'rgba(255, 159, 64, 0.2)',
      'rgba(199, 199, 199, 0.2)',
      'rgba(83, 102, 255, 0.2)',
      'rgba(255, 99, 132, 0.2)',
      'rgba(54, 162, 235, 0.2)',
    ];

    // 根据时间段生成统计数据
    const generateStatistics = (start, end) => {
      const activities = {}; // 按活动统计
      const categories = {}; // 按分类统计
      const dates = []; // 所有日期

      const startDateObj = new Date(start);
      const endDateObj = new Date(end);

      // 生成日期范围
      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        dates.push(dateString);

        const dayData = props.cellColors[dateString];
        if (dayData) {
          dayData.hours.forEach((hour) => {
            if (hour.activity) {
              // 按活动统计
              if (!activities[hour.activity]) {
                activities[hour.activity] = {};
              }
              if (!activities[hour.activity][dateString]) {
                activities[hour.activity][dateString] = 0;
              }
              activities[hour.activity][dateString] += 1;

              // 按分类统计
              if (hour.category) {
                if (!categories[hour.category]) {
                  categories[hour.category] = {};
                }
                if (!categories[hour.category][dateString]) {
                  categories[hour.category][dateString] = 0;
                }
                categories[hour.category][dateString] += 1;
              }
            }
          });
        }
      }

      return {
        dates,
        activities,
        categories,
      };
    };

    // 更新图表
    const updateChart = () => {
      const { dates, activities, categories } = generateStatistics(startDate.value, endDate.value);

      // 检查是否有数据
      if (Object.keys(activities).length === 0 && Object.keys(categories).length === 0) {
        noData.value = true;
        if (chartInstance) {
          chartInstance.destroy(); // 销毁旧的图表实例
          chartInstance = null;
        }
        return;
      } else {
        noData.value = false;
      }

      let labels = [];
      let datasets = [];

      if (chartType.value === 'line') {
        // 折线图逻辑
        labels = dates; // X 轴为日期

        if (dataType.value === 'activity') {
          // 按活动分组
          for (const [activity, data] of Object.entries(activities)) {
            datasets.push({
              label: activity,
              data: dates.map((date) => data[date] || 0), // 如果某天没有该活动，设置为 0
              borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // 随机颜色
              fill: false,
            });
          }
        } else if (dataType.value === 'category') {
          // 按分类分组
          for (const [category, data] of Object.entries(categories)) {
            datasets.push({
              label: category,
              data: dates.map((date) => data[date] || 0), // 如果某天没有该分类，设置为 0
              borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // 随机颜色
              fill: false,
            });
          }
        }
      } else {
        // 饼图和柱状图逻辑
        if (dataType.value === 'activity') {
          labels = Object.keys(activities);
          datasets = [
            {
              label: 'Time Spent (Hours)',
              data: Object.values(activities).map((data) => {
                return Object.values(data).reduce((sum, val) => sum + val, 0);
              }),
              backgroundColor: colors.slice(0, labels.length), // 使用预定义颜色
              borderColor: colors.slice(0, labels.length).map(color => color.replace('0.2', '1')), // 边框颜色
              borderWidth: 1,
            },
          ];
        } else if (dataType.value === 'category') {
          labels = Object.keys(categories);
          datasets = [
            {
              label: 'Time Spent (Hours)',
              data: Object.values(categories).map((data) => {
                return Object.values(data).reduce((sum, val) => sum + val, 0);
              }),
              backgroundColor: colors.slice(0, labels.length), // 使用预定义颜色
              borderColor: colors.slice(0, labels.length).map(color => color.replace('0.2', '1')), // 边框颜色
              borderWidth: 1,
            },
          ];
        }
      }

      if (chartInstance) {
        chartInstance.destroy(); // 销毁旧的图表实例
      }

      if (chartCanvas.value) {
        chartInstance = new Chart(chartCanvas.value, {
          type: chartType.value, // 使用选择的图表类型
          data: {
            labels: labels,
            datasets: datasets,
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: chartType.value === 'pie' ? {} : {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Hours',
                },
              },
              x: {
                title: {
                  display: true,
                  text: chartType.value === 'line' ? 'Date' : (dataType.value === 'activity' ? 'Activity' : 'Category'),
                },
              },
            },
          },
        });
      }
    };

    // 关闭模态框
    const closeModal = () => {
      if (props.onClose) {
        props.onClose(); // 调用父组件传递的关闭函数
      }
    };

    // 切换到表格模态框
    const switchToTable = () => {
      if (props.onSwitchToTable) {
        props.onSwitchToTable(); // 调用父组件传递的切换函数
      }
    };

    // 初始化图表
    onMounted(() => {
      updateChart();
    });

    // 监听日期、图表类型和数据分组变化
    watch([startDate, endDate, chartType, dataType], () => {
      updateChart();
    });

    return {
      chartCanvas,
      startDate,
      endDate,
      chartType,
      dataType,
      noData,
      updateChart,
      closeModal,
      switchToTable,
    };
  },
};
</script>

<style scoped>
.time-statistics {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  width: 100%;
  height: 100%;
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.date-range {
  display: flex;
  gap: 10px;
  align-items: center;
}

.chart-type {
  display: flex;
  gap: 10px;
  align-items: center;
}

.data-type {
  display: flex;
  gap: 10px;
  align-items: center;
}

.chart-container {
  width: 80%;
  height: 60%;
  margin: 20px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.no-data-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #888;
  font-size: 16px;
}

.footer {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.controls button {
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
}
</style>