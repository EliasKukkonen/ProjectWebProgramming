// js/interactions.js
//Interactions with the map

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
const employmentBox = document.getElementById('employment-data-box'); 

const boxes = [migrationBox, birthDeathBox, populationBox, employmentBox].filter(box => box !== null);

// Function to handle box selection
function selectDataType(boxId) {
    // Remove 'active' class from all boxes
    boxes.forEach(box => box.classList.remove('active'));

    // Add 'active' class to the selected box
    const selectedBox = document.getElementById(boxId);
    if (selectedBox) {
        selectedBox.classList.add('active');
    }

    // Change data type based on boxId
    if (boxId === 'birth-death-data-box') {
        window.selectedDataType = 'birth-death';
        showStatusMessage('Switched to Birth and Death Data');
    } else if (boxId === 'migration-data-box') {
        window.selectedDataType = 'migration';
        showStatusMessage('Switched to Migration Statistics');
    } else if (boxId === 'population-data-box') {
        window.selectedDataType = 'population';
        showStatusMessage('Switched to Population Data');
    } else if (boxId === 'employment-data-box') { 
        window.selectedDataType = 'employment';
        showStatusMessage('Switched to Employment Data');
    }

    // Update the map styles
    if (window.GeoJsonLayer) {
        window.GeoJsonLayer.setStyle(window.getStyle);
    } else {
        console.error('GeoJsonLayer is not initialized yet.');
        showStatusMessage('Map data is still loading. Please wait and try again.');
    }
}

// Function to show status messages
//To show if new data is enabled.
//Designed with ChatGPT
function showStatusMessage(message) {
    let statusDiv = document.getElementById('status-message');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'status-message';
        statusDiv.style.position = 'fixed';
        statusDiv.style.bottom = '20px';
        statusDiv.style.right = '20px';
        statusDiv.style.padding = '10px 20px';
        statusDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        statusDiv.style.color = '#fff';
        statusDiv.style.borderRadius = '5px';
        statusDiv.style.zIndex = '1000';
        statusDiv.style.opacity = '0';
        statusDiv.style.transition = 'opacity 0.5s';
        document.body.appendChild(statusDiv);
    }

    statusDiv.textContent = message;
    statusDiv.style.opacity = '1';
    
    // Fade out after 3 seconds
    setTimeout(() => {
        statusDiv.style.opacity = '0';
    }, 3000);
}

// Function to enable drag-and-drop
//Source: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
//All of the functions from the source above.
function enableDragAndDrop() {
    boxes.forEach(box => {
        box.draggable = true; // Ensure the element is draggable
        box.addEventListener('dragstart', handleDragStart);
    });

    // Make the map a drop zone
    const mapContainer = document.getElementById('map');

    mapContainer.addEventListener('dragover', handleDragOver);
    mapContainer.addEventListener('drop', handleDrop);
}

// Function to disable drag-and-drop
//Used in phone mode.
function disableDragAndDrop() {
    boxes.forEach(box => {
        box.draggable = false; // Disable dragging
        box.removeEventListener('dragstart', handleDragStart);
    });

    const mapContainer = document.getElementById('map');

    mapContainer.removeEventListener('dragover', handleDragOver);
    mapContainer.removeEventListener('drop', handleDrop);
}

// Drag event handlers
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.id);
}

function handleDragOver(e) {
    e.preventDefault(); // Necessary to allow a drop
}

function handleDrop(e) {
    e.preventDefault();
    const boxId = e.dataTransfer.getData('text/plain');
    selectDataType(boxId);
}

// Function to enable click-based selection for mobile
function enableClickSelection() {
    boxes.forEach(box => {
        box.addEventListener('click', handleBoxClick);
    });
}

// Function to disable click-based selection (for desktop)
function disableClickSelection() {
    boxes.forEach(box => {
        box.removeEventListener('click', handleBoxClick);
    });
}

// Click event handler for boxes
function handleBoxClick(e) {
    const boxId = e.currentTarget.id;
    selectDataType(boxId);
}

// Function to check if the current viewport is mobile
function isMobileView() {
    return window.innerWidth <= 768; 
}

// Function to initialize interactions based on viewport
function initializeInteractions() {
    if (isMobileView()) {
        disableDragAndDrop();
        enableClickSelection();
    } else {
        disableClickSelection();
        enableDragAndDrop();
    }
}

// Initialize interactions on load
initializeInteractions();

// Handle window resize to switch between mobile and desktop modes
window.addEventListener('resize', () => {
    initializeInteractions();
});

/**
 * Function to add a status message container (if not present)
 */
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('status-message')) {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'status-message';
        statusDiv.style.position = 'fixed';
        statusDiv.style.bottom = '20px';
        statusDiv.style.right = '20px';
        statusDiv.style.padding = '10px 20px';
        statusDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        statusDiv.style.color = '#fff';
        statusDiv.style.borderRadius = '5px';
        statusDiv.style.zIndex = '1000';
        statusDiv.style.opacity = '0';
        statusDiv.style.transition = 'opacity 0.5s';
        document.body.appendChild(statusDiv);
    }
});
