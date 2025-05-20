import requests
import numpy as np
import matplotlib.pyplot as plt
import powerlaw

# Download country data from the REST Countries API
url = "https://restcountries.com/v3.1/all"
response = requests.get(url)
if response.status_code != 200:
    raise Exception("Error downloading data from REST Countries API.")
data = response.json()

# Extract populations (ignoring zeros)
populations = [country.get('population', 0) for country in data if country.get('population', 0) > 0]
populations = np.array(populations)

# Plot the histogram on a log-log scale
plt.figure(figsize=(8, 6))
bins = np.logspace(np.log10(populations.min()), np.log10(populations.max()), 50)
plt.hist(populations, bins=bins, color='skyblue', edgecolor='black', alpha=0.7)
plt.xscale('log')
plt.yscale('log')
plt.xlabel('Population (log scale)')
plt.ylabel('Count (log scale)')
plt.title('Histogram of Country Populations (Log–Log)')
plt.show()
