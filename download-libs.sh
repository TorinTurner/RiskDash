#!/bin/bash
# Download all required libraries for air-gapped access
# Run this script when you have network access

LIBS_DIR="$(dirname "$0")/libs"
mkdir -p "$LIBS_DIR"

echo "Downloading libraries to $LIBS_DIR..."

# React 18
echo "Downloading React 18..."
curl -sL "https://unpkg.com/react@18/umd/react.production.min.js" -o "$LIBS_DIR/react.production.min.js"

# ReactDOM 18
echo "Downloading ReactDOM 18..."
curl -sL "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" -o "$LIBS_DIR/react-dom.production.min.js"

# Babel standalone
echo "Downloading Babel standalone..."
curl -sL "https://unpkg.com/@babel/standalone/babel.min.js" -o "$LIBS_DIR/babel.min.js"

# XLSX (SheetJS)
echo "Downloading XLSX (SheetJS)..."
curl -sL "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" -o "$LIBS_DIR/xlsx.full.min.js"

# Chart.js
echo "Downloading Chart.js..."
curl -sL "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" -o "$LIBS_DIR/chart.min.js"

# Tailwind CSS (standalone build)
echo "Downloading Tailwind CSS..."
curl -sL "https://cdn.tailwindcss.com/3.4.1" -o "$LIBS_DIR/tailwind.min.js"

echo ""
echo "Verifying downloads..."
for file in react.production.min.js react-dom.production.min.js babel.min.js xlsx.full.min.js chart.min.js tailwind.min.js; do
    if [ -s "$LIBS_DIR/$file" ]; then
        SIZE=$(wc -c < "$LIBS_DIR/$file")
        echo "✓ $file ($SIZE bytes)"
    else
        echo "✗ $file FAILED"
    fi
done

echo ""
echo "Done! Libraries saved to $LIBS_DIR"
