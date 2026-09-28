# Weatherly

A beginner-friendly React weather dashboard powered by Open-Meteo, Axios, and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

For a production build, run `npm run build`. The generated `dist` folder can be hosted on any static host.

## GitHub Pages

Push the project to a GitHub repository using the `main` branch. The included GitHub Actions workflow builds and deploys the site automatically. In the repository, open **Settings → Pages** and set the source to **GitHub Actions**.

The app uses Open-Meteo's public, no-key API. It geocodes the selected city, loads current conditions and a 7-day forecast, and refreshes the data whenever a city is searched. The same live behavior works on GitHub Pages without exposing an API key.
