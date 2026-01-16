const url = `https://io.adafruit.com/johnnynuss10/feeds/johnnyfeed/data/last`;

// Function to fetch and display the latest value
function loadFeed() {
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then(data => {
      document.getElementById("temp").textContent = `${data.value} °C`;
    })
    .catch(err => {
      console.error(err);
      document.getElementById("temp").textContent = "Error loading data";
    });
}

// Initial load
loadFeed();

// Refresh every 30 seconds
setInterval(loadFeed, 30000);