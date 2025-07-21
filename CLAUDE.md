# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a JavaScript learning project focused on geological fault trace visualization using Cesium.js. It's a simple client-side web application that displays USGS fault data on a 3D globe without build tools or complex bundling.

## Architecture

### Core Structure
- **Static Web App**: Traditional HTML/CSS/JS served via HTTP server
- **Cesium.js 1.118**: 3D visualization via CDN (no local dependencies)
- **GeoJSON Data**: USGS fault traces loaded from external API
- **Single Page**: All functionality contained in index.html + main.js

### Key Files
- `index.html`: Entry point with Cesium CDN imports
- `js/main.js`: Cesium viewer initialization and data loading
- `css/style.css`: Fullscreen viewport styling

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

### Data Source
- **USGS Fault Data**: Loads from `https://code.usgs.gov/ghsc/nshmp/nshms/nshm-conus/-/raw/main/active-crust/fault/wus-system/branch-avg/sections.geojson`
- **Auto-zoom**: Application automatically zooms to loaded fault data extent

### Current Limitations
- No build system or package management
- No testing framework or linting tools
- Basic error handling for data loading failures
- Uses default Cesium styling for geological features

### Cesium Configuration
- Viewer uses `baseLayerPicker: false` configuration
- GeoJSON data loaded via `Cesium.GeoJsonDataSource.load()`
- Promise-based data handling with `.then()` chaining

## Future Development Considerations

The project is set up for potential expansion with a comprehensive .gitignore that anticipates Node.js tooling, but currently operates as a minimal learning environment for JavaScript and Cesium fundamentals.