// js/ChartSCRIPTS.js

/**
 * ChartSCRIPTS.js
 *
 * This script handles fetching and displaying charts for Population, Birth & Death,
 * Migration, and Employment Rate statistics based on the selected data type.
 * It utilizes Frappe Charts for rendering the charts and provides functionality
 * to download the charts as PNG or SVG images.
 */

/**
 * Function to parse URL parameters.
 * Returns an object containing key-value pairs of the URL parameters.
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
 * Retrieve municipality code, name, and selected data type from URL parameters.
 */
const params = getQueryParams();
const selectedMunicipalityCodeRaw = params.code; // e.g., '001'
const selectedMunicipalityName = params.name;
const selectedDataType = params.dataType || 'population'; // Default to 'population' if not specified

/**
 * Prefix 'KU' to the raw municipality code to match API requirements.
 * e.g., '001' becomes 'KU001'
 */
const selectedMunicipalityCode = 'KU' + selectedMunicipalityCodeRaw; // e.g., 'KU001'

/**
 * Function to fetch data from a given URL.
 * @param {string} url - The API endpoint URL.
 * @returns {Object} - The JSON response from the API.
 */
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

/**
 * Function to fetch Population data from the StatFin API.
 * @returns {Object} - The JSON response containing population data.
 */
async function fetchPopulationData() {
    const url = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/vaerak/statfin_vaerak_pxt_11rm.px";
    
    const years = [
        "2000", "2001", "2002", "2003", "2004", "2005",
        "2006", "2007", "2008", "2009", "2010", "2011",
        "2012", "2013", "2014", "2015", "2016", "2017",
        "2018", "2019", "2020", "2021"
    ];

    const query = {
        "query": [
            {
                "code": "Vuosi",
                "selection": {
                    "filter": "item",
                    "values": years
                }
            },
            {
                "code": "Alue",
                "selection": {
                    "filter": "item",
                    "values": [selectedMunicipalityCode]
                }
            },
            {
                "code": "Tiedot",
                "selection": {
                    "filter": "item",
                    "values": ["vaesto"] // Total population data code
                }
            }
        ],
        "response": {
            "format": "json-stat2"
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(query)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching population data:', error);
        throw error;
    }
}

/**
 * Function to fetch Birth and Death data from the StatFin API.
 * @returns {Object} - An object containing years, births, and deaths arrays.
 */
async function fetchBirthAndDeathData() {
    const url = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/statfin_synt_pxt_12dy.px";
    
    const years = [
        "2000", "2001", "2002", "2003", "2004", "2005",
        "2006", "2007", "2008", "2009", "2010", "2011",
        "2012", "2013", "2014", "2015", "2016", "2017",
        "2018", "2019", "2020", "2021"
    ];

    const birthQuery = {
        "query": [
            {
                "code": "Vuosi",
                "selection": {
                    "filter": "item",
                    "values": years
                }
            },
            {
                "code": "Alue",
                "selection": {
                    "filter": "item",
                    "values": [selectedMunicipalityCode]
                }
            },
            {
                "code": "Tiedot",
                "selection": {
                    "filter": "item",
                    "values": ["vm01"] // Births data code
                }
            }
        ],
        "response": { "format": "json-stat2" }
    };

    const deathQuery = {
        "query": [
            {
                "code": "Vuosi",
                "selection": {
                    "filter": "item",
                    "values": years
                }
            },
            {
                "code": "Alue",
                "selection": {
                    "filter": "item",
                    "values": [selectedMunicipalityCode]
                }
            },
            {
                "code": "Tiedot",
                "selection": {
                    "filter": "item",
                    "values": ["vm11"] // Deaths data code
                }
            }
        ],
        "response": { "format": "json-stat2" }
    };

    /**
     * Helper function to fetch data based on a query.
     * @param {Object} query - The query object for the API request.
     * @returns {Object} - The JSON response from the API.
     */
    const fetchData = async (query) => {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(query)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching birth/death data:', error);
            throw error;
        }
    };

    try {
        // Fetch births and deaths concurrently
        const [birthData, deathData] = await Promise.all([
            fetchData(birthQuery),
            fetchData(deathQuery)
        ]);

        if (birthData && deathData) {
            const years = Object.values(birthData.dimension.Vuosi.category.label);
            const births = birthData.value;
            const deaths = deathData.value;

            return { years, births, deaths };
        } else {
            throw new Error('Incomplete birth or death data received.');
        }
    } catch (error) {
        console.error('Error fetching birth and death data:', error);
        throw error;
    }
}

