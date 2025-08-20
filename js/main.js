// Layer color configuration
const LAYER_COLORS = {
  usgs: 'rgba(255, 0, 0, 0.5)',
  ucerf31: 'rgba(30, 144, 255, 0.5)',
  ucerf32: 'rgba(34, 139, 34, 0.5)',
  ak: 'rgba(255, 165, 0, 0.5)',
  earthquakes: 'rgba(128, 0, 128, 0.6)'
};

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
let usgsLayer, /*akLayer,*/ earthquakeLayer, ucerf31Layer, ucerf32Layer;

// Global variables for earthquake loading
let earthquakeAbortController = null;

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
          color: LAYER_COLORS.usgs,
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
/*
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
*/

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
          color: LAYER_COLORS.ucerf31,
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
          color: LAYER_COLORS.ucerf32,
          width: 2,
          // lineDash: [5, 5]
        })
      }),
      visible: false,
      zIndex: 4
    });
    
    map.addLayer(ucerf32Layer);
    console.log('UCERF3.2 faults loaded:', ucerf32Source.getFeatures().length);
  })
  .catch(error => console.error('Error loading UCERF3.2 faults:', error));

// Function to show loading overlay
function showLoadingOverlay() {
  document.getElementById('loading-overlay').style.display = 'flex';
  document.getElementById('loading-message').textContent = 'Loading earthquakes...';
  document.getElementById('loading-buttons').style.display = 'none';
}

// Function to hide loading overlay
function hideLoadingOverlay() {
  document.getElementById('loading-overlay').style.display = 'none';
  document.getElementById('loading-buttons').style.display = 'none';
}

// Function to setup timeout warning
function setupTimeoutWarning() {
  const timeoutId = setTimeout(() => {
    if (earthquakeAbortController && !earthquakeAbortController.signal.aborted) {
      console.log('60 seconds elapsed, showing timeout warning');
      showTimeoutWarning();
    }
  }, 60000);
  
  // Store timeout ID for cleanup
  earthquakeAbortController.timeoutId = timeoutId;
}

// Function to show timeout warning with user choice
function showTimeoutWarning() {
  document.getElementById('loading-message').textContent = 'Request is taking longer than expected. Large date ranges may take several minutes.';
  document.getElementById('loading-buttons').style.display = 'block';
}

// Function to continue waiting (extend timeout)
function continueWaiting() {
  document.getElementById('loading-message').textContent = 'Continuing to load earthquakes...';
  document.getElementById('loading-buttons').style.display = 'none';
  
  // Setup another timeout warning in 120 seconds
  const extendedTimeoutId = setTimeout(() => {
    if (earthquakeAbortController && !earthquakeAbortController.signal.aborted) {
      earthquakeAbortController.timedOut = true; // Flag to track timeout
      earthquakeAbortController.abort();
      hideLoadingOverlay();
      alert('Request took too long. Please try a smaller date range.');
    }
  }, 120000);
  
  earthquakeAbortController.extendedTimeoutId = extendedTimeoutId;
}

// Function to cancel earthquake request
function cancelEarthquakeRequest() {
  if (earthquakeAbortController) {
    earthquakeAbortController.userCancelled = true; // Flag to track user cancellation
    earthquakeAbortController.abort();
    hideLoadingOverlay();
  }
}

