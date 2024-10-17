// js/dataHandler.js

//File for handling all operations with data, 4 APIs therefor file is big.,

// Add global variables
window.MunicipalityChange = {};
window.positiveMigrationData = {};
window.negativeMigrationData = {};
window.populationDataByMunicipality = {};
window.birthDataByMunicipality = {};
window.deathDataByMunicipality = {};

// **New Global Variables for Employment Data**
window.employmentRateByMunicipality = {};
window.unemploymentRateByMunicipality = {};
window.dependencyRatioByMunicipality = {};

/**
 * Function to handle each feature (municipality) on the map
 */
window.onEachFeature = async (feature, layer) => {
    if (!feature.properties.kunta) return;

    const municipalityName = feature.properties.nimi;
    const municipalityCodeRaw = feature.properties.kunta;
    const municipalityCode = municipalityCodeRaw.padStart(3, '0');

    // Map the municipality code to its name
    window.MunicipalityChange[municipalityCode] = municipalityName;

    layer.on('click', async (e) => {
        if (window.selectedDataType === 'migration') {
            let code = 'KU' + municipalityCode;
            let positiveMigrationValue = window.positiveMigrationData[code];
            let negativeMigrationValue = window.negativeMigrationData[code];

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
        } else if (window.selectedDataType === 'birth-death') {
            // Display pre-fetched birth and death data
            const births = window.birthDataByMunicipality[municipalityCode];
            const deaths = window.deathDataByMunicipality[municipalityCode];

            if (births === undefined || deaths === undefined) {
                alert('Birth and death data not available for this municipality.');
                return;
            }

            const netChange = births - deaths;

            layer.bindPopup(
                `<div>
                    <ul>
                        <li><strong>Municipality:</strong> ${municipalityName}</li>
                        <li><strong>Year:</strong> 2021</li>
                        <li><strong>Births:</strong> ${births}</li>
                        <li><strong>Deaths:</strong> ${deaths}</li>
                        <li><strong>Net Change:</strong> ${netChange}</li>
                    </ul>
                    <button id="view-chart-${municipalityCode}">View Chart</button>
                </div>`
            ).openPopup();
        } else if (window.selectedDataType === 'population') {
            const population = window.populationDataByMunicipality[municipalityCode];

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
        } else if (window.selectedDataType === 'employment') {
            const employmentRate = window.employmentRateByMunicipality[municipalityCode];
            const unemploymentRate = window.unemploymentRateByMunicipality[municipalityCode];
            const dependencyRatio = window.dependencyRatioByMunicipality[municipalityCode];

            if (employmentRate === undefined || unemploymentRate === undefined || dependencyRatio === undefined) {
                alert('Employment data not available for this municipality.');
                return;
            }

            layer.bindPopup(
                `<div>
                    <ul>
                        <li><strong>Municipality:</strong> ${municipalityName}</li>
                        <li><strong>Year:</strong> 2021</li>
                        <li><strong>Employment Rate:</strong> ${employmentRate}%</li>
                        <li><strong>Unemployment Rate:</strong> ${unemploymentRate}%</li>
                        <li><strong>Dependency Ratio:</strong> ${dependencyRatio}</li>
                    </ul>
                    <button id="view-chart-${municipalityCode}">View Chart</button>
                </div>`
            ).openPopup();
        }
    });

    layer.bindTooltip(municipalityName);
};

/**
 * Function to determine style based on selected data type
 */
