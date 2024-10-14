// js/chartDataFetcher.js

/**
 * Function to fetch data from a given URL.
 * @param {string} url - The API endpoint URL.
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

    try {
        const data = await fetchData(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(query)
        });
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

    try {
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
                    "values": [window.selectedMunicipalityCode]
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
        const data = await fetchData(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(query)
        });

        // Extract employment rate
        const employmentRate = data.value[0]; // Assuming single value
        return employmentRate;
    } catch (error) {
        console.error('Error fetching employment rate data:', error);
        throw error;
    }
}
