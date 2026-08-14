// ==========================================
// 🏍️ BIKE TAXI GAME
// OpenStreetMap + Leaflet + OSRM
// ==========================================

// -------------------------------
// VARIABLES
// -------------------------------

let map;
let pickupMarker = null;
let destinationMarker = null;
let routeLine = null;
let bikeMarker = null;

let currentMode = "pickup";
let rideAccepted = false;

let bikeAnimation = null;

let wallet = 0;
let currentFare = 0;


// -------------------------------
// MAP
// -------------------------------

map = L.map("map").setView(
  [26.9124, 75.7873],
  13
);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }
).addTo(map);


// -------------------------------
// ICONS
// -------------------------------

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

const bikeIcon = L.divIcon({
  className: "bike-marker",
  html: `
    <div class="bike-player">
      🏍️
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});


// -------------------------------
// ELEMENTS
// -------------------------------

const status =
  document.getElementById("status");

const pickupBtn =
  document.getElementById("pickupBtn");

const destinationBtn =
  document.getElementById("destinationBtn");

const startRideBtn =
  document.getElementById("startRideBtn");

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

const progressFill =
  document.getElementById("progressFill");

const progressPercent =
  document.getElementById("progressPercent");

const walletAmount =
  document.getElementById("walletAmount");

const nextRideBtn =
  document.getElementById("nextRideBtn");


// -------------------------------
// INITIAL UI
// -------------------------------

acceptRideBtn.disabled = true;
startRideBtn.disabled = true;
nextRideBtn.hidden = true;

walletAmount.innerText = "0";


// -------------------------------
// MAP CLICK
// -------------------------------

map.on("click", function (e) {

  const lat = e.latlng.lat;
  const lng = e.latlng.lng;


  // PICKUP
  if (currentMode === "pickup") {

    if (pickupMarker) {
      map.removeLayer(pickupMarker);
    }

    pickupMarker = L.marker(
      [lat, lng],
      {
        icon: pickupIcon
      }
    )
      .addTo(map)
      .bindPopup("📍 Pickup Location")
      .openPopup();

    status.innerText =
      "Pickup set ✅ अब Destination चुनें";

    currentMode = "destination";

    return;
  }


  // DESTINATION
  if (currentMode === "destination") {

    if (destinationMarker) {
      map.removeLayer(destinationMarker);
    }

    destinationMarker = L.marker(
      [lat, lng],
      {
        icon: destinationIcon
      }
    )
      .addTo(map)
      .bindPopup("🏁 Destination")
      .openPopup();

    status.innerText =
      "Destination set 🏁 Route बना रहे हैं...";

    currentMode = "pickup";

    createRoute();
  }

});


// -------------------------------
// PICKUP BUTTON
// -------------------------------

pickupBtn.addEventListener(
  "click",
  function () {

    currentMode = "pickup";

    status.innerText =
      "Map पर Pickup location चुनें 📍";

  }
);


// -------------------------------
// DESTINATION BUTTON
// -------------------------------

destinationBtn.addEventListener(
  "click",
  function () {

    if (!pickupMarker) {

      status.innerText =
        "पहले Pickup location चुनें 📍";

      return;
    }

    currentMode = "destination";

    status.innerText =
      "Map पर Destination चुनें 🏁";

  }
);


// -------------------------------
// CREATE ROAD ROUTE
// -------------------------------

async function createRoute() {

  if (
    !pickupMarker ||
    !destinationMarker
  ) {
    return;
  }


  const pickup =
    pickupMarker.getLatLng();

  const destination =
    destinationMarker.getLatLng();


  const url =
    "https://router.project-osrm.org/route/v1/driving/" +
    `${pickup.lng},${pickup.lat};` +
    `${destination.lng},${destination.lat}` +
    "?overview=full&geometries=geojson";


  try {

    const response =
      await fetch(url);


    if (!response.ok) {
      throw new Error(
        "Routing server error"
      );
    }


    const data =
      await response.json();


    if (
      data.code !== "Ok" ||
      !data.routes ||
      data.routes.length === 0
    ) {

      status.innerText =
        "Route नहीं मिला ❌";

      return;
    }


    const route =
      data.routes[0];


    // REMOVE OLD ROUTE

    if (routeLine) {
      map.removeLayer(routeLine);
    }


    // ROUTE COORDINATES

    const coordinates =
      route.geometry.coordinates.map(
        function (point) {

          return [
            point[1],
            point[0]
          ];

        }
      );


    // DRAW ROUTE

    routeLine =
      L.polyline(
        coordinates,
        {
          weight: 6,
          opacity: 0.85
        }
      ).addTo(map);


    // FIT ROUTE

    map.fitBounds(
      routeLine.getBounds(),
      {
        padding: [40, 40]
      }
    );


    // DISTANCE

    const distanceKm =
      route.distance / 1000;


    // TIME

    const durationMin =
      Math.ceil(
        route.duration / 60
      );


    // FARE

    const fare =
      Math.max(
        30,
        Math.round(
          20 + distanceKm * 12
        )
      );


    currentFare = fare;


    // UPDATE RIDE CARD

    distanceText.innerText =
      distanceKm.toFixed(2) + " km";

    timeText.innerText =
      durationMin + " min";

    fareText.innerText =
      "₹" + fare;


    // ENABLE ACCEPT

    acceptRideBtn.disabled = false;


    startRideBtn.disabled = true;


    status.innerText =
      `Route ready 🛣️ ${distanceKm.toFixed(2)} km • ${durationMin} min • ₹${fare}`;

  }

  catch (error) {

    console.error(
      "Routing Error:",
      error
    );

    status.innerText =
      "Route बनाने में समस्या हुई ❌";

  }

}


// -------------------------------
// ACCEPT RIDE
// -------------------------------

acceptRideBtn.addEventListener(
  "click",
  function () {

    if (!routeLine) {

      status.innerText =
        "पहले route बनाएं 🛣️";

      return;
    }


    rideAccepted = true;


    rideStatus.innerText =
      "Accepted ✅";


    acceptRideBtn.innerText =
      "🏍️ Ride Accepted";


    acceptRideBtn.disabled =
      true;


    startRideBtn.disabled =
      false;


    status.innerText =
      "Passenger ने ride accept कर ली ✅";

  }
);


// -------------------------------
// START RIDE
// -------------------------------

startRideBtn.addEventListener(
  "click",
  function () {

    if (!routeLine) {

      status.innerText =
        "पहले route बनाएं 🛣️";

      return;
    }


    if (!rideAccepted) {

      status.innerText =
        "पहले Accept Ride करें ✅";

      return;
    }


    startRideBtn.disabled =
      true;


    status.innerText =
      "🏍️ Ride started...";


    startBikeRide();

  }
);


// -------------------------------
// SMOOTH BIKE MOVEMENT
// -------------------------------


function startBikeRide() {

  const points = routeLine.getLatLngs();

  if (!points || points.length < 2) {
    status.innerText = "Bike route नहीं मिला ❌";
    return;
  }

  if (bikeMarker) {
    map.removeLayer(bikeMarker);
  }

  bikeMarker = L.marker(points[0], {
    icon: bikeIcon,
    zIndexOffset: 1000
  }).addTo(map);

  let segment = 0;
  let progress = 0;

  const baseSpeed = 0.02;

  function animateBike() {

    if (segment >= points.length - 1) {

      bikeMarker.setLatLng(
        points[points.length - 1]
      );

      updateProgress(100);
      completeRide();

      return;
    }

    const start = points[segment];
    const end = points[segment + 1];

    // -----------------------------
    // SPEED CONTROL
    // -----------------------------

    progress += baseSpeed * bikeSpeed;

    if (progress >= 1) {
      progress = 0;
      segment++;
    }

    // -----------------------------
    // POSITION
    // -----------------------------

    const lat =
      start.lat +
      (end.lat - start.lat) * progress;

    const lng =
      start.lng +
      (end.lng - start.lng) * progress;

    bikeMarker.setLatLng([lat, lng]);

    // -----------------------------
    // CAMERA
    // -----------------------------

    map.panTo(
      [lat, lng],
      {
        animate: false
      }
    );

    // -----------------------------
    // PROGRESS
    // -----------------------------

    const totalProgress =
      (
        (segment + progress) /
        (points.length - 1)
      ) * 100;

    updateProgress(totalProgress);

    // -----------------------------
    // STEERING VISUAL
    // -----------------------------

    if (steeringDirection !== 0) {

      const bikeElement =
        bikeMarker.getElement();

      if (bikeElement) {

        const bikePlayer =
          bikeElement.querySelector(
            ".bike-player"
          );

        if (bikePlayer) {

          bikePlayer.style.transform =
            `rotate(${steeringDirection * 12}deg)`;

        }
      }
    }

    bikeAnimation =
      requestAnimationFrame(
        animateBike
      );
  }

  animateBike();
}

  function animateBike() {

    // DESTINATION REACHED

    if (
      segment >=
      points.length - 1
    ) {

      bikeMarker.setLatLng(
        points[points.length - 1]
      );

      updateProgress(100);

      completeRide();

      return;
    }


    const start =
      points[segment];

    const end =
      points[segment + 1];


    progress += baseSpeed * bikeSpeed;


    if (progress >= 1) {

      progress = 0;

      segment++;

    }


    // EXACT ROUTE INTERPOLATION

    const lat =
      start.lat +
      (
        end.lat -
        start.lat
      ) * progress;


    const lng =
      start.lng +
      (
        end.lng -
        start.lng
      ) * progress;


    // MOVE BIKE

    bikeMarker.setLatLng(
      [lat, lng]
    );


    // CAMERA FOLLOW

    map.panTo(
      [lat, lng],
      {
        animate: false
      }
    );


    // PROGRESS

    const totalProgress =
      (
        (segment + progress) /
        (points.length - 1)
      ) * 100;


    updateProgress(
      totalProgress
    );


    // NEXT FRAME

    bikeAnimation =
      requestAnimationFrame(
        animateBike
      );

  }


  animateBike();

}


// -------------------------------
// PROGRESS
// -------------------------------

function updateProgress(
  percent
) {

  percent =
    Math.max(
      0,
      Math.min(
        100,
        percent
      )
    );


  if (progressFill) {

    progressFill.style.width =
      percent + "%";

  }


  if (progressPercent) {

    progressPercent.innerText =
      Math.round(percent) + "%";

  }

}


// -------------------------------
// COMPLETE RIDE
// -------------------------------

function completeRide() {

  updateProgress(100);


  wallet += currentFare;


  walletAmount.innerText =
    wallet.toFixed(0);


  rideStatus.innerText =
    "Completed 🎉";


  status.innerText =
    `🎉 Ride completed! ₹${currentFare} wallet में add हुए।`;


  acceptRideBtn.hidden =
    true;


  startRideBtn.hidden =
    true;


  nextRideBtn.hidden =
    false;

}


// -------------------------------
// NEXT RIDE
// -------------------------------

nextRideBtn.addEventListener(
  "click",
  function () {


    // STOP ANIMATION

    if (bikeAnimation) {

      cancelAnimationFrame(
        bikeAnimation
      );

      bikeAnimation = null;

    }


    // REMOVE BIKE

    if (bikeMarker) {

      map.removeLayer(
        bikeMarker
      );

      bikeMarker = null;

    }


    // REMOVE ROUTE

    if (routeLine) {

      map.removeLayer(
        routeLine
      );

      routeLine = null;

    }


    // REMOVE PICKUP

    if (pickupMarker) {

      map.removeLayer(
        pickupMarker
      );

      pickupMarker = null;

    }


    // REMOVE DESTINATION

    if (destinationMarker) {

      map.removeLayer(
        destinationMarker
      );

      destinationMarker = null;

    }


    // RESET GAME

    currentMode = "pickup";

    rideAccepted = false;

    currentFare = 0;


    rideStatus.innerText =
      "Waiting";


    distanceText.innerText =
      "-- km";


    fareText.innerText =
      "₹--";


    timeText.innerText =
      "-- min";


    updateProgress(0);


    acceptRideBtn.hidden =
      false;

    acceptRideBtn.disabled =
      true;

    acceptRideBtn.innerText =
      "✅ Accept Ride";


    startRideBtn.hidden =
      false;

    startRideBtn.disabled =
      true;


    nextRideBtn.hidden =
      true;


    status.innerText =
      "नई ride के लिए Pickup location चुनें 📍";

  }
);
// ==========================================
// STEP 11 - BIKE CONTROLS
// ==========================================

const accelerateBtn =
  document.getElementById("accelerateBtn");

const brakeBtn =
  document.getElementById("brakeBtn");

const leftBtn =
  document.getElementById("leftBtn");

const rightBtn =
  document.getElementById("rightBtn");

let bikeSpeed = 1;
let steeringDirection = 0;


// ACCELERATE
accelerateBtn.addEventListener("pointerdown", function () {
  bikeSpeed = 1.8;
});

accelerateBtn.addEventListener("pointerup", function () {
  bikeSpeed = 1;
});

accelerateBtn.addEventListener("pointercancel", function () {
  bikeSpeed = 1;
});


// BRAKE
brakeBtn.addEventListener("pointerdown", function () {
  bikeSpeed = 0.2;
});

brakeBtn.addEventListener("pointerup", function () {
  bikeSpeed = 1;
});

brakeBtn.addEventListener("pointercancel", function () {
  bikeSpeed = 1;
});


// LEFT
leftBtn.addEventListener("pointerdown", function () {
  steeringDirection = -1;
});

leftBtn.addEventListener("pointerup", function () {
  steeringDirection = 0;
});

leftBtn.addEventListener("pointercancel", function () {
  steeringDirection = 0;
});


// RIGHT
rightBtn.addEventListener("pointerdown", function () {
  steeringDirection = 1;
});

rightBtn.addEventListener("pointerup", function () {
  steeringDirection = 0;
});