window.getStyle = (feature) => {
    const municipalityCodeRaw = feature.properties.kunta;
    const municipalityCode = municipalityCodeRaw.padStart(3, '0');

    if (window.selectedDataType === 'population') {
        const population = window.populationDataByMunicipality[municipalityCode];

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
    } else if (window.selectedDataType === 'migration') {
        // Styling logic for migration data
        const municipalityCodeFull = 'KU' + municipalityCode;
        const positiveMigrationValue = window.positiveMigrationData[municipalityCodeFull];
        const negativeMigrationValue = window.negativeMigrationData[municipalityCodeFull];

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
    } else if (window.selectedDataType === 'birth-death') {
        const births = window.birthDataByMunicipality[municipalityCode];
        const deaths = window.deathDataByMunicipality[municipalityCode];

        if (births !== undefined && deaths !== undefined) {
            const netChange = births - deaths;
            const color = getColorForBirthDeath(netChange);

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
    } else if (window.selectedDataType === 'employment') {
        const employmentRate = window.employmentRateByMunicipality[municipalityCode];

        if (employmentRate !== undefined) {
            // Define a color scale based on employment rate
            let color = getColorForEmployment(employmentRate);

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
        // Default style
        return {
            weight: 1,
            color: 'black',
            fillColor: '#ccc',
            fillOpacity: 0.7
        };
    }
};

/**
 * Function to determine color based on population
 */
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

/**
 * Function to determine color based on net birth-death
 */
function getColorForBirthDeath(netChange) {
    return netChange > 1000 ? '#006400' : 
           netChange > 500  ? '#228B22' : 
           netChange > 0    ? '#32CD32' : 
           netChange > -500 ? '#FFD700' : 
           netChange > -1000? '#FFA500' : 
           netChange > -2000? '#FF8C00' : 
                                 '#FF0000';  
}

/**
 * Function to determine color based on employment rate
 */
function getColorForEmployment(employmentRate) {
    return employmentRate > 80 ? '#006400' : 
           employmentRate > 60 ? '#228B22' : 
           employmentRate > 40 ? '#32CD32' : 
           employmentRate > 20 ? '#FFD700' : 
           employmentRate > 0  ? '#FFA500' : 
                                 '#FF0000';  
}

/**
 * Function to fetch and process map data
 */
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
            window.positiveMigrationData[code] = positiveValues[idx];
        });

        // Process Negative Migration Data
        const negativeValues = NegativeMigration.dataset.value;
        const negCodes = NegativeMigration.dataset.dimension.Lähtöalue.category.index;

        Object.keys(negCodes).forEach((code) => {
            let idx = negCodes[code];
            window.negativeMigrationData[code] = negativeValues[idx];
        });

        // **Fetch Employment Data**
        const employmentData = await fetchEmploymentData();
        if (employmentData) {
            window.processEmploymentData(employmentData);
        } else {
            console.error('Employment data could not be fetched.');
        }

        // Create the GeoJSON layer after fetching all necessary data
        window.GeoJsonLayer = L.geoJSON(geoData, {
            onEachFeature: window.onEachFeature,
            style: window.getStyle,
        }).addTo(window.map);

        window.map.fitBounds(window.GeoJsonLayer.getBounds());

    } catch (error) {
        console.error('Error fetching map data:', error);
    }
}

