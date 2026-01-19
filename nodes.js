const url = 'https://io.adafruit.com/api/v2/johnnynuss10/feeds/johnnyfeed/data/';

// Extract node identifier from data item
// The node could be stored in different ways:
// 1. As a separate 'node' field
// 2. Encoded in the value (e.g., "3:25.5" or "3,25.5")
// 3. As metadata
function extractNode(item) {
  // Check if there's a direct node field
  if (item.node !== undefined) {
    return item.node;
  }

  // Check if node is in metadata
  if (item.metadata && item.metadata.node !== undefined) {
    return item.metadata.node;
  }

  // Try to extract from value if it's formatted like "node:value" or "node,value"
  const value = String(item.value);

  // Pattern: "3:25.5" or "3,25.5"
  const colonMatch = value.match(/^(\d+)[:]/);
  if (colonMatch) {
    return colonMatch[1];
  }

  const commaMatch = value.match(/^(\d+),/);
  if (commaMatch) {
    return commaMatch[1];
  }

  // Check if there's a feed_key or other identifier
  if (item.feed_key) {
    const nodeMatch = item.feed_key.match(/node[_-]?(\d+)/i);
    if (nodeMatch) {
      return nodeMatch[1];
    }
  }

  // Default: assume single node system
  return '3'; // Based on user saying node 3 is the default
}

// Get unique nodes from data
function getUniqueNodes(data) {
  const nodes = new Set();
  data.forEach(item => {
    const node = extractNode(item);
    nodes.add(node);
  });
  return Array.from(nodes).sort();
}

// Count readings per node
function countReadingsByNode(data, node) {
  return data.filter(item => extractNode(item) === node).length;
}

// Get latest reading for a node
function getLatestReading(data, node) {
  const nodeData = data.filter(item => extractNode(item) === node);
  if (nodeData.length > 0) {
    // Extract actual temperature value
    const item = nodeData[0];
    const value = String(item.value);
    // If value contains node prefix, extract just the temperature
    const tempMatch = value.match(/[\d.]+$/);
    return tempMatch ? tempMatch[0] : value;
  }
  return 'N/A';
}

// Build the nodes display
function displayNodes(data) {
  const nodesListEl = document.getElementById('nodes-list');

  if (!data || data.length === 0) {
    nodesListEl.innerHTML = '<p class="error">No data available</p>';
    return;
  }

  const nodes = getUniqueNodes(data);

  if (nodes.length === 0) {
    nodesListEl.innerHTML = '<p class="error">No nodes found</p>';
    return;
  }

  let html = '<div class="nodes-grid">';

  nodes.forEach(node => {
    const readingCount = countReadingsByNode(data, node);
    const latestTemp = getLatestReading(data, node);

    html += `
      <a href="feed.html?node=${node}" class="node-card">
        <div class="node-icon">&#127777;</div>
        <div class="node-title">Node ${node}</div>
        <div class="node-info">${readingCount} readings</div>
        <div class="node-info">Latest: ${latestTemp}°C</div>
      </a>
    `;
  });

  html += '</div>';
  nodesListEl.innerHTML = html;
}

// Load nodes from feed
function loadNodes() {
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      displayNodes(data);
    })
    .catch(err => {
      console.error('Error fetching nodes:', err);
      document.getElementById('nodes-list').innerHTML =
        '<p class="error">Error loading nodes. Please try again later.</p>';
    });
}

// Initial load
loadNodes();
