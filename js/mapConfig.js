// js/mapConfig.js

// Shared Data Variables
//So every file has right to use them.
window.positiveMigrationData = {};
window.negativeMigrationData = {};
window.MunicipalityChange = {}; // To map municipality codes to names
window.populationDataByMunicipality = {};
window.selectedDataType = 'migration'; // Default data type
window.GeoJsonLayer = null;

// Map Configuration
// Map should only focus on finland, below is coordinates.
const MapBounds = [
    [58, 20],
    [70, 31]
];
//More configurations.
window.map = L.map('map', {
    center: [64.5, 26.0], // Center of Finland
    zoom: 5, // Adjust zoom level as needed
    minZoom: 5,
    maxZoom: 10,
    touchZoom: false, // Disable touch zoom
    zoomControl: true, 
    maxBounds: MapBounds, 
    maxBoundsViscosity: 1.0
});

// Add OpenStreetMap Tile Layer, Map itself.
window.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(window.map);