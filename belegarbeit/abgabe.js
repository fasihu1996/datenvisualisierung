async function createEnhancedMap() {
    // geojson data, high detail, for German states
    const geojson = await d3.json(
        "https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/main/2_bundeslaender/1_sehr_hoch.geo.json"
    );

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

    // update slider
    let slider = document.getElementById("year-slider");
    slider.min = 0;
    slider.max = years.length - 1;
    slider.value = currentYearIndex;

    let label = document.getElementById("year-label");
    label.innerText = `Year: ${years[currentYearIndex]}`;

    slider.oninput = function () {
        currentYearIndex = +this.value;
        label.innerText = `Year: ${years[currentYearIndex]}`;
        updateMap();
    };

    // get dropdown selection
    const attributeDropdown = document.getElementById("attribute-dropdown");
    attributeDropdown.onchange = function () {
        updateMap();
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
        let colorscale = "Viridis";
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
            colorscale = "YlOrBr";
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
        };

        Plotly.newPlot("map", [trace], layout, { responsive: true });
    }

    updateMap();
}

createEnhancedMap();
