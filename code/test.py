import numpy as np
import pandas as pd
import statsmodels.api as sm

# Set seed for reproducibility
np.random.seed(42)

# Generate sample data
n = 100
x = np.random.uniform(0, 10, n)
# True model: y = 2 + 3.5*x + noise, where noise ~ N(0, 1.5^2)
y = 2 + 3.5 * x + np.random.normal(0, 1.5, n)
data = pd.DataFrame({'x': x, 'y': y})

# Prepare the design matrix by adding a constant (for the intercept)
X = sm.add_constant(data['x'])

# Fit the OLS model
model = sm.OLS(data['y'], X)
results = model.fit()

# Print the summary of the fitted model
print(results.summary())

# Extract the estimated coefficients
coefficients = results.params
print("Coefficients:")
print(coefficients)

# In statsmodels, mse_resid gives the mean squared error of the residuals,
# which is an estimate for sigma^2.
sigma_squared = results.mse_resid
print("Residual variance estimate (sigma^2):", sigma_squared)
