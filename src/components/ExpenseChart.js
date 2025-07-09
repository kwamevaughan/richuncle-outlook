import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ExpenseChart({ expenses, dateRange }) {
  const [chartData, setChartData] = useState({
    series: [],
    options: {}
  });

  useEffect(() => {
    if (!expenses || expenses.length === 0) {
      setChartData({
        series: [{
          name: 'Expenses',
          data: []
        }],
        options: {
          chart: {
            type: 'area',
            height: 350,
            toolbar: {
              show: false
            }
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'smooth',
            width: 2
          },
          colors: ['#3B82F6'],
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.7,
              opacityTo: 0.3,
              stops: [0, 90, 100]
            }
          },
          xaxis: {
            categories: []
          },
          yaxis: {
            labels: {
              formatter: function (val) {
                return 'GHS ' + val.toFixed(2);
              }
            }
          },
          tooltip: {
            y: {
              formatter: function (val) {
                return 'GHS ' + val.toFixed(2);
              }
            }
          }
        }
      });
      return;
    }

    // Group expenses by date
    const expensesByDate = {};
    expenses.forEach(expense => {
      const date = new Date(expense.expense_date).toLocaleDateString();
      if (!expensesByDate[date]) {
        expensesByDate[date] = 0;
      }
      expensesByDate[date] += parseFloat(expense.amount || 0);
    });

    // Sort dates and create chart data
    const sortedDates = Object.keys(expensesByDate).sort((a, b) => new Date(a) - new Date(b));
    const amounts = sortedDates.map(date => expensesByDate[date]);

    setChartData({
      series: [{
        name: 'Expenses',
        data: amounts
      }],
      options: {
        chart: {
          type: 'area',
          height: 350,
          toolbar: {
            show: false
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: 2
        },
        colors: ['#3B82F6'],
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.3,
            stops: [0, 90, 100]
          }
        },
        xaxis: {
          categories: sortedDates
        },
        yaxis: {
          labels: {
            formatter: function (val) {
              return 'GHS ' + val.toFixed(2);
            }
          }
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return 'GHS ' + val.toFixed(2);
            }
          }
        }
      }
    });
  }, [expenses, dateRange]);

  if (!expenses || expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Expense Trends</h3>
          <Icon icon="mdi:chart-line" className="w-6 h-6 text-blue-500" />
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Icon icon="mdi:chart-line" className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No expense data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Expense Trends</h3>
        <Icon icon="mdi:chart-line" className="w-6 h-6 text-blue-500" />
      </div>
      <Chart
        options={chartData.options}
        series={chartData.series}
        type="area"
        height={350}
      />
    </div>
  );
} 