Output location fix for defaultDir derivation
- Imported dirname and join from path
- Derived default outputDir as join(dirname(inputFile), 'output')
- Used nullish coalescing to respect user-provided --output-dir
- Left all other behaviour intact (no changes when user specifies --output-dir)
