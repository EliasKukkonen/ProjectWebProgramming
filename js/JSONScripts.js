// js/JSONScripts.js

let positiveMigrationData = {};
let negativeMigrationData = {};
let MunicipalityChange = {}; // To map municipality codes to names
let populationDataByMunicipality = {};
let selectedDataType = 'migration'; // Default data type

const MapBounds = [
    [58, 20],
    [70, 31]
];

let map = L.map('map', {
    center: [64.5, 26.0], // Center of Finland
    zoom: 5, // Adjust zoom level as needed
    minZoom: 5,
    maxZoom: 10,
    touchZoom: false, // Disable touch zoom
    zoomControl: true,
    maxBounds: MapBounds,
    maxBoundsViscosity: 1.0
});

let osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let GeoJsonLayer;

// Function to fetch and process map data
async function FetchingData() {
    try {
        // Fetch GeoJSON data for municipalities
        const geoResponse = await fetch("https://geo.stat.fi/geoserver/tilastointialueet/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=application/json&srsName=EPSG:4326");
        const geoData = await geoResponse.json();

        // Fetch Positive Migration Data
        const posMigResponse = await fetch("https://statfin.stat.fi/PxWeb/sq/4bb2c735-1dc3-4c5e-bde7-2165df85e65f");
        const PositiveMigration = await posMigResponse.json();

        // Fetch Negative Migration Data
        const negMigResponse = await fetch("https://statfin.stat.fi/PxWeb/sq/944493ca-ea4d-4fd9-a75c-4975192f7b6e");
        const NegativeMigration = await negMigResponse.json();

        // Process Positive Migration Data
        const positiveValues = PositiveMigration.dataset.value;
        const posCodes = PositiveMigration.dataset.dimension.Tuloalue.category.index;

        Object.keys(posCodes).forEach((code) => {
            let idx = posCodes[code];
            positiveMigrationData[code] = positiveValues[idx];
        });

        // Process Negative Migration Data
        const negativeValues = NegativeMigration.dataset.value;
        const negCodes = NegativeMigration.dataset.dimension.Lähtöalue.category.index;

        Object.keys(negCodes).forEach((code) => {
            let idx = negCodes[code];
            negativeMigrationData[code] = negativeValues[idx];
        });

        // Create the GeoJSON layer after fetching migration data
        GeoJsonLayer = L.geoJSON(geoData, {
            onEachFeature: onEachFeature,
            style: getStyle,
        }).addTo(map);

        map.fitBounds(GeoJsonLayer.getBounds());
    } catch (error) {
        console.error('Error fetching map data:', error);
    }
}

