const apiUrl = 'https://h96c190k3i.execute-api.us-east-1.amazonaws.com/POST';

let currentDeviceId = null;
let refreshInterval = null;

// Convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius) {
  return celsius * 9 / 5 + 32;
}

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

// Wire up the submit button
function printTextBox() {
  document.getElementById('submitButton').addEventListener('click', function () {
    const msgOut = document.getElementById('deviceIdFromForm').value.trim();
    if (!msgOut) return;

    currentDeviceId = msgOut;
    displayCustomText(currentDeviceId);

    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => displayCustomText(currentDeviceId), 30000);
  });
}

printTextBox();
