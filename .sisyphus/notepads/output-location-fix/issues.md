## Issues
- None detected beyond the existing CLI argument handling; default output-dir now derives from inputFile.
- If inputFile path is relative and the CWD changes, ensure dirname(inputFile) resolves consistently; using join(dirname(inputFile), 'output') relies on inputFile being correct.