/**
 * Function to fetch population data
 */
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
    while (Object.keys(window.MunicipalityChange).length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    populationQuery.query[1].selection.values = Object.keys(window.MunicipalityChange).map(code => 'KU' + code);

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

/**
 * Function to process population data
 */
window.processPopulationData = (populationData) => {
    const areaDimension = populationData.dimension.Alue.category;
    const areas = areaDimension.index;
    const values = populationData.value;

    Object.keys(areas).forEach((areaCode, idx) => {
        const code = areaCode.replace('KU', '');
        const population = values[idx]; // Since we only have one year
        window.populationDataByMunicipality[code] = population;
    });
};

/**
 * Function to fetch birth and death data for all municipalities
 */
async function fetchAllBirthAndDeathData() {
    const url = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/statfin_synt_pxt_12dy.px";

    // Define the latest year
    const latestYear = "2021"; // Update this if needed

    const birthQuery = {
        "query": [
            {
                "code": "Vuosi",
                "selection": {
                    "filter": "item",
                    "values": [latestYear]
                }
            },
            {
                "code": "Alue",
                "selection": {
                    "filter": "item",
                    "values": Object.keys(window.MunicipalityChange).map(code => 'KU' + code)
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
                    "values": [latestYear]
                }
            },
            {
                "code": "Alue",
                "selection": {
                    "filter": "item",
                    "values": Object.keys(window.MunicipalityChange).map(code => 'KU' + code)
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

    // Function to fetch data
    const fetchData = async (query) => {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(query)
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    };

    try {
        const [birthData, deathData] = await Promise.all([
            fetchData(birthQuery),
            fetchData(deathQuery)
        ]);

        // Process Birth Data
        const birthAreas = birthData.dimension.Alue.category.index;
        const birthValues = birthData.value;

        Object.keys(birthAreas).forEach((areaCode, idx) => {
            const code = areaCode.replace('KU', '');
            const births = birthValues[idx];
            window.birthDataByMunicipality[code] = births;
        });

        // Process Death Data
        const deathAreas = deathData.dimension.Alue.category.index;
        const deathValues = deathData.value;

        Object.keys(deathAreas).forEach((areaCode, idx) => {
            const code = areaCode.replace('KU', '');
            const deaths = deathValues[idx];
            window.deathDataByMunicipality[code] = deaths;
        });

        console.log('Birth and Death data fetched and processed.');

    } catch (error) {
        console.error('Error fetching birth and death data:', error);
    }
}

/**
 * Function to fetch employment-related data
 */
async function fetchEmploymentData() {
    const employmentDataURL = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/tyokay/statfin_tyokay_pxt_115x.px"; // Replace with the correct URL if different

    const employmentQuery = {
        "query": [
            {
                "code": "Vuosi",
                "selection": {
                    "filter": "item",
                    "values": ["2021"] // Latest year; adjust if needed
                }
            },
            {
                "code": "Alue",
                "selection": {
                    "filter": "item",
                    "values": Object.keys(window.MunicipalityChange).map(code => 'KU' + code)
                }
            },
            {
                "code": "Tiedot",
                "selection": {
                    "filter": "item",
                    "values": ["tyollisyysaste", "tyottomyysaste", "taloudellinenhuoltosuhde"] // Employment indicators
                }
            }
        ],
        "response": { "format": "json-stat2" }
    };

    try {
        const response = await fetch(employmentDataURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(employmentQuery)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response (Employment):', errorText);
            throw new Error(`Failed to fetch employment data: ${response.status} ${response.statusText}`);
        }

        const employmentData = await response.json();
        return employmentData;

    } catch (error) {
        console.error('Error fetching employment data:', error);
        return null;
    }
}

/**
 * Function to process employment data
 */
window.processEmploymentData = (employmentData) => {
    if (!employmentData || !employmentData.dimension || !employmentData.value) {
        console.error('Invalid employment data structure.');
        return;
    }

    const areaDimension = employmentData.dimension.Alue.category;
    const areas = areaDimension.index;
    const values = employmentData.value;

    // Assuming the data is structured with Tiedot as the second dimension
    // Find the index for each "Tiedot" variable
    const tiedotIndex = employmentData.dimension.Tiedot.category.index;

    Object.keys(areas).forEach((areaCode, idx) => {
        const code = areaCode.replace('KU', '');
        const areaValueIndex = areas[areaCode];

       
        const baseIndex = idx * 3; // 3 variables per municipality

        const employmentRate = values[baseIndex]; // tyollisyysaste
        const unemploymentRate = values[baseIndex + 1]; // tyottomyysaste
        const dependencyRatio = values[baseIndex + 2]; // taloudellinenhuoltosuhde

        window.employmentRateByMunicipality[code] = employmentRate;
        window.unemploymentRateByMunicipality[code] = unemploymentRate;
        window.dependencyRatioByMunicipality[code] = dependencyRatio;
    });

    console.log('Employment data fetched and processed.');
};

/**
 * Initialize Data Fetching and Processing
 */
async function initializeData() {
    await FetchingData();

    const populationData = await fetchPopulationData();
    if (populationData) {
        window.processPopulationData(populationData);
    } else {
        console.error('Population data could not be fetched.');
    }

    // Fetch Birth and Death Data for All Municipalities
    await fetchAllBirthAndDeathData();

    // **Fetch Employment Data**
    const employmentData = await fetchEmploymentData();
    if (employmentData) {
        window.processEmploymentData(employmentData);
    } else {
        console.error('Employment data could not be fetched.');
    }

    // Optionally, redraw the GeoJsonLayer to apply new styles
    if (window.GeoJsonLayer) {
        window.GeoJsonLayer.setStyle(window.getStyle);
    }
    
}

// Start data initialization
initializeData();
