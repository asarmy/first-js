# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a JavaScript learning project focused on geological fault trace and seismicity visualization using OpenLayers. It's a simple client-side web application that displays USGS fault data and earthquake information on a 2D map without build tools or complex bundling.

## Architecture

### Core Structure

- **Static Web App**: Traditional HTML/CSS/JS served via HTTP server
- **OpenLayers 8.2.0**: 2D mapping library via CDN (no local dependencies)
- **GeoJSON Data**: Multiple fault datasets and earthquake data loaded from external APIs
- **Single Page**: All functionality contained in index.html + main.js

### Key Files

- `index.html`: Entry point with OpenLayers CDN imports and UI controls
- `js/main.js`: OpenLayers map initialization, data loading, and interactions
- `css/style.css`: Map styling and UI panel layouts

## Features

### Map Layers

- **Base Maps**: USGS National Map hillshade with OpenStreetMap overlay
- **Fault Datasets**:
  - 2023 USGS NSHM (red)
  - UCERF3.1 (blue)
  - UCERF3.2 (green)
  - AK fault data (orange)
- **Seismicity**: USGS earthquake data (past 7 days or custom date range)

### Interactive Features

- **Layer Controls**: Toggle fault layers and earthquake data on/off
- **Address Search**: Nominatim-powered location search with blue star markers
- **Feature Info**: Click on faults/earthquakes to view properties in sidebar
- **Custom Earthquake Queries**: Date range picker for historical seismicity

## Development

### Running the Application

```bash
# Serve files via HTTP server (required due to CORS)
python -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

### Data Sources

- **USGS Fault Data**: Multiple endpoints via corsproxy.io
- **AK Fault Data**: fault-viewer-v3.arkottke.org API
- **Earthquake Data**: USGS earthquake feeds and FDSNWS Event Web Service
- **Geocoding**: Nominatim OpenStreetMap search API

### Technical Details

- **Projections**: Data loaded in EPSG:4326, displayed in EPSG:3857
- **CORS Handling**: Uses corsproxy.io for cross-origin requests
- **Styling**: Vector layers with custom colors and stroke widths
- **Hit Detection**: 10px tolerance for feature clicking

### Current Limitations

- No build system or package management
- No testing framework or linting tools
- Relies on external CORS proxy for some data sources
- Basic error handling for API failures

## Future Development Considerations

The project is set up for potential expansion with a comprehensive .gitignore that anticipates Node.js tooling, but currently operates as a minimal learning environment for JavaScript and OpenLayers fundamentals.
