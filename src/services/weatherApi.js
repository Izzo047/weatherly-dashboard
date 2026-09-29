import axios from 'axios'
import { dayName, formatLocalTime, pollenLevel, weatherDetails } from '../data/weather'

export async function loadWeather(city) {
  const { data: locations } = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
    params: { name: city, count: 1, language: 'en', format: 'json' },
  })
  if (!locations.results?.length) throw new Error(`We couldn't find ${city}. Try another city.`)

  const location = locations.results[0]
  const [{ data }, airResponse] = await Promise.all([
    axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: 'auto',
        forecast_days: 7,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,visibility',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
      },
    }),
    axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: 'auto',
        forecast_days: 1,
        current: 'pm10,pm2_5,us_aqi,european_aqi,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen',
      },
    }).catch(() => ({ data: null })),
  ])

  const currentDetails = weatherDetails(data.current.weather_code)
  const air = airResponse.data?.current
  const pollen = { grass: air?.grass_pollen ?? null, birch: air?.birch_pollen ?? null, ragweed: air?.ragweed_pollen ?? null }
  const forecast = data.daily.time.map((date, index) => ({
    day: dayName(new Date(`${date}T12:00:00`), index),
    date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`)),
    icon: weatherDetails(data.daily.weather_code[index]).icon,
    high: Math.round(data.daily.temperature_2m_max[index]),
    low: Math.round(data.daily.temperature_2m_min[index]),
    rain: data.daily.precipitation_probability_max[index] || 0,
  }))

  return {
    city: location.name,
    country: location.country_code,
    updatedAt: 'Updated just now',
    temperature: Math.round(data.current.temperature_2m),
    feelsLike: Math.round(data.current.apparent_temperature),
    condition: currentDetails.condition,
    description: currentDetails.description,
    icon: currentDetails.icon,
    humidity: data.current.relative_humidity_2m,
    wind: Math.round(data.current.wind_speed_10m),
    pressure: Math.round(data.current.surface_pressure),
    visibility: (data.current.visibility / 1000).toFixed(1),
    sunrise: formatLocalTime(data.daily.sunrise[0]),
    sunset: formatLocalTime(data.daily.sunset[0]),
    high: Math.round(data.daily.temperature_2m_max[0]),
    low: Math.round(data.daily.temperature_2m_min[0]),
    forecast,
    latitude: location.latitude,
    longitude: location.longitude,
    airQuality: { aqi: air?.us_aqi ?? air?.european_aqi ?? null, pm25: air?.pm2_5 ?? null, pm10: air?.pm10 ?? null },
    pollen: {
      ...pollen,
      status: pollen.grass === null && pollen.birch === null && pollen.ragweed === null ? 'Not reported for this region' : 'Live regional reading',
      level: pollenLevel(Math.max(...Object.values(pollen).filter((value) => value !== null), 0)),
    },
  }
}
