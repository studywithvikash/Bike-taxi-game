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

      clearInterval(bikeAnimation);

      bikeMarker.setLatLng(points[points.length - 1]);

      document.getElementById("status").innerText =
        "🎉 Ride completed! Passenger destination पर पहुंच गया।";

      startRideBtn.disabled = false;

      return;
    }


    bikeMarker.setLatLng(points[index]);

  }, speed);

}
