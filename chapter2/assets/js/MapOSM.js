let map = null;
let layerDepartamentos = null;

function loadMap() {
  addMap();
  addLayerDepartamentos();
}

function addMap() {
  // Asuncion - Paraguay
  let lng = -57.6309129;
  let lat = -25.2961407;

  let zoom = 6;
  let minZoom = 6;
  let maxZoom = 18;

  map = new L.map("map", {
    center: [lat, lng],
    zoom: zoom,
    minZoom: minZoom,
    maxZoom: maxZoom,
    attributionControl: false,
  });
}

//////////////////////////////////////////////////////////////////////
// Extend Leaflet to create a GeoJSON layer from a TopoJSON file.
//////////////////////////////////////////////////////////////////////
L.TopoJSON = L.GeoJSON.extend({
  addData: function (data) {
    let geojson, key;

    if (data.type === "Topology") {
      for (key in data.objects) {
        if (data.objects.hasOwnProperty(key)) {
          geojson = topojson.feature(data, data.objects[key]);
          L.GeoJSON.prototype.addData.call(this, geojson);
        }
      }
      return this;
    }
    L.GeoJSON.prototype.addData.call(this, data);
    return this;
  },
});

L.topoJson = function (data, options) {
  return new L.TopoJSON(data, options);
};

function addLayerDepartamentos() {
  //   const URL = "assets/data/Departamentos.geojson";
  //   layerDepartamentos = L.geoJson(null, {
  //     style: styleDepartamento,
  //   });
  const URL = "assets/data/Departamentos.topo.json";
  layerDepartamentos = L.topoJson(null, {
    style: styleDepartamento,
    onEachFeature: onEachFeatureDepartamento,
  });

  getGeoData(URL).then((data) => {
    layerDepartamentos.addData(data);
    addLegend();
    layerDepartamentos.addTo(map);
    map.fitBounds(layerDepartamentos.getBounds());
  });
}

async function getGeoData(url) {
  let response = await fetch(url);
  let data = await response.json();

  return data;
}

function styleDepartamento(feature) {
  let habitantes = feature.properties.HABITANTES;

  return {
    fillColor: getColor(habitantes),
    weight: 0,
    opacity: 1,
    color: "white",
    fillOpacity: 0.7,
  };
}

function getColor(habitantes) {
  return habitantes > 1500000
    ? "#800026"
    : habitantes > 1000000
    ? "#BD0026"
    : habitantes > 500000
    ? "#E31A1C"
    : habitantes > 250000
    ? "#FC4E2A"
    : habitantes > 100000
    ? "#FD8D3C"
    : "#FEB24C";
}

function addLegend() {
  let legend = L.control({
    position: "bottomright",
  });

  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");
    let grades = [0, 100000, 250000, 500000, 1000000, 1500000];
    let labels = [
      "<strong>Cantidad de habitantes Paraguay (2018)</strong>",
      "<br><br>",
    ];
    let from;
    let to;
    let i;
    let length = grades.length;

    for (i = 0; i < length; i++) {
      from = grades[i];
      to = grades[i + 1];

      labels.push(
        '<p><i style="background:' +
          getColor(from + 1) +
          '"></i> ' +
          from +
          (to ? "&ndash;" + to : "+") +
          "<p>"
      );
    }
    div.innerHTML = labels.join("");
    return div;
  };
  legend.addTo(map);
}

// Show information in a popup for a departamento.
function onEachFeatureDepartamento(p_feature, p_layer) {
  let propiedades = p_feature.properties;
  let habitantes = propiedades.HABITANTES;

  if (propiedades) {
    let v_popupString = '<div class="popup">';
    let k;

    for (k in propiedades) {
      let v = propiedades[k];

      if (k === "DPTO_DESC") {
        v_popupString += "<b>Departamento</b>: " + toTitleCase(v) + "<br />";
      }
    }
    v_popupString +=
      "<b>Cantidad</b>: " +
      Number(habitantes).toLocaleString("es-ES") +
      "<br />";
    v_popupString += "</div>";
    p_layer.bindPopup(v_popupString);
  }

  p_layer.on("mouseover", function (e) {
    highlightFeature(e);
  });

  p_layer.on("mouseout", function (e) {
    resetHighlight(e);
  });
}

const toTitleCase = (phrase) => {
  return phrase
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

function highlightFeature(e) {
  let layer = e.target;

  layer.setStyle({
    fillColor: "white",
    weight: 2,
    color: "#000",
    fillOpacity: 0.7,
  });
  layer.bringToFront();
}

function resetHighlight(e) {
  layerDepartamentos.resetStyle(e.target);
}
