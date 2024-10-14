// js/interactions.js

// Function to navigate to the chart page with selected data type
window.viewChart = (municipalityCode, municipalityName) => {
    const encodedName = encodeURIComponent(municipalityName);
    const chartUrl = `charts.html?code=${municipalityCode}&name=${encodedName}&dataType=${window.selectedDataType}`;
    window.location.href = chartUrl;
};

// Event Listener for Popup Buttons
window.map.on('popupopen', function(e) {
    const layer = e.popup._source;
    const municipalityCodeRaw = layer.feature.properties.kunta;
    const municipalityCode = municipalityCodeRaw.padStart(3, '0');
    const municipalityName = layer.feature.properties.nimi;

    const viewChartButtonId = `view-chart-${municipalityCode}`;

    const popupNode = e.popup.getElement();
    const viewChartButton = popupNode.querySelector(`#${viewChartButtonId}`);

    if (viewChartButton) {
        viewChartButton.addEventListener('click', function() {
            window.viewChart(municipalityCode, municipalityName);
        });
    }
});

// Drag-and-Drop Functionality

const migrationBox = document.getElementById('migration-data-box');
const birthDeathBox = document.getElementById('birth-death-data-box');
const populationBox = document.getElementById('population-data-box');

// Ensure that boxes are not null
const boxes = [migrationBox, birthDeathBox, populationBox].filter(box => box !== null);

// Make the boxes draggable
boxes.forEach(box => {
    box.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', box.id);
    });
});

// Make the map a drop zone
const mapContainer = document.getElementById('map');

mapContainer.addEventListener('dragover', (e) => {
    e.preventDefault(); // Necessary to allow a drop
});

mapContainer.addEventListener('drop', async (e) => {
    e.preventDefault();
    const boxId = e.dataTransfer.getData('text/plain');

    if (boxId === 'birth-death-data-box') {
        window.selectedDataType = 'birth-death';
        alert('Switched to Birth and Death Data');
    } else if (boxId === 'migration-data-box') {
        window.selectedDataType = 'migration';
        alert('Switched to Migration Statistics');
    } else if (boxId === 'population-data-box') {
        window.selectedDataType = 'population';
        alert('Switched to Population Data');
    }

    // Check if GeoJsonLayer is defined before setting style
    if (window.GeoJsonLayer) {
        window.GeoJsonLayer.setStyle(window.getStyle);
    } else {
        console.error('GeoJsonLayer is not initialized yet.');
        alert('Map data is still loading. Please wait and try again.');
    }
});
