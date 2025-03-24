import plotly.express as px
import pandas as pd

data = {
    "Names": ["Informatik", "überfachlichte Kompetenz", "Physik, Medizin, Biologie", "Medizininformatik", "Mathematik"],
    "Values": [28, 11.5, 25, 25, 10.5]
}

fig1 = px.pie(data, names='Names', values='Values')

fig1.show()
