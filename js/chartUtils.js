// js/chartUtils.js

/**
 * Function to parse URL parameters.
 * Returns an object containing key-value pairs of the URL parameters.
 * From lecture 6
 */
function getQueryParams() {
    const params = {};
    window.location.search.substring(1).split("&").forEach(pair => {
        const [key, value] = pair.split("=");
        if (key) { // Ensure that key exists
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
    });
    return params;
}

/**
 * Initialize global variables based on URL parameters.
 */
function initializeGlobals() {
    const params = getQueryParams();
    
  
    window.selectedMunicipalityCodeRaw = params.code; 
    window.selectedMunicipalityName = params.name || 'Unknown Municipality';
    window.selectedDataType = params.dataType || 'population'; // Default to 'population' if not specified
    
    
    window.selectedMunicipalityCode = 'KU' + (window.selectedMunicipalityCodeRaw || '').padStart(3, '0'); 
    
    // Log for debugging
    console.log('Initialized Globals:', {
        selectedMunicipalityCodeRaw: window.selectedMunicipalityCodeRaw,
        selectedMunicipalityName: window.selectedMunicipalityName,
        selectedDataType: window.selectedDataType,
        selectedMunicipalityCode: window.selectedMunicipalityCode
    });
}

// Initialize globals on script load
initializeGlobals();


function viewChart(municipalityCode, municipalityName) {
    const encodedName = encodeURIComponent(municipalityName);
    const chartUrl = `charts.html?code=${municipalityCode}&name=${encodedName}&dataType=${window.selectedDataType}`;
    window.location.href = chartUrl;
}

// Attach viewChart to window for global access
window.viewChart = viewChart;
