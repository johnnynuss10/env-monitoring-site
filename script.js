// Convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius) {
  return celsius * 9 / 5 + 32;
}

// ---- Live Data page (feed.html) - AWS device lookup ----
(function initFeedPage() {
  const submitButton = document.getElementById('submitButton');
  if (!submitButton) return;

  const apiUrl = 'https://h96c190k3i.execute-api.us-east-1.amazonaws.com/POST';

  let currentDeviceId = null;
  let refreshInterval = null;

  // Format relative time from a UTC millisecond timestamp
  function formatRelativeTime(timeUTC) {
    const date = new Date(Number(timeUTC));
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

  // Fetch and display the current reading for a device
  async function displayCustomText(deviceId) {
    const currentValueEl = document.getElementById('current-value');
    const currentTimeEl = document.getElementById('current-time');

    const payload = {
      name: deviceId
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const result = await response.json();
      const telemetry = result.device.latest_telemetry;
      const tempF = celsiusToFahrenheit(parseFloat(telemetry.tempC));

      currentValueEl.textContent = `${tempF.toFixed(1)} °F`;
      currentTimeEl.textContent = `Last updated: ${formatRelativeTime(telemetry.timeUTC)}`;
    } catch (error) {
      console.error(error);
      currentValueEl.textContent = '--';
      currentTimeEl.textContent = 'Error loading data. Please check the device ID and try again.';
    }
  }

  submitButton.addEventListener('click', function () {
    const msgOut = document.getElementById('deviceIdFromForm').value.trim();
    if (!msgOut) return;

    currentDeviceId = msgOut;
    displayCustomText(currentDeviceId);

    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => displayCustomText(currentDeviceId), 30000);
  });
})();

// ---- Select Node page (select-node.html) - Adafruit historical feed ----
(function initSelectNodePage() {
  const nodesContainer = document.getElementById('nodes-container');
  if (!nodesContainer) return;

  const url = 'https://io.adafruit.com/api/v2/johnnynuss10/feeds/johnnyfeed/data/';

  // Parse the value field to extract temperature and node
  function parseValue(valueString) {
    const parts = valueString.split(',');
    return {
      temperature: parseFloat(parts[0]),
      node: parseInt(parts[1])
    };
  }

  // Get unique nodes and their stats from the data
  function extractNodes(data) {
    const nodesMap = new Map();

    data.forEach(item => {
      const parsed = parseValue(item.value);
      const nodeId = parsed.node;

      if (!nodesMap.has(nodeId)) {
        nodesMap.set(nodeId, {
          id: nodeId,
          readings: [],
          lastReading: null
        });
      }

      const nodeData = nodesMap.get(nodeId);
      nodeData.readings.push(parsed.temperature);

      // Track the most recent reading
      if (!nodeData.lastReading || new Date(item.created_at) > new Date(nodeData.lastReading.time)) {
        nodeData.lastReading = {
          temperature: parsed.temperature,
          time: item.created_at
        };
      }
    });

    return Array.from(nodesMap.values()).sort((a, b) => a.id - b.id);
  }

  // Calculate stats for a node
  function calculateNodeStats(readings) {
    if (readings.length === 0) return null;

    const min = Math.min(...readings);
    const max = Math.max(...readings);
    const avg = readings.reduce((a, b) => a + b, 0) / readings.length;

    return { min, max, avg, count: readings.length };
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
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  // Build the nodes grid HTML
  function buildNodesGrid(nodes) {
    let html = '<div class="nodes-grid">';

    // Add "All Nodes" option
    html += `
      <a href="feed.html" class="node-card all-nodes-card">
        <div class="node-icon">&#127760;</div>
        <div class="node-title">All Nodes</div>
        <div class="node-stats">View all temperature data</div>
      </a>
    `;

    // Add individual node cards
    nodes.forEach(node => {
      const stats = calculateNodeStats(node.readings);
      const lastTemp = node.lastReading ? celsiusToFahrenheit(node.lastReading.temperature).toFixed(1) : '--';
      const lastTime = node.lastReading ? formatRelativeTime(node.lastReading.time) : '';

      html += `
        <a href="feed.html?node=${node.id}" class="node-card">
          <div class="node-icon">&#128225;</div>
          <div class="node-title">Node ${node.id}</div>
          <div class="node-stats">
            ${lastTemp}°F ${lastTime}<br>
            ${stats.count} readings
          </div>
        </a>
      `;
    });

    html += '</div>';
    return html;
  }

  // Fetch and display nodes
  function loadNodes() {
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        const nodes = extractNodes(data);

        if (nodes.length === 0) {
          nodesContainer.innerHTML =
            '<p class="loading">No nodes found in the data</p>';
        } else {
          nodesContainer.innerHTML = buildNodesGrid(nodes);
        }
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        nodesContainer.innerHTML =
          '<p class="error">Error loading nodes. Please try again later.</p>';
      });
  }

  loadNodes();
})();
