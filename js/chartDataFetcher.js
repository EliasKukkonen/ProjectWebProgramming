// js/chartDataFetcher.js

/**
 * Function to fetch data from a given URL.
 * @param {string} url - The API endpoint URL.
 * @param {Object} options - Fetch options (e.g., method, headers, body).
 * @returns {Object} - The JSON response from the API.
 */
async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch Error:', error);
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
                    "values": [window.selectedMunicipalityCode]
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

    const data = await fetchData(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query)
    });
    return data;
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
                    "values": [window.selectedMunicipalityCode]
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
                    "values": [window.selectedMunicipalityCode]
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

    // Fetch births and deaths concurrently
    const [birthData, deathData] = await Promise.all([
        fetchData(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(birthQuery)
        }),
        fetchData(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(deathQuery)
        })
    ]);

    if (birthData && deathData) {
        const parsedYears = Object.values(birthData.dimension.Vuosi.category.label);
        const births = birthData.value;
        const deaths = deathData.value;

        return { years: parsedYears, births, deaths };
    } else {
        throw new Error('Incomplete birth or death data received.');
    }
}

/**
 * Function to fetch Employment Rate data from the StatFin API.
 * @returns {Object} - An object containing employment, unemployment rates, and dependency ratio.
 */
async function fetchEmploymentRateData() {
    const url = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/tyokay/statfin_tyokay_pxt_115x.px";

    const years = ["2021"]; // Fetching data for the latest year

    const employmentQuery = {
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
                    "values": [window.selectedMunicipalityCode]
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
        "response": {
            "format": "json-stat2"
        }
    };

    const data = await fetchData(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employmentQuery)
    });

    // Extract employment data
    const employmentData = data.value; // [tyollisyysaste, tyottomyysaste, taloudellinenhuoltosuhde]
    const employmentRate = employmentData[0];
    const unemploymentRate = employmentData[1];
    const dependencyRatio = employmentData[2];

    return { employmentRate, unemploymentRate, dependencyRatio };
}
