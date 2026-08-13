// ===============================
// 🏍️ BIKE TAXI GAME - STEP 4
// OpenStreetMap + OSRM Routing
// ===============================

let map;
let pickupMarker = null;
let destinationMarker = null;
let routeLine = null;

let currentMode = "pickup";

// ===============================
// MAP START
// ===============================

map = L.map("map").setView([26.9124, 75.7873], 13);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }
).addTo(map);


// ===============================
// CUSTOM MARKERS
// ===============================

const pickupIcon = L.divIcon({
  className: "custom-marker",
  html: "📍",
  iconSize: [35, 35],
  iconAnchor: [17, 35]
});

const destinationIcon = L.divIcon({
  className: "custom-marker",
  html: "🏁",
  iconSize: [35, 35],
  iconAnchor: [17, 35]
});


// ===============================
// MAP CLICK
// ===============================

map.on("click", function (e) {

  const lat = e.latlng.lat;
  const lng = e.latlng.lng;

  // ---------------------------
  // PICKUP
  // ---------------------------

  if (currentMode === "pickup") {

    if (pickupMarker) {
      map.removeLayer(pickupMarker);
    }

    pickupMarker = L.marker(
      [lat, lng],
      { icon: pickupIcon }
    )
      .addTo(map)
      .bindPopup("📍 Pickup Location")
      .openPopup();

    document.getElementById("status").innerText =
      "Pickup set ✅ अब Destination चुनें";

    currentMode = "destination";

    return;
  }


  // ---------------------------
  // DESTINATION
  // ---------------------------

  if (currentMode === "destination") {

    if (destinationMarker) {
      map.removeLayer(destinationMarker);
    }

    destinationMarker = L.marker(
      [lat, lng],
      { icon: destinationIcon }
    )
      .addTo(map)
      .bindPopup("🏁 Destination")
      .openPopup();

    document.getElementById("status").innerText =
      "Destination set ✅ Route बना रहे हैं...";

    currentMode = "pickup";

    // Create road route
    createRoute();

  }

});


// ===============================
// PICKUP BUTTON
// ===============================

document
  .getElementById("pickupBtn")
  .addEventListener("click", function () {

    currentMode = "pickup";

    document.getElementById("status").innerText =
      "Map पर Pickup location चुनें 📍";

  });


// ===============================
// DESTINATION BUTTON
// ===============================

document
  .getElementById("destinationBtn")
  .addEventListener("click", function () {

    if (!pickupMarker) {

      document.getElementById("status").innerText =
        "पहले Pickup location चुनें 📍";

      return;
    }

    currentMode = "destination";

    document.getElementById("status").innerText =
      "Map पर Destination चुनें 🏁";

  });


// ===============================
// CREATE ROAD ROUTE
// ===============================

