# ConFigTree task runner — run `just` to see recipes

# List available recipes (default)
default:
    @just --list

# Run the golden test suite
test:
    node test/run-generators.mjs

# Regenerate docs/reference.md AUTO blocks from source
docs:
    node scripts/extract-docs.mjs

# Check docs/reference.md for drift — exits 1 if out of date (use in CI)
docs-check:
    node scripts/extract-docs.mjs --check

# Regenerate all xlsx test fixtures via the Python generator
fixtures:
    cd test/fixtures && uv run generate_fixtures.py

# Serve the app locally on http://localhost:{{port}} (default 8000)
serve port="8000":
    cd public && python3 -m http.server {{port}}

# Trigger the GitHub Pages deploy workflow
deploy:
    gh workflow run deploy.yml --ref main

# Show recent deploy run statuses
deploy-status:
    gh run list --workflow=deploy.yml --limit=5

# Scan xlsx fixtures for a literal string in any cell (example: `just scan Acme`)
scan pattern:
    uv run python scripts/scan-fixtures.py {{pattern}}
