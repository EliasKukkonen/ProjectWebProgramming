// js/mapConfig.js

// Shared Data Variables
window.positiveMigrationData = {};
window.negativeMigrationData = {};
window.MunicipalityChange = {}; // To map municipality codes to names
window.populationDataByMunicipality = {};
window.selectedDataType = 'migration'; // Default data type
window.GeoJsonLayer = null;

// Map Configuration
const MapBounds = [
    [58, 20],
    [70, 31]
];

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

// Add OpenStreetMap Tile Layer
window.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(window.map);