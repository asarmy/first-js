// Create hillshade layer using USGS National Map
const hillshadeLayer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/tile/{z}/{y}/{x}',
    attributions: 'USGS National Map',
    maxZoom: 16
  })
});

// Create OpenStreetMap layer with 20% opacity
const osmLayer = new ol.layer.Tile({
  source: new ol.source.OSM(),
  opacity: 0.5
});

// Create marker layer for search pins with blue star
const markerSource = new ol.source.Vector();
const markerLayer = new ol.layer.Vector({
  source: markerSource,
  style: new ol.style.Style({
    image: new ol.style.RegularShape({
      points: 5,
      radius1: 15,
      radius2: 7,
      fill: new ol.style.Fill({ color: 'blue' }),
      stroke: new ol.style.Stroke({ color: 'white', width: 2 })
    })
  })
});

// Initialize map centered on Western United States
const map = new ol.Map({
  target: 'map',
  layers: [hillshadeLayer, osmLayer, markerLayer],
  view: new ol.View({
    center: ol.proj.fromLonLat([-115.0, 37.0]),
    zoom: 6
  })
});

// Global layer variables for control
let usgsLayer, akLayer, earthquakeLayer, ucerf31Layer, ucerf32Layer;

// Load USGS fault data using CORS proxy
fetch('https://corsproxy.io/?https://code.usgs.gov/ghsc/nshmp/nshms/nshm-conus/-/raw/main/active-crust/fault/wus-system/branch-avg/sections.geojson')
  .then(response => response.json())
  .then(data => {
    const vectorSource = new ol.source.Vector({
      features: new ol.format.GeoJSON().readFeatures(data, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      })
    });
    
    usgsLayer = new ol.layer.Vector({
      source: vectorSource,
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'red',
          width: 2
        })
      }),
      zIndex: 1
    });
    
    map.addLayer(usgsLayer);
    console.log('USGS faults loaded:', vectorSource.getFeatures().length);
  })
  .catch(error => console.error('Error loading USGS faults:', error));

// Load AK fault data from fault-viewer API using CORS proxy
fetch('https://corsproxy.io/?https://fault-viewer-v3.arkottke.org/api/faults?lat_min=30&lat_max=55&dip_min=0&dip_max=90&type=traces')
  .then(response => {
    console.log('AK fault API response:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('AK fault data loaded:', data);
    
    // Check if data has features array
    if (data.features && Array.isArray(data.features)) {
      const akFaultSource = new ol.source.Vector({
        features: new ol.format.GeoJSON().readFeatures(data, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        })
      });
      
      akLayer = new ol.layer.Vector({
        source: akFaultSource,
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'orange',
            width: 2
          })
        }),
        visible: false,
        zIndex: 2
      });
      
      map.addLayer(akLayer);
      console.log('AK faults loaded:', akFaultSource.getFeatures().length);
    } else {
      console.log('Unexpected data format from AK fault API:', data);
    }
  })
  .catch(error => {
    console.error('Error loading AK fault data:', error);
  });

// Load UCERF3.1 fault data using CORS proxy
fetch('https://corsproxy.io/?https://code.usgs.gov/ghsc/nshmp/nshms/nshm-conus/-/raw/5.3-maint/active-crust/fault/CA/ucerf3/fault-model-3.1/sections.geojson')
  .then(response => response.json())
  .then(data => {
    const ucerf31Source = new ol.source.Vector({
      features: new ol.format.GeoJSON().readFeatures(data, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      })
    });
    
    ucerf31Layer = new ol.layer.Vector({
      source: ucerf31Source,
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'dodgerblue',
          width: 2
        })
      }),
      visible: false,
      zIndex: 3
    });
    
    map.addLayer(ucerf31Layer);
    console.log('UCERF3.1 faults loaded:', ucerf31Source.getFeatures().length);
  })
  .catch(error => console.error('Error loading UCERF3.1 faults:', error));

