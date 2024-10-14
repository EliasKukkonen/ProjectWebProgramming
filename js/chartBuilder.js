// js/chartBuilder.js

/**
 * Function to build and render the chart based on the selected data type.
 */
async function buildChart() {
  
        if (window.selectedDataType === 'population') {
            // Fetch Population Data
            const populationData = await fetchPopulationData();

            // **Corrected Data Access**
            // Extract years and population values correctly
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
                title: `Population in ${window.selectedMunicipalityName}`,
                data: chartData,
                type: 'line', // Line chart type
                height: 450,
                colors: ['#7cd6fd'],
                // Ensuring responsiveness by setting width to 100%
                axisOptions: {
                    xIsSeries: 1
                }
            });

        } else if (window.selectedDataType === 'birth-death') {
            // Fetch Birth and Death Data
            const birthDeathData = await fetchBirthAndDeathData();

            // **No Change Needed Here** (Assuming data is correctly fetched and structured)
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
                title: `Births and Deaths in ${window.selectedMunicipalityName}`,
                data: chartData,
                type: 'axis-mixed', // Mixed chart type
                height: 450,
                colors: ['#63d0ff', '#363636'],
                axisOptions: {
                    xIsSeries: 1
                }
            });

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
                title: `Migration Statistics in ${window.selectedMunicipalityName}`,
                data: chartData,
                type: 'pie', // Pie chart type
                height: 450,
                colors: ['#00a86b', '#ff7f50']
            });

        } else if (window.selectedDataType === 'employment') {
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
                title: `Employment Rate in ${window.selectedMunicipalityName} (2021)`,
                data: chartData,
                type: 'pie', // Pie chart type
                height: 450,
                colors: ['#1E90FF', '#FF6347']
            });

        } else {
            // Default or unknown data type
            alert('Unknown data type selected.');
            console.warn('Selected Data Type:', window.selectedDataType);
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
 * Function to build the chart and attach download listeners when the page is fully loaded.
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await buildChart();
        attachDownloadListeners();
    } catch (error) {
        console.error('Error during chart initialization:', error);
        alert('Failed to initialize chart. Please try again later.');
    }
});