async function createRoute() {

  if (!pickupMarker || !destinationMarker) {
    return;
  }

  const pickup = pickupMarker.getLatLng();
  const destination = destinationMarker.getLatLng();

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${pickup.lng},${pickup.lat};` +
    `${destination.lng},${destination.lat}` +
    `?overview=full&geometries=geojson`;


  try {

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Routing server error");
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes.length) {

      document.getElementById("status").innerText =
        "Route नहीं मिला ❌";

      return;
    }


    // Remove old route
    if (routeLine) {
      map.removeLayer(routeLine);
    }


    const route = data.routes[0];

    // Convert GeoJSON coordinates
    const coordinates =
      route.geometry.coordinates.map(function (point) {

        return [point[1], point[0]];

      });


    // Draw route
    routeLine = L.polyline(
      coordinates,
      {
        weight: 6,
        opacity: 0.85
      }
    ).addTo(map);


    // Zoom route
    map.fitBounds(routeLine.getBounds(), {
      padding: [40, 40]
    });


    // Distance
    const distanceKm =
      (route.distance / 1000).toFixed(2);


    // Time
    const durationMin =
      Math.ceil(route.duration / 60);


    // Fare
    const fare =
      Math.max(
        30,
        Math.round(20 + distanceKm * 12)
      );


    document.getElementById("status").innerText =
      `Route ready 🛣️ ${distanceKm} km • ${durationMin} min • ₹${fare}`;
    enableStartRide();

  }

  catch (error) {

    console.error(error);

    document.getElementById("status").innerText =
      "Route बनाने में समस्या हुई ❌";

  }

}
// ===============================
// STEP 5 - BIKE MOVEMENT
// ===============================

let bikeMarker = null;
let bikeAnimation = null;

const startRideBtn =
  document.getElementById("startRideBtn");


// Bike icon
const bikeIcon = L.divIcon({
  className: "bike-marker",
  html: "🏍️",
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});


// Enable Start Ride after route is ready
function enableStartRide() {
  startRideBtn.disabled = false;
}


// Start Ride button
startRideBtn.addEventListener("click", function () {

  if (!routeLine) {
    return;
  }

  startRideBtn.disabled = true;

  document.getElementById("status").innerText =
    "🏍️ Ride started...";

  startBikeRide();
});


// Start bike animation
function startBikeRide() {

  const points = routeLine.getLatLngs();

  if (!points || points.length < 2) {
    return;
  }

  // Remove old bike
  if (bikeMarker) {
    map.removeLayer(bikeMarker);
  }

  // Put bike at pickup
  bikeMarker = L.marker(
    points[0],
    {
      icon: bikeIcon,
      zIndexOffset: 1000
    }
  ).addTo(map);


  let index = 0;

  const speed = 80; // milliseconds

  bikeAnimation = setInterval(function () {

    index++;

    if (index >= points.length) {

  bikeMarker.setLatLng(points[points.length - 1]);

  completeRide();

  return;
    }

    bikeMarker.setLatLng(points[index]);
const progress =
  (index / (points.length - 1)) * 100;

updateProgress(progress);
  }, speed);

}
// ===============================
// STEP 6 - RIDE SYSTEM
// ===============================

const rideCard =
  document.getElementById("rideCard");

const acceptRideBtn =
  document.getElementById("acceptRideBtn");

const rideStatus =
  document.getElementById("rideStatus");

const distanceText =
  document.getElementById("distanceText");

const fareText =
  document.getElementById("fareText");

const timeText =
  document.getElementById("timeText");

let rideAccepted = false;


// Accept Ride
acceptRideBtn.addEventListener("click", function () {

  if (!routeLine) {

    document.getElementById("status").innerText =
      "पहले Pickup और Destination select करें 📍";

    return;
  }

  rideAccepted = true;

  rideStatus.innerText = "Accepted ✅";

  acceptRideBtn.innerText =
    "🏍️ Ride Accepted";

  acceptRideBtn.disabled = true;

  document.getElementById("status").innerText =
    "Passenger ने ride accept कर ली ✅";

  startRideBtn.disabled = false;
});
// ===============================
// STEP 7 - WALLET & PROGRESS
// ===============================

const progressFill =
  document.getElementById("progressFill");

const progressPercent =
  document.getElementById("progressPercent");

const walletAmount =
  document.getElementById("walletAmount");

const nextRideBtn =
  document.getElementById("nextRideBtn");

let wallet = 0;
let currentFare = 0;


// Update wallet display
function updateWallet() {
  walletAmount.innerText = wallet.toFixed(0);
}


// Set fare from route
function setRideFare(fare) {

  currentFare = Number(fare);

  fareText.innerText =
    `₹${currentFare}`;

}


// Update ride progress
function updateProgress(percent) {

  percent = Math.min(100, Math.max(0, percent));

  progressFill.style.width =
    `${percent}%`;

  progressPercent.innerText =
    `${Math.round(percent)}%`;

}


// Complete ride
function completeRide() {

  clearInterval(bikeAnimation);

  updateProgress(100);

  wallet += currentFare;

  updateWallet();

  rideStatus.innerText =
    "Completed 🎉";

  document.getElementById("status").innerText =
    `🎉 Ride completed! ₹${currentFare} wallet में add हुए।`;

  acceptRideBtn.hidden = true;

  nextRideBtn.hidden = false;

}


// Next ride
nextRideBtn.addEventListener("click", function () {

  if (bikeMarker) {
    map.removeLayer(bikeMarker);
    bikeMarker = null;
  }

  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  if (pickupMarker) {
    map.removeLayer(pickupMarker);
    pickupMarker = null;
  }

  if (destinationMarker) {
    map.removeLayer(destinationMarker);
    destinationMarker = null;
  }

  rideAccepted = false;

  acceptRideBtn.hidden = false;
  acceptRideBtn.disabled = false;
  acceptRideBtn.innerText = "✅ Accept Ride";

  nextRideBtn.hidden = true;

  rideStatus.innerText = "Waiting";

  distanceText.innerText = "-- km";
  fareText.innerText = "₹--";
  timeText.innerText = "-- min";

  updateProgress(0);

  startRideBtn.disabled = true;

  currentMode = "pickup";

  document.getElementById("status").innerText =
    "नई ride के लिए Pickup location चुनें 📍";

});
