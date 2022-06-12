const map = L.map('map').setView([55.5844, 37.6536], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

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

window.districts = new Set();

function popupPointDescription(attributes) {
  const description = document.createElement('div')
  attributes.keys().forEach((k) => {
    const field = document.createElement('p')
    field.innerHTML = "<b>" + k + ":</b> " + attributes[k]
    description.appendChild(field)
  })
  return description
}

function loadDisctrict(district) {

  function addGeoJSON(path, style) {
    console.log(path, "is loading")

    fetchJSON(path).then(data => {  

      if (window.districts.size == 0)
      { data['features'].forEach((f) => window.districts.add(f.properties.Attributes.District)) }

      data['features'].filter(f => f.properties.Attributes.District == district).forEach(
        feature => L.geoJSON
        ( feature
        , {pointToLayer:  (feature, latlng) => L.circleMarker(latlng, style)}
        ).bindPopup(popupPointDescription(feature.properties.Attributes).innerHTML).addTo(map)
      )
      console.log(path, "is loaded")
    })
  }
  
  function addGeoJSON2(path, style) {
    console.log(path, "is loading")
    fetchJSON(path).then(function(data) {
      data['features'].filter(f => f[1].properties.District == district).forEach(feature => L.geoJSON(feature[1],
      {pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, style);
      }}).bindPopup(popupPointDescription(feature[1].properties).innerHTML).addTo(map))
      console.log(path, "is loaded")
    })
  }

  addGeoJSON('./data/mass.geojson', pointStyle("#00ff00"))
  addGeoJSON('./data/dvor.geojson', pointStyle("#ff7800"))
  addGeoJSON2('./data/podezd.geojson', pointStyle("#0078ff"))

}

window.loadDisctrict = loadDisctrict

window.printDistricts = () => {for (let d of window.districts) {console.log(d)}}