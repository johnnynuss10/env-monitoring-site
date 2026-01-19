const url = 'https://io.adafruit.com/api/v2/johnnynuss10/feeds/johnnyfeed/data/';

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Format relative time
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

// Build the data table HTML
function buildTable(data) {
  if (!data || data.length === 0) {
    return '<p class="loading">No data available</p>';
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Value</th>
          <th>Time</th>
          <th>Relative</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach(item => {
    html += `
      <tr>
        <td class="value-cell">${item.value} °C</td>
        <td>${formatDate(item.created_at)}</td>
        <td>${formatRelativeTime(item.created_at)}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  return html;
}

// Update the current reading display
function updateCurrentReading(data) {
  const currentValueEl = document.getElementById('current-value');
  const currentTimeEl = document.getElementById('current-time');

  if (data && data.length > 0) {
    const latest = data[0];
    currentValueEl.textContent = `${latest.value} °C`;
    currentTimeEl.textContent = `Last updated: ${formatRelativeTime(latest.created_at)}`;
  } else {
    currentValueEl.textContent = '--';
    currentTimeEl.textContent = 'No data available';
  }
}

// Fetch and display the feed data
function loadFeed() {
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      updateCurrentReading(data);
      document.getElementById('data-table').innerHTML = buildTable(data);
    })
    .catch(err => {
      console.error('Error fetching data:', err);
      document.getElementById('current-value').textContent = '--';
      document.getElementById('current-time').textContent = '';
      document.getElementById('data-table').innerHTML =
        '<p class="error">Error loading data. Please try again later.</p>';
    });
}

// Initial load
loadFeed();

// Refresh every 30 seconds
setInterval(loadFeed, 30000);