/**
 * Function to fetch Employment Rate data from the StatFin API.
 * @returns {number} - Employment rate percentage.
 */
async function fetchEmploymentRateData() {
    const url = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/tyokay/statfin_tyokay_pxt_115x.px";

    const query = {
        "query": [
            {
                "code": "Alue",
                "selection": {
                    "filter": "item",
                    "values": [selectedMunicipalityCode]
                }
            },
            {
                "code": "Tiedot",
                "selection": {
                    "filter": "item",
                    "values": ["tyollisyysaste"] // Employment rate data code
                }
            }
        ],
        "response": {
            "format": "json-stat2"
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(query)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Extract employment rate
        const employmentRate = data.value[0]; // Assuming single value
        return employmentRate;
    } catch (error) {
        console.error('Error fetching employment rate data:', error);
        throw error;
    }
}

/**
 * Function to build and render the chart based on the selected data type.
 */
const buildChart = async () => {
    
        if (selectedDataType === 'population') {
            // Fetch Population Data
            const populationData = await fetchPopulationData();

            // Extract years and population values
            const years = Object.values(populationData.dimension.Vuosi.category.label);
            const populationValues = populationData.value;

            // Prepare the chart data
            const chartData = {
                labels: years,
                datasets: [
                    { name: "Population", values: populationValues, chartType: "line" }
                ]
            };

            // Create the Population Line Chart
            new frappe.Chart("#chart", {
                title: `Population in ${selectedMunicipalityName}`,
                data: chartData,
                type: 'line', // Line chart type
                height: 450,
                colors: ['#7cd6fd'],
                // Ensuring responsiveness by setting width to 100%
                axisOptions: {
                    xIsSeries: 1
                }
            });

        } else if (selectedDataType === 'birth-death') {
            // Fetch Birth and Death Data
            const birthDeathData = await fetchBirthAndDeathData();

            // Extract years, births, and deaths
            const years = birthDeathData.years;
            const births = birthDeathData.births;
            const deaths = birthDeathData.deaths;

            // Prepare the chart data
            const chartData = {
                labels: years,
                datasets: [
                    { name: "Births", values: births, chartType: "bar" },
                    { name: "Deaths", values: deaths, chartType: "bar" }
                ]
            };

            // Create the Birth and Death Mixed Bar Chart
            new frappe.Chart("#chart", {
                title: `Births and Deaths in ${selectedMunicipalityName}`,
                data: chartData,
                type: 'axis-mixed', // Mixed chart type
                height: 450,
                colors: ['#63d0ff', '#363636'],
                axisOptions: {
                    xIsSeries: 1
                }
            });

        } else if (selectedDataType === 'migration') {
            // Migration Data URLs
            const positiveMigrationURL = "https://statfin.stat.fi/PxWeb/sq/4bb2c735-1dc3-4c5e-bde7-2165df85e65f";
            const negativeMigrationURL = "https://statfin.stat.fi/PxWeb/sq/944493ca-ea4d-4fd9-a75c-4975192f7b6e";

            // Fetch Positive and Negative Migration Data concurrently
            const [positiveMigrationData, negativeMigrationData] = await Promise.all([
                fetchData(positiveMigrationURL),
                fetchData(negativeMigrationURL)
            ]);

            // Extract datasets
            const posDataset = positiveMigrationData.dataset;
            const negDataset = negativeMigrationData.dataset;

            // Find the index for the selected municipality
            const posAreaIndex = posDataset.dimension.Tuloalue.category.index[selectedMunicipalityCode];
            const negAreaIndex = negDataset.dimension.Lähtöalue.category.index[selectedMunicipalityCode];

            if (posAreaIndex === undefined || negAreaIndex === undefined) {
                alert('Migration data not available for this municipality.');
                return;
            }

            // Extract migration values
            const posMigrants = posDataset.value[posAreaIndex];
            const negMigrants = negDataset.value[negAreaIndex];

            // Prepare data for the pie chart
            const chartData = {
                labels: ["In-migration", "Out-migration"],
                datasets: [
                    {
                        values: [posMigrants, negMigrants],
                        colors: ['#00a86b', '#ff7f50']
                    }
                ]
            };

            // Create the Migration Pie Chart
            new frappe.Chart("#chart", {
                title: `Migration Statistics in ${selectedMunicipalityName}`,
                data: chartData,
                type: 'pie', // Pie chart type
                height: 450,
                colors: ['#00a86b', '#ff7f50']
            });

        } else if (selectedDataType === 'employment') {
            // Employment Rate Data URL
            const employmentURL = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/tyokay/statfin_tyokay_pxt_115x.px";

            // Fetch Employment Rate Data
            const employmentRate = await fetchEmploymentRateData();

            // Prepare data for the pie chart
            const chartData = {
                labels: ["Employed", "Unemployed"],
                datasets: [
                    {
                        values: [employmentRate, 100 - employmentRate],
                        colors: ['#1E90FF', '#FF6347']
                    }
                ]
            };

            // Create the Employment Rate Pie Chart
            new frappe.Chart("#chart", {
                title: `Employment Rate in ${selectedMunicipalityName} (2021)`,
                data: chartData,
                type: 'pie', // Pie chart type
                height: 450,
                colors: ['#1E90FF', '#FF6347']
            });

        } else {
            // Default or unknown data type
            alert('Unknown data type selected.');
        }
    
};
    
/**
 * Function to download the chart as an SVG file.
 */
function downloadChartSVG() {
    const chartContainer = document.getElementById('chart');
    const svgElement = chartContainer.querySelector('svg');

    if (svgElement) {
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgElement);

        // Add namespaces if they are missing
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        // Add XML declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        // Convert SVG source to URI data scheme
        const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

        // Create a download link and trigger click
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `${selectedMunicipalityName}_chart.svg`;

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } else {
        alert('SVG element not found!');
    }
}

