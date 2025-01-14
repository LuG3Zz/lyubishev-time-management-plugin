<template>
  <div class="time-statistics">
    <h2>时间统计</h2>
    <div class="controls">
      <div class="date-range">
        <label for="startDate">开始日期：</label>
        <input type="date" v-model="startDate" @change="updateChart" />
        <label for="endDate">结束日期：</label>
        <input type="date" v-model="endDate" @change="updateChart" />
      </div>
      <div class="chart-type">
        <label for="chartType">图表类型：</label>
        <select v-model="chartType" @change="updateChart">
          <option value="bar">柱状图</option>
          <option value="pie">饼图</option>
          <option value="line">折线图</option>
        </select>
      </div>
    </div>
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
    <div class="footer">
      <button @click="closeModal">关闭</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';

export default {
  props: {
    cellColors: Object, // 从父组件传递的时间表数据
  },
  setup(props) {
    const chartCanvas = ref(null);
    const startDate = ref(new Date().toISOString().split('T')[0]); // 默认开始日期为当天
    const endDate = ref(new Date().toISOString().split('T')[0]); // 默认结束日期为当天
    const chartType = ref('bar'); // 默认图表类型为柱状图
    let chartInstance = null;

    // 根据时间段生成统计数据
    const generateStatistics = (start, end) => {
      const activities = {};
      const startDateObj = new Date(start);
      const endDateObj = new Date(end);

      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        const dayData = props.cellColors[dateString];

        if (dayData) {
          dayData.hours.forEach((hour) => {
            if (hour.activity) {
              if (!activities[hour.activity]) {
                activities[hour.activity] = 0;
              }
              activities[hour.activity] += 1; // 每小时的计数
            }
          });
        }
      }

      return {
        labels: Object.keys(activities),
        data: Object.values(activities),
      };
    };

    // 更新图表
    const updateChart = () => {
      const { labels, data } = generateStatistics(startDate.value, endDate.value);

      if (chartInstance) {
        chartInstance.destroy(); // 销毁旧的图表实例
      }

      if (chartCanvas.value) {
        chartInstance = new Chart(chartCanvas.value, {
          type: chartType.value, // 使用用户选择的图表类型
          data: {
            labels: labels,
            datasets: [
              {
                label: '时间花费（小时）',
                data: data,
                backgroundColor: [
                  'rgba(75, 192, 192, 0.2)',
                  'rgba(255, 99, 132, 0.2)',
                  'rgba(54, 162, 235, 0.2)',
                  'rgba(255, 206, 86, 0.2)',
                  'rgba(153, 102, 255, 0.2)',
                ], // 不同颜色
                borderColor: [
                  'rgba(75, 192, 192, 1)',
                  'rgba(255, 99, 132, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: chartType.value === 'pie' ? {} : {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: '小时数',
                },
              },
              x: {
                title: {
                  display: true,
                  text: '活动',
                },
              },
            },
          },
        });
      }
    };

    // 初始化图表
    onMounted(() => {
      updateChart();
    });

    // 监听日期和图表类型变化
    watch([startDate, endDate, chartType], () => {
      updateChart();
    });

    return {
      chartCanvas,
      startDate,
      endDate,
      chartType,
      updateChart,
    };
  },
};
</script>

<style scoped>
.time-statistics {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* 垂直居中 */
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

.chart-container {
  width: 80%;
  height: 60%;
  margin: 20px 0;
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
}

.footer {
  margin-top: 20px; /* 关闭按钮与图表之间的间距 */
}

.controls button {
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
}
</style>