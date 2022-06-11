const map = L.map('map');
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);
map.setView([55.75, 37.61], 14);

function fetchJSON(url) {
  return fetch(url)
    .then(function(response) {
      return response.json();
    });
}

const pointStyle = (color) => { return {
  radius: 6,
  fillColor: color,
  color: "#fff",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.7
}};

let features = [];
let markersLayer;

function loadDistrictList() {
  return fetchJSON('./data/districts.json').then(data => {
    const districtSelector = document.getElementById('district-selector' );
    data.map(function(row) {
      const option = document.createElement('option');
      option.value = row;
      option.textContent = row;
      districtSelector.appendChild(option);
    })
    districtSelector.onchange = function selectDistrict(event) {
      loadDistrict(event.target.value);
    };
  })
}

function loadPoints() {
  return fetchJSON('./data/features.geojson').then(function(data) {
    features = data['features'];
  });
}

function generateHeatMap() {
  L.heatLayer(
    features.map(feature => [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]),
    {radius: 23}
  ).addTo(map);
}

function loadDistrict(district) {
  if (markersLayer) {
    map.removeLayer(markersLayer);
  }
  markersLayer = L.markerClusterGroup({
    spiderfyOnMaxZoom: false,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: false,
    maxClusterRadius: 40
  });
  const districtFeatures = features.filter(feature => feature.properties.District === district)
  let latMin, latMax, lngMin, lngMax;
  districtFeatures.forEach(function (feature) {
    L.geoJSON(feature, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, pointStyle("#0078ff"));
      }
    }).addTo(markersLayer)
    const [x, y] = feature.geometry.coordinates;
    latMin = latMin && latMin < x ? latMin : x;
    latMax = latMax && latMax > x ? latMax : x;
    lngMin = lngMin && lngMin < y ? lngMin : y;
    lngMax = lngMax && lngMax > y ? lngMax : y;
  });
  map.setView([(lngMin + lngMax) / 2, (latMin + latMax) / 2], 14);
  markersLayer.addTo(map);
}

window.init = function () {
  return loadPoints()
    .then(generateHeatMap)
    .then(loadDistrictList);
}
