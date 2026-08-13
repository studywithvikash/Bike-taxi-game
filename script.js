// ===============================
// BIKE TAXI GAME - SCRIPT
// ===============================

let map;
let pickupMarker = null;
let destinationMarker = null;

let currentMode = "pickup";

// -------------------------------
// Map Start
// -------------------------------

map = L.map("map").setView([26.9124, 75.7873], 13);

// OpenStreetMap tiles
L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }
).addTo(map);

// -------------------------------
// Map Click
// -------------------------------

map.on("click", function (e) {

  const lat = e.latlng.lat;
  const lng = e.latlng.lng;

  if (currentMode === "pickup") {

    // Remove old pickup marker
    if (pickupMarker) {
      map.removeLayer(pickupMarker);
    }

    pickupMarker = L.marker([lat, lng])
      .addTo(map)
      .bindPopup("📍 Pickup Location")
      .openPopup();

    document.getElementById("status").innerText =
      "Pickup set ✅ अब Destination select करें";

    currentMode = "destination";

  } else {

    // Remove old destination marker
    if (destinationMarker) {
      map.removeLayer(destinationMarker);
    }

    destinationMarker = L.marker([lat, lng])
      .addTo(map)
      .bindPopup("🏁 Destination")
      .openPopup();

    document.getElementById("status").innerText =
      "Destination set ✅ Ride शुरू करने के लिए तैयार";

    currentMode = "pickup";
  }

});

// -------------------------------
// Pickup Button
// -------------------------------

document.getElementById("pickupBtn").addEventListener("click", function () {

  currentMode = "pickup";

  document.getElementById("status").innerText =
    "अब map पर Pickup location चुनें 📍";

});

// -------------------------------
// Destination Button
// -------------------------------

document.getElementById("destinationBtn").addEventListener("click", function () {

  if (!pickupMarker) {

    document.getElementById("status").innerText =
      "पहले Pickup location चुनें 📍";

    return;
  }

  currentMode = "destination";

  document.getElementById("status").innerText =
    "अब map पर Destination चुनें 🏁";

});
