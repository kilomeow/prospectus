const map = L.map('map');
L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'OpenStreetMap',
    className: 'map-tiles'
}).addTo(map);
map.setView([55.75, 37.61], 14);

function fetchJSON(url) {
  return fetch(url)
    .then(function(response) {
      return response.json();
    });
}

const camera_type_color = {
  mass: '#ff732e',
  dvor: '#faff5c',
  podez: "#ff63bc"
}

const pointStyle = (color) => { return {
  radius: 3,
  fillColor: color,
  color: "#fff",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.7
}};

const camera_radius = {
  mass: 48,
  dvor: 24,
  podez: 8
}

let features = [];
let markersLayer;

function loadDistrictList() {
  return fetchJSON('./data/districts.json').then(data => {
    const districtSelector = document.getElementById('district-select-options' )
    data.map(function(row) {
      const option = document.createElement('a')
      option.href = "#"
      option.textContent = row
      option.onclick = (e) => {
        document.getElementById('district-select-label').textContent = row
        loadDistrict(row);
      }
      districtSelector.appendChild(option);
    })
  })
}

function loadPoints() {
  return fetchJSON('./data/features.geojson').then(function(data) {
    features = data['features'];
  });
}

let heatLayer

function generateHeatMap() {
  heatLayer = L.heatLayer(
    features.map(feature => [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]),
    {radius: 23}
  )
  heatLayer.addTo(map);
}

function loadDistrict(district) {

  //document.getElementById('soundtrack').play()

  if (markersLayer) {
    map.removeLayer(markersLayer);
  }
  markersLayer = L.markerClusterGroup({
    spiderfyOnMaxZoom: false,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: false,
    maxClusterRadius: 40
  });

  function popupPointDescription(attributes) {
    const description = document.createElement('div')
    description.innerHTML = Object.keys(attributes).map(k => ("<b>" + k + ":</b> " + JSON.stringify(attributes[k]))).join("<hr>")
    return description
  }

  const districtFeatures = features.filter(feature => feature.properties.District === district)
  let latMin, latMax, lngMin, lngMax;

  //const already_added = new Array();

  districtFeatures.forEach(function (feature) {
    // get coordinates and check if it's already added
    const [x, y] = feature.geometry.coordinates;
    /*
    if (already_added.includes({x, y})) {return}
    already_added.push({x, y})
    */

    // color and radius of a camera
    const color = camera_type_color[feature.properties.camera_type]
    const radius = camera_radius[feature.properties.camera_type]

    // add camera marker
    L.geoJSON(feature, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, pointStyle('#fff'))
    }).addTo(map)
    // add camera radius circle
    L.geoJSON(feature, {
      pointToLayer: (feature, latlng) => L.circle(latlng, radius, {color, fillOpacity:.35, weight:0})
    }).bindPopup(popupPointDescription(feature.properties).innerHTML).addTo(map)

    // calculate min-max lat/lng
    latMin = latMin && latMin < x ? latMin : x;
    latMax = latMax && latMax > x ? latMax : x;
    lngMin = lngMin && lngMin < y ? lngMin : y;
    lngMax = lngMax && lngMax > y ? lngMax : y;
  });

  // set view to the center of box of points
  map.setView([(lngMin + lngMax) / 2, (latMin + latMax) / 2], 16);

  // remove heat layer
  heatLayer.remove()
}

function addPopupButton() {
  let p = document.querySelector('.popup')
  let b = document.createElement('button')
  b.innerText = '????????????'
  let h = document.createElement('div')
  h.className = 'holder'
  h.appendChild(b)
  p.removeChild(p.querySelector('.holder'))
  p.appendChild(h)
  b.onclick = () => {p.style.display = 'none'}
}

window.init = function () {
  return loadPoints().then(function () {
    generateHeatMap()
    loadDistrictList()
    addPopupButton()
  });
}