// Function to fetch population data
async function fetchPopulationData() {
    const url = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/vaerak/statfin_vaerak_pxt_11rm.px";

    const populationQuery = {
        "query": [
            {
                "code": "Vuosi",
                "selection": {
                    "filter": "item",
                    "values": ["2021"] // Latest year
                }
            },
            {
                "code": "Alue",
                "selection": {
                    "filter": "item",
                    "values": [] // Will be filled after MunicipalityChange is populated
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
        "response": { "format": "json-stat2" }
    };

    // Wait until MunicipalityChange is populated
    while (Object.keys(MunicipalityChange).length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    populationQuery.query[1].selection.values = Object.keys(MunicipalityChange).map(code => 'KU' + code);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(populationQuery)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`Failed to fetch population data: ${response.status} ${response.statusText}`);
        }

        const populationData = await response.json();
        return populationData;
    } catch (error) {
        console.error('Error fetching population data:', error);
        return null;
    }
}

// Function to process population data
function processPopulationData(populationData) {
    const areaDimension = populationData.dimension.Alue.category;
    const areas = areaDimension.index;
    const values = populationData.value;

    Object.keys(areas).forEach((areaCode, idx) => {
        const code = areaCode.replace('KU', '');
        const population = values[idx]; // Since we only have one year
        populationDataByMunicipality[code] = population;
    });
}

// Function to handle each feature (municipality) on the map
const onEachFeature = (feature, layer) => {
    if (!feature.properties.kunta) return;

    const municipalityName = feature.properties.nimi;
    const municipalityCodeRaw = feature.properties.kunta;
    const municipalityCode = municipalityCodeRaw.padStart(3, '0');

    // Map the municipality code to its name
    MunicipalityChange[municipalityCode] = municipalityName;

    layer.on('click', async (e) => {
        if (selectedDataType === 'migration') {
            let code = 'KU' + municipalityCode;
            let positiveMigrationValue = positiveMigrationData[code];
            let negativeMigrationValue = negativeMigrationData[code];

            if (positiveMigrationValue === undefined || negativeMigrationValue === undefined) {
                alert('Migration data not available for this municipality.');
                return;
            }

            layer.bindPopup(
                `<div>
                    <ul>
                        <li><strong>Municipality:</strong> ${municipalityName}</li>
                        <li><strong>Positive Migration:</strong> ${positiveMigrationValue}</li>
                        <li><strong>Negative Migration:</strong> ${negativeMigrationValue}</li>
                    </ul>
                    <button id="view-chart-${municipalityCode}">View Chart</button>
                </div>`
            ).openPopup();
        } else if (selectedDataType === 'birth-death') {
            // Fetch birth and death data
            const data = await fetchBirthAndDeathData(municipalityCode);
            if (!data) {
                alert('Birth and death data not available for this municipality.');
                return;
            }

            // Get the latest year's data
            const latestYearIndex = data.years.length - 1;
            const latestYear = data.years[latestYearIndex];
            const latestBirths = data.births[latestYearIndex];
            const latestDeaths = data.deaths[latestYearIndex];

            layer.bindPopup(
                `<div>
                <ul>
                    <li><strong>Municipality:</strong> ${municipalityName}</li>
                    <li><strong>Year:</strong> ${latestYear}</li>
                    <li><strong>Births:</strong> ${latestBirths}</li>
                    <li><strong>Deaths:</strong> ${latestDeaths}</li>
                </ul>
                <button id="view-chart-${municipalityCode}">View Chart</button>
            </div>`
            ).openPopup();
        } else if (selectedDataType === 'population') {
            const population = populationDataByMunicipality[municipalityCode];

            if (population === undefined) {
                alert('Population data not available for this municipality.');
                return;
            }

            layer.bindPopup(
                `<div>
                <ul>
                    <li><strong>Municipality:</strong> ${municipalityName}</li>
                    <li><strong>Population (2021):</strong> ${population.toLocaleString()}</li>
                </ul>
                <button id="view-chart-${municipalityCode}">View Chart</button>
            </div>`
            ).openPopup();
        }
    });

    layer.bindTooltip(municipalityName);
};

// Function to determine style based on selected data type
const getStyle = (feature) => {
    const municipalityCodeRaw = feature.properties.kunta;
    const municipalityCode = municipalityCodeRaw.padStart(3, '0');

    if (selectedDataType === 'population') {
        const population = populationDataByMunicipality[municipalityCode];

        if (population !== undefined) {
            // Define a color scale based on population
            let color = getColorForPopulation(population);

            return {
                weight: 1,
                color: 'black',
                fillColor: color,
                fillOpacity: 0.7
            };
        } else {
            return {
                weight: 1,
                color: 'black',
                fillColor: '#ccc',
                fillOpacity: 0.7
            };
        }
    } else {
        // Styling logic for migration data
        const municipalityCodeFull = 'KU' + municipalityCode;
        const positiveMigrationValue = positiveMigrationData[municipalityCodeFull];
        const negativeMigrationValue = negativeMigrationData[municipalityCodeFull];

        if (positiveMigrationValue !== undefined && negativeMigrationValue !== undefined) {
            let ratio = positiveMigrationValue / negativeMigrationValue;

            let hue = Math.pow(ratio, 3) * 60;
            hue = Math.min(hue, 120);

            const color = `hsl(${hue}, 75%, 50%)`;
            return {
                weight: 1,
                color: 'black',
                fillColor: color,
                fillOpacity: 0.7
            };
        } else {
            return {
                weight: 1,
                color: 'black',
                fillColor: '#ccc',
                fillOpacity: 0.7
            };
        }
    }
};

// Function to determine color based on population
function getColorForPopulation(population) {
    return population > 100000 ? '#800026' :
           population > 50000  ? '#BD0026' :
           population > 20000  ? '#E31A1C' :
           population > 10000  ? '#FC4E2A' :
           population > 5000   ? '#FD8D3C' :
           population > 2000   ? '#FEB24C' :
           population > 1000   ? '#FED976' :
                                 '#FFEDA0';
}



// Function to fetch birth and death data
const fetchBirthAndDeathData = async (municipalityCode) => {
    // Prefix the municipality code with 'KU'
    const areaCode = 'KU' + municipalityCode;

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
                    "values": [areaCode]
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
        ...birthQuery,
        "query": [
            ...birthQuery.query.slice(0, 2),
            {
                "code": "Tiedot",
                "selection": {
                    "filter": "item",
                    "values": ["vm11"] // Deaths data code
                }
            }
        ]
    };

    // Function to fetch data
    const fetchData = async (options) => {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    };

    // Fetch birth and death data concurrently
    try {
        const [birthData, deathData] = await Promise.all([
            fetchData({
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(birthQuery)
            }),
            fetchData({
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(deathQuery)
            })
        ]);

        if (birthData && deathData) {
            const years = Object.values(birthData.dimension.Vuosi.category.label);
            const births = birthData.value;
            const deaths = deathData.value;

            return { years, births, deaths };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching birth and death data:', error);
        return null;
    }
};

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
        selectedDataType = 'birth-death';
        alert('Switched to Birth and Death Data');
    } else if (boxId === 'migration-data-box') {
        selectedDataType = 'migration';
        alert('Switched to Migration Statistics');
    } else if (boxId === 'population-data-box') {
        selectedDataType = 'population';
        alert('Switched to Population Data');
    }

    // Update map styles
    GeoJsonLayer.setStyle(getStyle);
});

// Function to navigate to the chart page with selected data type
function viewChart(municipalityCode, municipalityName) {
    const encodedName = encodeURIComponent(municipalityName);
    const chartUrl = `charts.html?code=${municipalityCode}&name=${encodedName}&dataType=${selectedDataType}`;
    window.location.href = chartUrl;
}

// Event Listener for Popup Buttons
map.on('popupopen', function(e) {
    const layer = e.popup._source;
    const municipalityCodeRaw = layer.feature.properties.kunta;
    const municipalityCode = municipalityCodeRaw.padStart(3, '0');
    const municipalityName = layer.feature.properties.nimi;

    const viewChartButtonId = `view-chart-${municipalityCode}`;

    const popupNode = e.popup.getElement();
    const viewChartButton = popupNode.querySelector(`#${viewChartButtonId}`);

    if (viewChartButton) {
        viewChartButton.addEventListener('click', function() {
            viewChart(municipalityCode, municipalityName);
        });
    }
});

// Initialize Data Fetching
async function initialize() {
    await FetchingData();

    const populationData = await fetchPopulationData();
    if (populationData) {
        processPopulationData(populationData);
    } else {
        console.error('Population data could not be fetched.');
    }
}

// Call the initialize function
initialize();
