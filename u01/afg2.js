var data = [
    {
        values: [28, 11.5, 25, 25, 10.5],
        labels: [
            "Informatik",
            "überfachliche Kompetenz",
            "Physik, Medizin, Biologie",
            "Medizininformatik",
            "Mathematik",
        ],
        type: "pie",
    },
];

var layout = {
    height: 400,
    width: 500,
};

Plotly.newPlot("myDiv", data, layout);