// Load UCERF3.2 fault data using CORS proxy
fetch('https://corsproxy.io/?https://code.usgs.gov/ghsc/nshmp/nshms/nshm-conus/-/raw/5.3-maint/active-crust/fault/CA/ucerf3/fault-model-3.2/sections.geojson')
  .then(response => response.json())
  .then(data => {
    const ucerf32Source = new ol.source.Vector({
      features: new ol.format.GeoJSON().readFeatures(data, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      })
    });
    
    ucerf32Layer = new ol.layer.Vector({
      source: ucerf32Source,
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'forestgreen',
          width: 2
        })
      }),
      visible: false,
      zIndex: 4
    });
    
    map.addLayer(ucerf32Layer);
    console.log('UCERF3.2 faults loaded:', ucerf32Source.getFeatures().length);
  })
  .catch(error => console.error('Error loading UCERF3.2 faults:', error));

// Function to load earthquake data
function loadEarthquakeData(customStartTime = null, customEndTime = null) {
  if (earthquakeLayer) {
    map.removeLayer(earthquakeLayer);
  }
  
  let apiUrl;
  
  if (customStartTime && customEndTime) {
    // Custom date range using FDSNWS Event Web Service
    apiUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${customStartTime}&endtime=${customEndTime}`;
    console.log('Loading custom earthquake data:', customStartTime, 'to', customEndTime);
  } else {
    // Past 7 days using feed
    apiUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
    console.log('Loading past 7 days earthquake data');
  }
  
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      console.log('Earthquake data loaded:', data);
      
      const earthquakeSource = new ol.source.Vector({
        features: new ol.format.GeoJSON().readFeatures(data, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        })
      });
      
      earthquakeLayer = new ol.layer.Vector({
        source: earthquakeSource,
        style: function(feature) {
          const magnitude = feature.get('mag') || 1;
          const radius = Math.max(3, magnitude * 2); // Scale circle size by magnitude
          
          return new ol.style.Style({
            image: new ol.style.Circle({
              radius: radius,
              fill: new ol.style.Fill({ 
                color: 'rgba(128, 0, 128, 0.6)' // Purple with transparency
              }),
              stroke: new ol.style.Stroke({ 
                color: 'purple', 
                width: 1 
              })
            })
          });
        },
        visible: true
      });
      
      map.addLayer(earthquakeLayer);
      console.log('Earthquakes loaded and layer added:', earthquakeSource.getFeatures().length);
    })
    .catch(error => {
      console.error('Error loading earthquake data:', error);
    });
}

// Function to display fault properties in a table
function showFaultInfo(feature) {
  const properties = feature.getProperties();
  delete properties.geometry; // Remove geometry from display
  
  let tableHTML = '<table>';
  
  for (const [key, value] of Object.entries(properties)) {
    let displayValue = value || 'N/A';
    
    // Format timestamp fields for earthquakes (time and updated fields)
    if ((key === 'time' || key === 'updated') && value && typeof value === 'number') {
      const date = new Date(value);
      displayValue = date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short'
      });
    }
    
    tableHTML += `<tr><th>${key}</th><td>${displayValue}</td></tr>`;
  }
  
  tableHTML += '</table>';
  
  document.getElementById('fault-properties').innerHTML = tableHTML;
  document.getElementById('info-panel').style.display = 'block';
}

// Function to close the info panel
function closeInfoPanel() {
  document.getElementById('info-panel').style.display = 'none';
}

// Search functionality
document.getElementById('search-btn').addEventListener('click', performSearch);
document.getElementById('clear-btn').addEventListener('click', clearSearch);
document.getElementById('search-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    performSearch();
  }
});

function performSearch() {
  const query = document.getElementById('search-input').value;
  if (!query.trim()) return;
  
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
  
  fetch(nominatimUrl)
    .then(response => response.json())
    .then(results => {
      displaySearchResults(results);
    })
    .catch(error => {
      console.error('Search error:', error);
    });
}

function displaySearchResults(results) {
  const resultsDiv = document.getElementById('search-results');
  
  if (results.length === 0) {
    resultsDiv.innerHTML = '<div class="search-result-item">No results found</div>';
    resultsDiv.style.display = 'block';
    return;
  }
  
  resultsDiv.innerHTML = '';
  
  results.forEach(result => {
    const div = document.createElement('div');
    div.className = 'search-result-item';
    div.textContent = result.display_name;
    div.addEventListener('click', () => {
      selectLocation(result);
    });
    resultsDiv.appendChild(div);
  });
  
  resultsDiv.style.display = 'block';
}

function selectLocation(location) {
  const coordinates = [parseFloat(location.lon), parseFloat(location.lat)];
  const point = ol.proj.fromLonLat(coordinates);
  
  // Clear existing markers
  markerSource.clear();
  
  // Add new marker
  const marker = new ol.Feature({
    geometry: new ol.geom.Point(point),
    name: location.display_name
  });
  
  markerSource.addFeature(marker);
  
  // Zoom to location
  map.getView().animate({
    center: point,
    zoom: 14,
    duration: 1000
  });
  
  // Hide search results
  document.getElementById('search-results').style.display = 'none';
  document.getElementById('search-input').value = location.display_name;
}

// Function to clear search
function clearSearch() {
  markerSource.clear();
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').style.display = 'none';
}

// Add click interaction for fault properties with hit tolerance
map.on('click', function(event) {
  const feature = map.forEachFeatureAtPixel(event.pixel, function(feature) {
    return feature;
  }, {
    hitTolerance: 10
  });
  
  if (feature) {
    showFaultInfo(feature);
  } else {
    closeInfoPanel();
  }
});

// Layer control functionality
document.getElementById('usgs-checkbox').addEventListener('change', function(e) {
  if (usgsLayer) {
    usgsLayer.setVisible(e.target.checked);
  }
});

document.getElementById('ak-checkbox').addEventListener('change', function(e) {
  if (akLayer) {
    akLayer.setVisible(e.target.checked);
  }
});

document.getElementById('ucerf31-checkbox').addEventListener('change', function(e) {
  if (ucerf31Layer) {
    ucerf31Layer.setVisible(e.target.checked);
  }
});

document.getElementById('ucerf32-checkbox').addEventListener('change', function(e) {
  if (ucerf32Layer) {
    ucerf32Layer.setVisible(e.target.checked);
  }
});

// Seismicity radio button event handlers
document.getElementById('no-earthquakes').addEventListener('change', function(e) {
  if (e.target.checked) {
    console.log('No earthquakes selected');
    if (earthquakeLayer) {
      earthquakeLayer.setVisible(false);
    }
    document.getElementById('date-range-inputs').style.display = 'none';
  }
});

document.getElementById('earthquakes-7days').addEventListener('change', function(e) {
  if (e.target.checked) {
    console.log('7 days earthquakes selected');
    loadEarthquakeData(); // Load 7 days data
    document.getElementById('date-range-inputs').style.display = 'none';
  }
});

document.getElementById('earthquakes-custom').addEventListener('change', function(e) {
  if (e.target.checked) {
    console.log('Custom earthquake range selected');
    document.getElementById('date-range-inputs').style.display = 'block';
    
    // Set default dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('end-date').value = endDate.toISOString().slice(0, 16);
    document.getElementById('start-date').value = startDate.toISOString().slice(0, 16);
  }
});

// Load custom earthquake data button
document.getElementById('load-custom-btn').addEventListener('click', function() {
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  
  if (!startDate || !endDate) {
    alert('Please select both start and end dates');
    return;
  }
  
  if (new Date(startDate) >= new Date(endDate)) {
    alert('Start date must be before end date');
    return;
  }
  
  // Convert to ISO format for USGS API
  const startTime = new Date(startDate).toISOString();
  const endTime = new Date(endDate).toISOString();
  
  console.log('Loading custom earthquake data:', startTime, 'to', endTime);
  loadEarthquakeData(startTime, endTime);
});

// Hide search results when clicking outside
document.addEventListener('click', function(e) {
  const searchContainer = document.getElementById('search-container');
  if (!searchContainer.contains(e.target)) {
    document.getElementById('search-results').style.display = 'none';
  }
});

