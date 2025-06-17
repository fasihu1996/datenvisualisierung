async function createEnhancedMap() {
    // geojson data, high detail, for German states
    const geojson = await d3.json("bundeslaender.geojson");

    // using local csv file converted from txt file
    const airTempData = await d3.dsv(";", "airTemp.csv");
    const percipitationData = await d3.dsv(";", "percipitation.csv");
    const sunshineData = await d3.dsv(";", "sunshine.csv");

    const years = airTempData.map((row) => row["Jahr"].trim());
    let currentYearIndex = years.length - 1;

    // map geojson to csv
    const stateMap = {
        "Baden-Württemberg": "Baden-Wuerttemberg",
        Bayern: "Bayern",
        Berlin: "Brandenburg/Berlin",
        Brandenburg: "Brandenburg",
        Bremen: "Niedersachsen/Hamburg/Bremen",
        Hamburg: "Niedersachsen/Hamburg/Bremen",
        Hessen: "Hessen",
        "Mecklenburg-Vorpommern": "Mecklenburg-Vorpommern",
        Niedersachsen: "Niedersachsen",
        "Nordrhein-Westfalen": "Nordrhein-Westfalen",
        "Rheinland-Pfalz": "Rheinland-Pfalz",
        Saarland: "Saarland",
        Sachsen: "Sachsen",
        "Sachsen-Anhalt": "Sachsen-Anhalt",
        "Schleswig-Holstein": "Schleswig-Holstein",
        Thüringen: "Thueringen",
    };

    let slider = document.getElementById("year-slider");
    slider.min = 0;
    slider.max = years.length - 1;
    slider.value = currentYearIndex;

    // Dynamically generate datalist ticks for the slider
    let datalist = document.getElementById("year-ticks");
    if (!datalist) {
        datalist = document.createElement("datalist");
        datalist.id = "year-ticks";
        slider.setAttribute("list", "year-ticks");
        slider.parentNode.insertBefore(datalist, slider.nextSibling);
    }
    datalist.innerHTML = "";
    years.forEach((year, idx) => {
        // Show label every 5 years, first and last year
        if (idx % 5 === 0 || idx === 0 || idx === years.length - 1) {
            let option = document.createElement("option");
            option.value = idx;
            option.label = year;
            datalist.appendChild(option);
        }
    });

    // Improved label positioning for better alignment
    let labelsContainer = document.getElementById("year-slider-labels");
    if (labelsContainer) {
        labelsContainer.innerHTML = "";

        // Create container with absolute positioning
        labelsContainer.style.position = "relative";
        labelsContainer.style.width = "100%";
        labelsContainer.style.height = "20px";
        labelsContainer.style.marginTop = "5px";

        // Filter which years to show labels for
        const labeledYears = years.filter(
            (year, idx) => idx % 5 === 0 || idx === years.length - 1
        );
        const labeledIndices = years
            .map((year, idx) =>
                idx % 5 === 0 || idx === years.length - 1 ? idx : -1
            )
            .filter((idx) => idx !== -1);

        // Calculate positions
        const totalTicks = years.length - 1; // Number of intervals on slider

        labeledIndices.forEach((yearIdx, i) => {
            const year = years[yearIdx];
            const span = document.createElement("span");

            // Position as percentage of slider width
            const percentage = (yearIdx / totalTicks) * 100;

            span.textContent = year;
            span.style.position = "absolute";
            span.style.left = `${percentage}%`;
            span.style.transform = "translateX(-50%)"; // Center the label on tick
            span.style.textAlign = "center";
            span.style.fontSize = "0.9em";

            labelsContainer.appendChild(span);
        });
    }

    let label = document.getElementById("year-label");
    label.innerText = `Year: ${years[currentYearIndex]}`;

    slider.oninput = function () {
        currentYearIndex = +this.value;
        label.innerText = `Year: ${years[currentYearIndex]}`;
        updateMap();
        updatePlot();
    };

    // get dropdown selection
    const attributeDropdown = document.getElementById("attribute-dropdown");
    attributeDropdown.onchange = function () {
        updateMap();
        updatePlot();
    };

    function getStateValues(yearIdx) {
        let data;
        const selectedAttribute = attributeDropdown.value;
        if (selectedAttribute === "airtemp") {
            data = airTempData;
        } else if (selectedAttribute === "percipitation") {
            data = percipitationData;
        } else if (selectedAttribute === "sunshine") {
            data = sunshineData;
        }
        const row = data[yearIdx];
        // map values to state names
        const map = new Map();
        for (const [geoName, csvCol] of Object.entries(stateMap)) {
            let val = row[csvCol];
            if (val !== undefined) {
                val = parseFloat(val.replace(",", "."));
                map.set(geoName, isNaN(val) ? null : val);
            } else {
                map.set(geoName, null);
            }
        }
        return map;
    }

    function updateMap() {
        const stateValues = getStateValues(currentYearIndex);
        const selectedAttribute = attributeDropdown.value;

        // default values
        let colorscale = "Hot";
        let zmin = 6,
            zmax = 12,
            colorbarTitle = "Air Temperature (°C)",
            hoverUnit = "°C";
        let layoutTitle = `Air Temperature By State (${years[currentYearIndex]})`;

        if (selectedAttribute === "percipitation") {
            colorscale = "Blues";
            zmin = 400;
            zmax = 1200;
            colorbarTitle = "Percipitation (mm)";
            hoverUnit = "mm";
            layoutTitle = `Percipitation By State (${years[currentYearIndex]})`;
        } else if (selectedAttribute === "sunshine") {
            colorscale = "YlOrRd";
            zmin = 1200;
            zmax = 2200;
            colorbarTitle = "Sunshine Duration (h)";
            hoverUnit = "h";
            layoutTitle = `Sunshine Duration By State (${years[currentYearIndex]})`;
        }

        const locations = [];
        const values = [];
        const text = [];
        const customdata = [];

        geojson.features.forEach((feature, index) => {
            const stateName = feature.properties.name;
            let value = stateValues.get(stateName);
            locations.push(index);
            values.push(value ?? null);
            text.push(stateName);
            customdata.push({ name: stateName, value: value });
        });

        const trace = {
            type: "choropleth",
            locationmode: "geojson-id",
            geojson: geojson,
            locations: locations,
            z: values,
            text: text,
            customdata: customdata,
            hovertemplate:
                "<b>%{customdata.name}</b><br>" +
                `${
                    colorbarTitle.split(" ")[0]
                }: %{customdata.value} ${hoverUnit}<br>` +
                "<extra></extra>",
            colorscale: colorscale,
            reversescale: true,
            showscale: true,
            colorbar: {
                title: {
                    text: colorbarTitle,
                    side: "right",
                },
                thickness: 15,
                len: 0.7,
                tickformat: ".0f",
            },
            zmin: zmin,
            zmax: zmax,
        };

        const layout = {
            title: {
                text: layoutTitle,
                x: 0.5,
            },
            geo: {
                fitbounds: "locations",
                visible: false,
                projection: { type: "mercator" },
            },
            margin: { t: 60, b: 0, l: 0, r: 100 },
            dragmode: false,
            font: {
                family: "Lucida Sans",
                size: 14,
            },
        };

        Plotly.newPlot("map", [trace], layout, { responsive: true });
    }

    function updatePlot() {
        const airTempAverages = calculateYearlyAverages(airTempData, stateMap);
        const percipitationAverages = calculateYearlyAverages(
            percipitationData,
            stateMap
        );
        const sunshineAverages = calculateYearlyAverages(
            sunshineData,
            stateMap
        );

        const selectedAttribute = attributeDropdown.value;
        let yValues, layoutTitle, yAxisTitle, line, markerColor, range, dtick;

        if (selectedAttribute === "percipitation") {
            yValues = percipitationAverages;
            layoutTitle = `Average Percipitation in Germany (${years[0]}–${
                years[years.length - 1]
            })`;
            yAxisTitle = "Percipitation (mm)";
            line = { color: "blue", width: 0.5 };
            markerColor = "blue";
            range = [500, 1000];
            dtick = 50;
        } else if (selectedAttribute === "sunshine") {
            yValues = sunshineAverages;
            layoutTitle = `Average Sunshine Duration in Germany (${years[0]}–${
                years[years.length - 1]
            })`;
            yAxisTitle = "Sunshine Duration (h)";
            line = { color: "orange", width: 0.5 };
            markerColor = "orange";
            range = [1300, 2100];
            dtick = 50;
        } else if (selectedAttribute === "airtemp") {
            yValues = airTempAverages;
            layoutTitle = `Average Air Temperature in Germany (${years[0]}–${
                years[years.length - 1]
            })`;
            yAxisTitle = "Air Temperature (°C)";
            line = { color: "red", width: 0.5 };
            markerColor = "red";
            range = [6, 14];
            dtick = 0.5;
        }

        // trace
        const diagramTrace = {
            type: "scatter",
            mode: "lines+markers",
            x: years,
            y: yValues,
            line: line,
            marker: { size: 6, color: markerColor },
            name: "Average",
            hoverinfo: "x+y",
        };

        // current marker
        const highlightTrace = {
            type: "scatter",
            mode: "markers",
            x: [years[currentYearIndex]],
            y: [yValues[currentYearIndex]],
            marker: {
                size: 16,
                color: "black",
                symbol: "circle",
                line: { color: "white", width: 2 },
            },
            name: "Selected Year",
            hoverinfo: "x+y",
        };

        const diagramLayout = {
            title: {
                text: layoutTitle,
                x: 0.5,
            },
            xaxis: {
                title: "Year",
                tickmode: "linear",
                dtick: 5,
            },
            yaxis: {
                title: yAxisTitle,
                rangemode: "normal",
                range: range,
                dtick: dtick,
            },
            margin: { t: 60, b: 60, l: 60, r: 40 },
            dragmode: false,
            showlegend: false,
            font: {
                family: "Lucida Sans",
                size: 14,
            },
        };

        Plotly.newPlot(
            "diagram",
            [diagramTrace, highlightTrace],
            diagramLayout,
            {
                responsive: true,
            }
        );
    }

    function calculateYearlyAverages(data, stateMap) {
        return data.map((row) => {
            let sum = 0;
            let count = 0;
            for (const csvCol of Object.values(stateMap)) {
                let val = row[csvCol];
                if (val !== undefined) {
                    val = parseFloat(val.replace(",", "."));
                    if (!isNaN(val)) {
                        sum += val;
                        count++;
                    }
                }
            }
            return count > 0 ? sum / count : null;
        });
    }

    updateMap();
    updatePlot();
}

let playInterval = null;

document.getElementById("play-button").onclick = function () {
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
        this.textContent = "Play";
        return;
    }
    this.textContent = "Pause";
    playInterval = setInterval(() => {
        let slider = document.getElementById("year-slider");
        let current = +slider.value;
        if (current < slider.max) {
            slider.value = current + 1;
            slider.dispatchEvent(new Event("input"));
        } else {
            clearInterval(playInterval);
            playInterval = null;
            this.textContent = "Play";
        }
    }, 200);
};

createEnhancedMap();
