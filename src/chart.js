const QUICKCHART_BASE = 'https://quickchart.io/chart';

function buildChartUrl(item) {
  const history = (item.priceHistory || []).slice(-30); // last 30 data points
  const labels = history.map((h) =>
    new Date(h.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  );
  const data = history.map((h) => h.price);

  const config = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: item.title,
          data,
          fill: false,
          borderColor: 'rgb(255, 99, 71)',
          backgroundColor: 'rgb(255, 99, 71)',
          tension: 0.2,
        },
      ],
    },
    options: {
      title: { display: true, text: `Price History — ${item.title}`.slice(0, 60) },
      legend: { display: false },
      scales: {
        yAxes: [{ ticks: { beginAtZero: false } }],
      },
    },
  };

  const encoded = encodeURIComponent(JSON.stringify(config));
  return `${QUICKCHART_BASE}?width=600&height=350&backgroundColor=white&c=${encoded}`;
}

module.exports = { buildChartUrl };
