const url = 'https://io.adafruit.com/api/v2/johnnynuss10/feeds/johnnyfeed/data/';

// Get the node parameter from URL
const urlParams = new URLSearchParams(window.location.search);
const selectedNode = urlParams.get('node');

// Update page title based on selected node
if (selectedNode) {
  const titleElement = document.getElementById('page-title');
  if (titleElement) {
    titleElement.textContent = `John Temps - Node ${selectedNode}`;
  }
}

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

// Parse the value field to extract temperature and node
function parseValue(valueString) {
  const parts = valueString.split(',');
  return {
    temperature: parseFloat(parts[0]),
    node: parseInt(parts[1])
  };
}

// Convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius) {
  return celsius * 9 / 5 + 32;
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
  const values = items.map(item => parseValue(item.value).temperature);
  const min = celsiusToFahrenheit(Math.min(...values));
  const max = celsiusToFahrenheit(Math.max(...values));
  const avgC = values.reduce((a, b) => a + b, 0) / values.length;
  const avg = celsiusToFahrenheit(avgC);
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
          <th>Date / Temperature</th>
          <th>Node</th>
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
        <td colspan="4">
          <span class="expand-btn">+</span>
          <span class="date-label">${dateKey}</span>
          <span class="date-stats">
            <span>${stats.count} reading${stats.count !== 1 ? 's' : ''}</span>
            <span>Min: ${stats.min.toFixed(1)}°F</span>
            <span>Max: ${stats.max.toFixed(1)}°F</span>
            <span>Avg: ${stats.avg.toFixed(1)}°F</span>
          </span>
        </td>
      </tr>
    `;

    // Individual data rows (hidden by default)
    items.forEach(item => {
      const parsed = parseValue(item.value);
      const tempF = celsiusToFahrenheit(parsed.temperature);
      html += `
        <tr class="data-row" data-date-group="${dateKey}">
          <td class="value-cell">${tempF.toFixed(1)} °F</td>
          <td>${parsed.node}</td>
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
    const parsed = parseValue(latest.value);
    const tempF = celsiusToFahrenheit(parsed.temperature);
    currentValueEl.textContent = `${tempF.toFixed(1)} °F`;
    currentTimeEl.textContent = `Last updated: ${formatRelativeTime(latest.created_at)}`;
  } else {
    currentValueEl.textContent = '--';
    currentTimeEl.textContent = 'No data available';
  }
}

// Filter data by selected node
function filterDataByNode(data) {
  if (!selectedNode) {
    return data; // Return all data if no node is selected
  }

  return data.filter(item => {
    const parsed = parseValue(item.value);
    return parsed.node === parseInt(selectedNode);
  });
}

// Fetch and display the feed data
function loadFeed() {
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      const filteredData = filterDataByNode(data);
      updateCurrentReading(filteredData);
      document.getElementById('data-table').innerHTML = buildTable(filteredData);
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
