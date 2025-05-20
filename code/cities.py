import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import requests
import powerlaw
from io import StringIO

# 1. Download US cities data from Plotly's GitHub dataset
url = "https://raw.githubusercontent.com/plotly/datasets/master/2014_us_cities.csv"
response = requests.get(url)
if response.status_code != 200:
    raise Exception("Error downloading data from Plotly dataset.")
# Read the CSV from the downloaded content
df = pd.read_csv(StringIO(response.content.decode('utf-8')))

print(df.columns)
# 2. Extract populations
# The dataset contains a "Population" column.
populations = df["pop"].values
# Filter out any zero (or invalid) populations
populations = populations[populations > 0]

# 3. Plot a histogram on a log–log scale
plt.figure(figsize=(8, 6))
bins = np.logspace(np.log10(populations.min()), np.log10(populations.max()), 30)
plt.hist(populations, bins=bins, color='skyblue', edgecolor='black', alpha=0.7)
plt.xscale('log')
plt.yscale('log')
plt.xlabel('Population (log scale)')
plt.ylabel('Count (log scale)')
plt.title('Histogram of US Cities Populations (Log–Log)')

plt.show()
