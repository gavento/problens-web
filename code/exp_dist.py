import numpy as np
import matplotlib.pyplot as plt

# Define grid for x1 and x2
x = np.linspace(0, 1, 300)
y = np.linspace(0, 1, 300)
X, Y = np.meshgrid(x, y)

# Compute joint PDF for independent Exponential(1)
Z = np.exp(-X - Y)

# Plot heatmap of the density function
plt.figure(figsize=(8, 8))
im = plt.imshow(Z, origin='lower', extent=(0, 1, 0, 1))
cbar = plt.colorbar(im)

# Remove the tick labels on the colorbar
cbar.set_ticks([])

# Use mathtext for subscripts and enlarge font size
plt.xlabel(r'$x_1$', fontsize=16)
plt.ylabel(r'$x_2$', fontsize=16)

plt.show()
