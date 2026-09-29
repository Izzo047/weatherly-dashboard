# Weatherly

[![Deploy to GitHub Pages](https://github.com/Izzo047/weatherly-dashboard/actions/workflows/deploy.yml/badge.svg)](https://github.com/Izzo047/weatherly-dashboard/actions/workflows/deploy.yml)

A beginner-friendly live weather dashboard powered by Open-Meteo, Axios, Leaflet, and Tailwind CSS.

## Features

- Live current conditions and seven-day forecast for searched cities.
- Gardening guidance based on the upcoming temperature and rain pattern.
- Live US AQI, PM2.5, and PM10 readings when available.
- Regional grass, birch, and ragweed pollen data when reported by the feed.
- OpenStreetMap location map with a switchable RainViewer radar layer.
- Recent cities, dark mode, responsive layout, and automatic ten-minute refreshes.

## Run locally

```bash
npm install
npm run dev
```

For a production build, run `npm run build`. The generated `dist` folder can be hosted on any static host.

## Project structure

```text
src/
├── app/
│   ├── App.jsx             # Dashboard composition and page state
│   └── styles/index.css    # Global layout and responsive styles
├── features/
│   ├── map/MapRadar.jsx    # Leaflet map and RainViewer layer
│   └── weather/
│       ├── weatherApi.js   # Open-Meteo requests and response mapping
│       └── weatherData.js  # Weather rules, formatting, and demo data
└── main.jsx                # React application entry point
```

The root contains only project configuration, documentation, and deployment metadata. Feature-specific code stays together so each part of the dashboard can be found without searching the entire source tree.

## Join the community

Weatherly is beginner-friendly by design. You do not need to be a weather expert to help: improvements to the interface, accessibility, documentation, testing, data handling, and small fixes are all valuable.

- Read [Contributing to Weatherly](CONTRIBUTING.md) for local setup and pull request guidance.
- Browse open issues for bugs, ideas, and approachable places to start.
- Read our [Code of Conduct](CODE_OF_CONDUCT.md) and [Security Policy](SECURITY.md) before participating.

## GitHub Pages

Every push to `main` runs the [GitHub Actions deployment workflow](.github/workflows/deploy.yml). It installs dependencies with `npm ci`, builds the Vite app, and publishes `dist` to GitHub Pages. For a new repository, open **Settings → Pages** and set the source to **GitHub Actions**.

The app uses Open-Meteo's public, no-key APIs for geocoding, weather, and air quality. It loads live conditions, a seven-day forecast, particulate readings, and pollen fields where the selected region supports them. RainViewer supplies the radar frame metadata and tiles; Leaflet renders the map with OpenStreetMap tiles. The same live behavior works on GitHub Pages without exposing an API key.

Map data attribution is shown in the map itself. Open-Meteo data is available under its [terms](https://open-meteo.com/en/license), and RainViewer radar tiles are subject to its [usage policy](https://www.rainviewer.com/api.html).