// Function to load earthquake data
function loadEarthquakeData(customStartTime = null, customEndTime = null) {
  // Cancel any existing request
  if (earthquakeAbortController) {
    earthquakeAbortController.abort();
  }
  
  // Create new AbortController for this request
  earthquakeAbortController = new AbortController();
  
  // Show loading overlay only for custom date ranges (which can be slow)
  const isCustomRange = customStartTime && customEndTime;
  if (isCustomRange) {
    showLoadingOverlay();
    setupTimeoutWarning();
  }
  
  if (earthquakeLayer) {
    map.removeLayer(earthquakeLayer);
  }
  
  let apiUrl;
  
  if (customStartTime && customEndTime) {
    // Custom date range using FDSNWS Event Web Service
    apiUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${customStartTime}&endtime=${customEndTime}`;
    console.log('Loading custom earthquake data:', customStartTime, 'to', customEndTime);
    console.log('API URL:', apiUrl);
  } else {
    // Past 7 days using feed
    apiUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
    console.log('Loading past 7 days earthquake data');
  }
  
  fetch(apiUrl, { signal: earthquakeAbortController.signal })
    .then(response => {
      console.log('Earthquake API response status:', response.status);
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        if (response.status === 503) {
          errorMessage = 'USGS server is overloaded. Try a smaller date range or try again later.';
        } else if (response.status === 400) {
          errorMessage = 'Invalid request. Check your date range (future dates not allowed) and try again.';
        } else if (response.status === 500) {
          errorMessage = 'USGS server error. Please try again later.';
        }
        // Don't try to parse JSON for error responses
        throw new Error(errorMessage);
      }
      return response.json();
    })
    .then(data => {
      // Clear any active timeouts
      if (earthquakeAbortController.timeoutId) {
        clearTimeout(earthquakeAbortController.timeoutId);
      }
      if (earthquakeAbortController.extendedTimeoutId) {
        clearTimeout(earthquakeAbortController.extendedTimeoutId);
      }
      hideLoadingOverlay();
      
      console.log('Earthquake data loaded:', data);
      console.log('Number of earthquake features:', data.features ? data.features.length : 0);
      
      if (!data.features || data.features.length === 0) {
        console.log('No earthquakes found for the selected date range');
        alert('No earthquakes found for the selected date range. Try expanding your date range or check if the dates are correct.');
        return;
      }
      
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
                color: LAYER_COLORS.earthquakes
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
      // Clear any active timeouts
      if (earthquakeAbortController && earthquakeAbortController.timeoutId) {
        clearTimeout(earthquakeAbortController.timeoutId);
      }
      if (earthquakeAbortController && earthquakeAbortController.extendedTimeoutId) {
        clearTimeout(earthquakeAbortController.extendedTimeoutId);
      }
      hideLoadingOverlay();
      
      if (error.name === 'AbortError') {
        console.log('Earthquake request was cancelled');
        // Check if it was user cancellation, timeout, or just request cancellation
        if (earthquakeAbortController && (earthquakeAbortController.userCancelled || earthquakeAbortController.timedOut)) {
          // Don't show additional error messages for user actions or timeouts
          return;
        }
        // If it's just a regular abort (like switching requests), don't show error
        return;
      }
      
      console.error('Error loading earthquake data:', error);
      alert(error.message || 'Error loading earthquake data. Please try again.');
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

/*
document.getElementById('ak-checkbox').addEventListener('change', function(e) {
  if (akLayer) {
    akLayer.setVisible(e.target.checked);
  }
});
*/

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
    
    // Ensure we don't set future dates
    const now = new Date();
    const safeEndDate = endDate > now ? now : endDate;
    
    document.getElementById('end-date').value = safeEndDate.toISOString().slice(0, 16);
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
  
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const now = new Date();
  
  if (startDateObj >= endDateObj) {
    alert('Start date must be before end date');
    return;
  }
  
  if (endDateObj > now) {
    alert('End date cannot be in the future');
    return;
  }
  
  
  // Convert to ISO format for USGS API
  const startTime = startDateObj.toISOString();
  const endTime = endDateObj.toISOString();
  
  console.log('Loading custom earthquake data:', startTime, 'to', endTime);
  loadEarthquakeData(startTime, endTime);
});

// Function to update legend colors
function updateLegendColors() {
  document.querySelector('#usgs-checkbox + .color-indicator').style.backgroundColor = LAYER_COLORS.usgs;
  document.querySelector('#ucerf31-checkbox + .color-indicator').style.backgroundColor = LAYER_COLORS.ucerf31;
  document.querySelector('#ucerf32-checkbox + .color-indicator').style.backgroundColor = LAYER_COLORS.ucerf32;
}

// Function to refresh map while preserving current UI state
function refreshMap() {
  console.log('Refreshing map...');
  
  // Capture current layer visibility states
  const layerStates = {
    usgs: document.getElementById('usgs-checkbox').checked,
    ucerf31: document.getElementById('ucerf31-checkbox').checked,
    ucerf32: document.getElementById('ucerf32-checkbox').checked
  };
  
  // Capture current seismicity state
  const seismicityState = {
    none: document.getElementById('no-earthquakes').checked,
    sevenDays: document.getElementById('earthquakes-7days').checked,
    custom: document.getElementById('earthquakes-custom').checked,
    startDate: document.getElementById('start-date').value,
    endDate: document.getElementById('end-date').value
  };
  
  // Force map re-render
  map.render();
  
  // Apply captured layer states
  if (usgsLayer) usgsLayer.setVisible(layerStates.usgs);
  if (ucerf31Layer) ucerf31Layer.setVisible(layerStates.ucerf31);
  if (ucerf32Layer) ucerf32Layer.setVisible(layerStates.ucerf32);
  
  // Handle seismicity layer refresh
  if (seismicityState.sevenDays) {
    loadEarthquakeData(); // Reload 7 days data
  } else if (seismicityState.custom && seismicityState.startDate && seismicityState.endDate) {
    // Reload custom date range
    const startTime = new Date(seismicityState.startDate).toISOString();
    const endTime = new Date(seismicityState.endDate).toISOString();
    loadEarthquakeData(startTime, endTime);
  } else if (seismicityState.none && earthquakeLayer) {
    earthquakeLayer.setVisible(false);
  }
  
  console.log('Map refreshed with preserved state');
}

// Update legend colors on page load
updateLegendColors();

// Add refresh button event listener
document.getElementById('refresh-map-btn').addEventListener('click', refreshMap);

// Add loading overlay button event listeners
document.getElementById('continue-waiting-btn').addEventListener('click', continueWaiting);
document.getElementById('cancel-request-btn').addEventListener('click', cancelEarthquakeRequest);

// Hide search results when clicking outside
document.addEventListener('click', function(e) {
  const searchContainer = document.getElementById('search-container');
  if (!searchContainer.contains(e.target)) {
    document.getElementById('search-results').style.display = 'none';
  }
});

