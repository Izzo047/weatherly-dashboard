import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CloudRain,
  CloudSun,
  CircleAlert,
  Droplets,
  Flower2,
  Gauge,
  Globe2,
  Leaf,
  LoaderCircle,
  Map as MapIcon,
  MapPin,
  Moon,
  Radar,
  Search,
  ShieldCheck,
  Sun,
  Sunrise,
  Sunset,
  Sprout,
  Wind,
  X,
} from 'lucide-react'

const DEFAULT_CITY = 'Portland'

const demoWeather = {
  city: 'Portland',
  country: 'US',
  updatedAt: 'Today, 10:42 AM',
  temperature: 18,
  feelsLike: 17,
  condition: 'Partly cloudy',
  description: 'A bright start with passing clouds',
  humidity: 64,
  wind: 11,
  pressure: 1017,
  visibility: 9.8,
  sunrise: '5:24 AM',
  sunset: '8:48 PM',
  high: 21,
  low: 12,
  forecast: [
    { day: 'Today', date: 'Jun 12', icon: 'partly', high: 21, low: 12, rain: 18 },
    { day: 'Fri', date: 'Jun 13', icon: 'sunny', high: 24, low: 14, rain: 4 },
    { day: 'Sat', date: 'Jun 14', icon: 'rain', high: 19, low: 13, rain: 62 },
    { day: 'Sun', date: 'Jun 15', icon: 'partly', high: 22, low: 12, rain: 21 },
    { day: 'Mon', date: 'Jun 16', icon: 'sunny', high: 26, low: 15, rain: 3 },
    { day: 'Tue', date: 'Jun 17', icon: 'sunny', high: 27, low: 16, rain: 2 },
    { day: 'Wed', date: 'Jun 18', icon: 'partly', high: 23, low: 14, rain: 11 },
  ],
  latitude: 45.52,
  longitude: -122.67,
  airQuality: { aqi: 31, pm25: 10.3, pm10: 10.6 },
  pollen: { status: 'Not reported for this region', level: 'Unavailable', grass: null, birch: null, ragweed: null },
}

const recentCities = ['Portland', 'Reykjavik', 'Tokyo']

function formatLocalTime(value) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function dayName(date, index) {
  if (index === 0) return 'Today'
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date)
}

function weatherIcon(type, size = 28) {
  if (type === 'rain') return <CloudRain size={size} strokeWidth={1.6} />
  if (type === 'sunny') return <Sun size={size} strokeWidth={1.6} />
  return <CloudSun size={size} strokeWidth={1.6} />
}

function weatherDetails(code) {
  if ([95, 96, 99].includes(code)) return { condition: 'Thunderstorms', icon: 'rain', description: 'Thunderstorms nearby' }
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { condition: 'Rainy', icon: 'rain', description: 'Rain showers expected' }
  if ([1, 2].includes(code)) return { condition: 'Partly cloudy', icon: 'partly', description: 'A mix of sun and clouds' }
  if (code === 3) return { condition: 'Overcast', icon: 'partly', description: 'Cloudy skies' }
  if (code === 45 || code === 48) return { condition: 'Foggy', icon: 'partly', description: 'Reduced visibility' }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: 'Snowy', icon: 'rain', description: 'Snow showers expected' }
  return { condition: 'Clear', icon: 'sunny', description: 'Clear skies' }
}

function aqiDetails(aqi) {
  if (aqi <= 50) return { label: 'Good', description: 'Air quality is clean for outdoor plans', tone: 'good' }
  if (aqi <= 100) return { label: 'Moderate', description: 'Most people can enjoy the outdoors', tone: 'moderate' }
  if (aqi <= 150) return { label: 'Sensitive groups', description: 'Consider lighter outdoor activity', tone: 'caution' }
  return { label: 'Unhealthy', description: 'Limit prolonged outdoor exertion', tone: 'poor' }
}

function pollenLevel(value) {
  if (value === null || value === undefined) return 'Not reported'
  if (value < 1) return 'Low'
  if (value < 10) return 'Moderate'
  return 'High'
}

