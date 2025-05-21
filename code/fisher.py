import numpy as np
import matplotlib.pyplot as plt

def function(p):
    """Calculate 1/(p(1-p)) for values in the range (0,1)"""
    return 1 / (p * (1 - p))

# Create array of p values, avoiding exact 0 and 1 to prevent division by zero
p_values = np.linspace(0.001, 0.999, 1000)
f_values = function(p_values)

# Create the plot
plt.figure(figsize=(10, 6))
plt.plot(p_values, f_values)

# Add labels and title
plt.xlabel('p')
plt.ylabel('f(p) = 1/(p(1-p))')
plt.title('Function f(p) = 1/(p(1-p)) over [0,1]')

# Add horizontal line for the segment [0,1]
plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
plt.plot([0, 1], [0, 0], 'k-', linewidth=2)

# Add grid
plt.grid(True, alpha=0.3)

# Set y-axis limit to show the interesting part of the function
plt.ylim(0, 30)  # Adjust as needed to show the curve clearly

# Show the plot
plt.tight_layout()
plt.show()