/**
 * Function to download the chart as a PNG file.
 */
function downloadChartPNG() {
    const chartContainer = document.getElementById('chart');
    const svgElement = chartContainer.querySelector('svg');

    if (svgElement) {
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgElement);

        // Add namespaces if they are missing
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        // Convert SVG source to URI data scheme
        const svgData = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

        const image = new Image();
        image.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext('2d');

            // Fill canvas with white background
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);

            // Draw the SVG image onto the canvas
            context.drawImage(image, 0, 0);

            // Create a PNG data URL from the canvas
            const imgData = canvas.toDataURL('image/png');

            // Create a download link and trigger click
            const downloadLink = document.createElement("a");
            downloadLink.href = imgData;
            downloadLink.download = `${selectedMunicipalityName}_chart.png`;

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        };

        // Handle CORS issues by setting crossOrigin
        image.crossOrigin = 'anonymous';
        image.src = svgData;
    } else {
        alert('SVG element not found!');
    }
}

/**
 * Attach event listeners to existing download buttons.
 */
function attachDownloadListeners() {
    const downloadPngButton = document.getElementById('download-chart-png');
    const downloadSvgButton = document.getElementById('download-chart-svg');
    const navigationButton = document.getElementById('navigation');

    if (downloadPngButton) {
        downloadPngButton.addEventListener('click', downloadChartPNG);
    } else {
        console.warn('Download PNG button with ID "download-chart-png" not found.');
    }

    if (downloadSvgButton) {
        downloadSvgButton.addEventListener('click', downloadChartSVG);
    } else {
        console.warn('Download SVG button with ID "download-chart-svg" not found.');
    }

    if (navigationButton) {
        navigationButton.addEventListener('click', () => {
            // Check if there is a history to go back to
            if (window.history.length > 1) {
                window.history.back(); // Navigate back to the previous page
            } else {
                // If no history, navigate to the main page directly
                window.location.href = 'index.html';
            }
        });
    } else {
        console.warn('Navigation button with ID "navigation" not found.');
    }
}

/**
 * Build the chart and attach download listeners when the page is fully loaded.
 */
document.addEventListener('DOMContentLoaded', async () => {
    await buildChart();
    attachDownloadListeners();
});