function buildGardenAdvice(current, forecast) {
  const wettestDay = forecast.reduce((wettest, day) => day.rain > wettest.rain ? day : wettest, forecast[0])
  const hotDay = Math.max(...forecast.map((day) => day.high))
  const watering = wettestDay.rain >= 60
    ? { title: 'Pause watering', detail: `${wettestDay.day} brings a ${wettestDay.rain}% rain chance. Let the soil soak naturally.`, icon: 'rain' }
    : current.temperature >= 27
      ? { title: 'Water early', detail: 'Warm conditions call for deep watering before the sun is high.', icon: 'water' }
      : { title: 'Water as needed', detail: 'Check the top few centimetres of soil before watering beds.', icon: 'water' }
  const planting = hotDay > 30
    ? { title: 'Protect tender plants', detail: `A ${hotDay}° high is on the way. Add shade and mulch around roots.` }
    : current.temperature >= 12 && wettestDay.rain < 70
      ? { title: 'Good planting window', detail: 'Mild temperatures and a manageable rain pattern favour new starts.' }
      : { title: 'Prep and plan', detail: 'Use the cooler window for weeding, composting, and seed planning.' }
  return { watering, planting }
}

async function loadWeather(city) {
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
  const aqi = air?.us_aqi ?? air?.european_aqi ?? null
  const pollen = { grass: air?.grass_pollen ?? null, birch: air?.birch_pollen ?? null, ragweed: air?.ragweed_pollen ?? null }
  const liveForecast = data.daily.time.map((date, index) => ({
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
    forecast: liveForecast,
    latitude: location.latitude,
    longitude: location.longitude,
    airQuality: {
      aqi,
      pm25: air?.pm2_5 ?? null,
      pm10: air?.pm10 ?? null,
    },
    pollen: {
      ...pollen,
      status: pollen.grass === null && pollen.birch === null && pollen.ragweed === null ? 'Not reported for this region' : 'Live regional reading',
      level: pollenLevel(Math.max(...Object.values(pollen).filter((value) => value !== null), 0)),
    },
  }
}

function MapRadar({ weather }) {
  const mapElement = useRef(null)
  const mapInstance = useRef(null)
  const locationMarker = useRef(null)
  const radarLayer = useRef(null)
  const [mode, setMode] = useState('map')
  const [radarFrame, setRadarFrame] = useState(null)
  const [radarUpdated, setRadarUpdated] = useState(null)

  useEffect(() => {
    if (!mapElement.current || mapInstance.current) return undefined

    const map = L.map(mapElement.current, { zoomControl: false }).setView([weather.latitude, weather.longitude], 8)
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapInstance.current || !weather.latitude || !weather.longitude) return
    mapInstance.current.setView([weather.latitude, weather.longitude], 8)
    if (locationMarker.current) locationMarker.current.remove()
    locationMarker.current = L.circleMarker([weather.latitude, weather.longitude], {
      radius: 8,
      color: '#f7fbf4',
      weight: 3,
      fillColor: '#3e7654',
      fillOpacity: 1,
    }).addTo(mapInstance.current)
    locationMarker.current.bindTooltip(`${weather.city}, ${weather.country}`, { direction: 'top', offset: [0, -8] })
  }, [weather.latitude, weather.longitude, weather.city, weather.country])

  useEffect(() => {
    let active = true
    axios.get('https://api.rainviewer.com/public/weather-maps.json')
      .then(({ data }) => {
        const frame = data.radar?.past?.at(-1)
        if (active && frame) {
          setRadarFrame(`https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`)
          setRadarUpdated(new Date(frame.time * 1000))
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!mapInstance.current) return
    if (radarLayer.current) {
      radarLayer.current.remove()
      radarLayer.current = null
    }
    if (mode === 'radar' && radarFrame) {
      radarLayer.current = L.tileLayer(radarFrame, { opacity: 0.65, zIndex: 5, tileSize: 256 }).addTo(mapInstance.current)
    }
  }, [mode, radarFrame])

  return (
    <section className="map-panel panel">
      <div className="map-heading">
        <div><p className="section-label">Explore outside</p><h2>Map & radar</h2></div>
        <div className="map-modes" role="group" aria-label="Map layer">
          <button className={mode === 'map' ? 'active' : ''} onClick={() => setMode('map')}><MapIcon size={14} /> Map</button>
          <button className={mode === 'radar' ? 'active' : ''} onClick={() => setMode('radar')}><Radar size={14} /> Radar</button>
        </div>
      </div>
      <div className="map-canvas" ref={mapElement} />
      <div className="map-footer"><span><MapPin size={13} /> {weather.city}, {weather.country}</span><span>{mode === 'radar' && radarUpdated ? `Radar · ${radarUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'OpenStreetMap'}</span></div>
    </section>
  )
}

function Stat({ icon, label, value, unit }) {
  return (
    <div className="stat-item">
      <span className="stat-icon">{icon}</span>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}<small>{unit}</small></p>
      </div>
    </div>
  )
}

function App() {
  const [cityInput, setCityInput] = useState('')
  const [weather, setWeather] = useState(demoWeather)
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDark, setIsDark] = useState(() => localStorage.getItem('weatherly-theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('weatherly-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const refreshWeather = async (requestedCity) => {
    const nextCity = requestedCity.trim()
    if (!nextCity) return
    setLoading(true)
    setError('')
    try {
      setWeather(await loadWeather(nextCity))
      setSelectedCity(nextCity)
      setCityInput('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Weather service is unavailable right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshWeather(DEFAULT_CITY)
  }, [])

  useEffect(() => {
    const refreshTimer = window.setInterval(async () => {
      try {
        setWeather(await loadWeather(selectedCity))
      } catch {
        setError('The automatic weather update failed. We will try again soon.')
      }
    }, 10 * 60 * 1000)

    return () => window.clearInterval(refreshTimer)
  }, [selectedCity])

  const dateLabel = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()), [])
  const gardenAdvice = useMemo(() => buildGardenAdvice(weather, weather.forecast), [weather])
  const liveAqi = weather.airQuality?.aqi
  const airDetails = liveAqi === null || liveAqi === undefined
    ? { label: 'No reading', description: 'Air quality data is temporarily unavailable', tone: 'unknown' }
    : aqiDetails(liveAqi)

  return (
    <main className="app-shell">
      <div className="grain" />
      <header className="topbar">
        <a className="brand" href="/" aria-label="Weatherly home">
          <span className="brand-mark"><CloudSun size={21} /></span>
          <span>weatherly</span>
        </a>
        <div className="topbar-actions">
          <span className="live-status"><span className="status-dot" /> Live weather</span>
          <button className="icon-button" onClick={() => setIsDark((value) => !value)} aria-label="Toggle dark mode" title="Toggle dark mode">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <section className="hero-row">
        <div>
          <p className="eyebrow">Your daily outlook</p>
          <h1>Make plans with<br /><em>better weather.</em></h1>
          <p className="hero-copy">A clear view of what’s happening outside, wherever you are.</p>
        </div>
        <form className="search-wrap" onSubmit={(event) => { event.preventDefault(); refreshWeather(cityInput) }}>
          <Search size={19} />
          <input value={cityInput} onChange={(event) => setCityInput(event.target.value)} placeholder="Search a city..." aria-label="Search for a city" />
          {cityInput && <button type="button" className="clear-search" onClick={() => setCityInput('')} aria-label="Clear search"><X size={15} /></button>}
          <button className="search-button" type="submit">Search</button>
        </form>
      </section>

      {error && <div className="error-message" role="alert">{error}</div>}

      <div className="dashboard-grid">
        <section className="current-card panel">
          <div className="card-heading">
            <div>
              <div className="location"><MapPin size={16} /> {weather.city}, {weather.country}</div>
              <p className="muted">{dateLabel} · {weather.updatedAt}</p>
            </div>
            {loading ? <LoaderCircle className="spin" size={22} /> : <span className="current-tag">Current</span>}
          </div>
          <div className="temperature-block">
            <div className="main-weather-icon">{weatherIcon(weather.icon || 'partly', 72)}</div>
            <div className="temperature">{weather.temperature}<sup>°</sup></div>
            <div className="condition-copy"><strong>{weather.condition}</strong><span>{weather.description}</span></div>
          </div>
          <div className="high-low"><span><ArrowUp size={15} /> {weather.high}°</span><span><ArrowDown size={15} /> {weather.low}°</span><span>Feels like {weather.feelsLike}°</span></div>
          <div className="stats-grid">
            <Stat icon={<Droplets size={19} />} label="Humidity" value={weather.humidity} unit="%" />
            <Stat icon={<Wind size={19} />} label="Wind" value={weather.wind} unit=" km/h" />
            <Stat icon={<Gauge size={19} />} label="Pressure" value={weather.pressure} unit=" hPa" />
            <Stat icon={<Globe2 size={19} />} label="Visibility" value={weather.visibility} unit=" km" />
          </div>
        </section>

        <aside className="side-column">
          <section className="sun-card panel">
            <div className="card-heading"><div><p className="section-label">Daylight</p><h2>Sunrise & sunset</h2></div><Sun size={20} className="sun-icon" /></div>
            <div className="sun-path"><span className="sun-orb" /><span className="sun-arc" /></div>
            <div className="sun-times"><span><Sunrise size={16} /><small>Sunrise</small><strong>{weather.sunrise}</strong></span><span><Sunset size={16} /><small>Sunset</small><strong>{weather.sunset}</strong></span></div>
          </section>
          <section className="recent-card panel">
            <p className="section-label">Quick search</p><h2>Recent cities</h2>
            <div className="recent-list">{recentCities.map((recentCity) => <button key={recentCity} onClick={() => refreshWeather(recentCity)}><MapPin size={14} />{recentCity}<span>→</span></button>)}</div>
          </section>
        </aside>
      </div>

      <div className="insight-grid">
        <section className="garden-card panel">
          <div className="feature-heading"><div><p className="section-label">Garden guide</p><h2>Grow with the forecast</h2></div><span className="feature-icon green"><Sprout size={21} /></span></div>
          <div className="garden-advice">
            <div className="advice-row"><span className="advice-icon">{gardenAdvice.watering.icon === 'rain' ? <CloudRain size={18} /> : <Droplets size={18} />}</span><div><strong>{gardenAdvice.watering.title}</strong><p>{gardenAdvice.watering.detail}</p></div></div>
            <div className="advice-row"><span className="advice-icon"><Leaf size={18} /></span><div><strong>{gardenAdvice.planting.title}</strong><p>{gardenAdvice.planting.detail}</p></div></div>
          </div>
        </section>

        <section className="air-card panel">
          <div className="feature-heading"><div><p className="section-label">Live air</p><h2>Air quality</h2></div><span className={`feature-icon ${airDetails.tone}`}><Activity size={20} /></span></div>
          <div className="aqi-reading"><strong>{liveAqi ?? '—'}</strong><span>US AQI</span><em className={airDetails.tone}>{airDetails.label}</em></div>
          <p className="feature-description">{airDetails.description}</p>
          <div className="mini-stats"><span><small>PM2.5</small><strong>{weather.airQuality?.pm25 ?? '—'}<i> μg/m³</i></strong></span><span><small>PM10</small><strong>{weather.airQuality?.pm10 ?? '—'}<i> μg/m³</i></strong></span></div>
        </section>

        <section className="pollen-card panel">
          <div className="feature-heading"><div><p className="section-label">Seasonal signal</p><h2>Pollen</h2></div><span className="feature-icon amber"><Flower2 size={20} /></span></div>
          <div className="pollen-status"><span className="status-dot" /> {weather.pollen?.status || 'Checking regional data'}</div>
          <div className="pollen-list"><span><small>Grass</small><strong>{pollenLevel(weather.pollen?.grass)}</strong></span><span><small>Birch</small><strong>{pollenLevel(weather.pollen?.birch)}</strong></span><span><small>Ragweed</small><strong>{pollenLevel(weather.pollen?.ragweed)}</strong></span></div>
        </section>
      </div>

      <MapRadar weather={weather} />

      <section className="forecast-section">
        <div className="section-header"><div><p className="eyebrow">Looking ahead</p><h2>7-day forecast</h2></div><span className="forecast-note">Live data · auto-refreshes every 10 min</span></div>
        <div className="forecast-grid">{weather.forecast.map((day) => <article className="forecast-day" key={`${day.day}-${day.date}`}><p className="forecast-day-name">{day.day}</p><p className="forecast-date">{day.date}</p><div className="forecast-icon">{weatherIcon(day.icon, 30)}</div><div className="forecast-temp"><strong>{day.high}°</strong><span>{day.low}°</span></div><p className="rain-chance"><CloudRain size={13} /> {day.rain}%</p></article>)}</div>
      </section>
      <footer>Weatherly <span>•</span> simple weather, thoughtfully presented</footer>
    </main>
  )
}

export default App
