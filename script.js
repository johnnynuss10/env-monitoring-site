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

// Format date for grouping (just the date part)
function formatDateKey(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Format time only (no date)
function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Group data by date
function groupByDate(data) {
  const groups = {};
  data.forEach(item => {
    const dateKey = formatDateKey(item.created_at);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });
  return groups;
}

// Calculate stats for a group of readings
function calculateStats(items) {
  const values = items.map(item => parseFloat(item.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { min, max, avg, count: items.length };
}

// Toggle visibility of data rows for a date group
function toggleDateGroup(dateKey) {
  const header = document.querySelector(`[data-date="${dateKey}"]`);
  const rows = document.querySelectorAll(`[data-date-group="${dateKey}"]`);
  const isExpanded = header.classList.contains('expanded');

  if (isExpanded) {
    header.classList.remove('expanded');
    rows.forEach(row => row.classList.remove('visible'));
  } else {
    header.classList.add('expanded');
    rows.forEach(row => row.classList.add('visible'));
  }
}

// Build the data table HTML with collapsible date groups
function buildTable(data) {
  if (!data || data.length === 0) {
    return '<p class="loading">No data available</p>';
  }

  const groups = groupByDate(data);
  const dateKeys = Object.keys(groups);

  let html = `
    <table>
      <thead>
        <tr>
          <th>Date / Value</th>
          <th>Time</th>
          <th>Relative</th>
        </tr>
      </thead>
      <tbody>
  `;

  dateKeys.forEach(dateKey => {
    const items = groups[dateKey];
    const stats = calculateStats(items);
    const escapedDateKey = dateKey.replace(/'/g, "\\'");

    // Date group header row
    html += `
      <tr class="date-group-header" data-date="${dateKey}" onclick="toggleDateGroup('${escapedDateKey}')">
        <td colspan="3">
          <span class="expand-btn">+</span>
          <span class="date-label">${dateKey}</span>
          <span class="date-stats">
            <span>${stats.count} reading${stats.count !== 1 ? 's' : ''}</span>
            <span>Min: ${stats.min.toFixed(1)}°C</span>
            <span>Max: ${stats.max.toFixed(1)}°C</span>
            <span>Avg: ${stats.avg.toFixed(1)}°C</span>
          </span>
        </td>
      </tr>
    `;

    // Individual data rows (hidden by default)
    items.forEach(item => {
      html += `
        <tr class="data-row" data-date-group="${dateKey}">
          <td class="value-cell">${item.value} °C</td>
          <td>${formatTime(item.created_at)}</td>
          <td>${formatRelativeTime(item.created_at)}</td>
        </tr>
      `;
    });
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
