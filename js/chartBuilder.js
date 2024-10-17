// js/chartBuilder.js

/**
 * Function to build and render the chart based on the selected data type.
 */
async function buildChart() {
    try {
        // Ensure global variables are set
        if (!window.selectedDataType || !window.selectedMunicipalityName || !window.selectedMunicipalityCode) {
            throw new Error('Selected data type or municipality details are not set.');
        }

        // Clear previous chart(s)
        const chartContainer = document.getElementById('chart');
        chartContainer.innerHTML = ''; // Remove existing charts

        let chartData;
        let chartOptions = {
            title: `Data for ${window.selectedMunicipalityName}`,
            data: {},
            type: 'line', // Default chart type
            height: 450,
            colors: ['#7cd6fd'],
            axisOptions: {
                xIsSeries: 1
            }
        };

        if (window.selectedDataType === 'population') {
            // Fetch Population Data
            const populationData = await fetchPopulationData();

            // Corrected Data Access
            const years = Object.values(populationData.dimension.Vuosi.category.label);
            const populationValues = populationData.value;

            // Prepare the chart data
            chartData = {
                labels: years,
                datasets: [
                    { name: "Population", values: populationValues, chartType: "line" }
                ]
            };

            chartOptions = {
                ...chartOptions,
                title: `Population in ${window.selectedMunicipalityName}`,
                data: chartData,
                type: 'line',
                colors: ['#7cd6fd']
            };

            new frappe.Chart("#chart", chartOptions);

        } else if (window.selectedDataType === 'birth-death') {
            // Fetch Birth and Death Data
            const birthDeathData = await fetchBirthAndDeathData();

            // Extract years, births, and deaths
            const years = birthDeathData.years;
            const births = birthDeathData.births;
            const deaths = birthDeathData.deaths;

            // Prepare the chart data
            chartData = {
                labels: years,
                datasets: [
                    { name: "Births", values: births, chartType: "bar" },
                    { name: "Deaths", values: deaths, chartType: "bar" }
                ]
            };

            chartOptions = {
                ...chartOptions,
                title: `Births and Deaths in ${window.selectedMunicipalityName}`,
                data: chartData,
                type: 'bar',
                colors: ['#63d0ff', '#363636']
            };

            new frappe.Chart("#chart", chartOptions);

        } else if (window.selectedDataType === 'migration') {
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
            const posAreaIndex = posDataset.dimension.Tuloalue.category.index[window.selectedMunicipalityCode];
            const negAreaIndex = negDataset.dimension.Lähtöalue.category.index[window.selectedMunicipalityCode];

            if (posAreaIndex === undefined || negAreaIndex === undefined) {
                alert('Migration data not available for this municipality.');
                return;
            }

            // Extract migration values
            const posMigrants = posDataset.value[posAreaIndex];
            const negMigrants = negDataset.value[negAreaIndex];

            // Prepare data for the pie chart
            chartData = {
                labels: ["In-migration", "Out-migration"],
                datasets: [
                    {
                        values: [posMigrants, negMigrants],
                        colors: ['#00a86b', '#ff7f50']
                    }
                ]
            };

            chartOptions = {
                ...chartOptions,
                title: `Migration Statistics in ${window.selectedMunicipalityName}`,
                data: chartData,
                type: 'pie',
                colors: ['#00a86b', '#ff7f50']
            };

            new frappe.Chart("#chart", chartOptions);

        } else if (window.selectedDataType === 'employment') {
            // Fetch Employment Data
            const employmentData = await fetchEmploymentRateData();

            const employmentRate = employmentData.employmentRate;
            const unemploymentRate = employmentData.unemploymentRate;
            const dependencyRatio = employmentData.dependencyRatio;

            // Prepare data for Employment Rate and Unemployment Rate
            const chartDataRates = {
                labels: ["Employment Rate (%)", "Unemployment Rate (%)", "Dependency Ratio"],
                datasets: [
                    {
                        name: "Metrics",
                        values: [employmentRate, unemploymentRate, dependencyRatio],
                        colors: ['#1E90FF', '#FF6347', '#8A2BE2']
                    }
                ]
            };

            chartOptions = {
                ...chartOptions,
                title: `Employment Statistics in ${window.selectedMunicipalityName} (2021)`,
                data: chartDataRates,
                type: 'bar',
                colors: ['#1E90FF', '#FF6347', '#8A2BE2'],
            };

            new frappe.Chart("#chart", chartOptions);
        } else {
            // Default or unknown data type
            alert('Unknown data type selected.');
            console.warn('Selected Data Type:', window.selectedDataType);
            return;
        }

    } catch (error) {
        console.error('Error building chart:', error);
        alert('An error occurred while building the chart.');
    }
}

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
        //ChatGPT helped in defining all sources-
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
        downloadLink.download = `${window.selectedMunicipalityName}_chart.svg`;

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
        //ChatGPT helped in defining all sources-
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
            downloadLink.download = `${window.selectedMunicipalityName}_chart.png`;

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
 * Function to download the chart and attach download listeners when the page is fully loaded.
 */
document.addEventListener('DOMContentLoaded', async () => {
    await buildChart();
    attachDownloadListeners();
});

/**
 * Function to attach event listeners to existing download buttons.
 */
function attachDownloadListeners() {
    const downloadPngButton = document.querySelector('.download-buttons button:nth-child(1)');
    const downloadSvgButton = document.querySelector('.download-buttons button:nth-child(2)');
    const navigationButton = document.getElementById('navigation');

    if (downloadPngButton) {
        downloadPngButton.addEventListener('click', downloadChartPNG);
    } else {
        console.warn('Download PNG button not found.');
    }

    if (downloadSvgButton) {
        downloadSvgButton.addEventListener('click', downloadChartSVG);
    } else {
        console.warn('Download SVG button not found.');
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
 * Function to navigate back.
 */
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
}
