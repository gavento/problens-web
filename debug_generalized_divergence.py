#!/usr/bin/env python3
import json

data = json.load(open('public/data/three_categories_analysis.json'))
gen_div = data['generalized_divergence_analysis']['distance_matrix']

# Check a specific pair
tiger_lion = gen_div['animal_tiger']['animal_lion']
lion_tiger = gen_div['animal_lion']['animal_tiger']

print(f'Tiger -> Lion: {tiger_lion}')
print(f'Lion -> Tiger: {lion_tiger}')
print()

# Check self-values (should be 0)
tiger_tiger = gen_div['animal_tiger']['animal_tiger']
lion_lion = gen_div['animal_lion']['animal_lion']

print(f'Tiger -> Tiger: {tiger_tiger}')
print(f'Lion -> Lion: {lion_lion}')
print()

# Check the range of all values
all_values = []
for item1 in gen_div:
    for item2 in gen_div[item1]:
        if item1 != item2:
            all_values.append(gen_div[item1][item2])

print(f'Min value: {min(all_values):.3f}')
print(f'Max value: {max(all_values):.3f}')  
print(f'Range: {max(all_values) - min(all_values):.3f}')

# Let's also check some cross-compression values from the log
print("\nSome specific values from the analysis:")
print(f"France -> Germany: {gen_div['country_france']['country_germany']:.3f}")
print(f"Germany -> France: {gen_div['country_germany']['country_france']:.3f}")