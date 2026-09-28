import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  ArrowDown,
  ArrowUp,
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  Gauge,
  Globe2,
  LoaderCircle,
  MapPin,
  Moon,
  Search,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
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

async function loadWeather(city) {
  const { data: locations } = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
    params: { name: city, count: 1, language: 'en', format: 'json' },
  })
  if (!locations.results?.length) throw new Error(`We couldn't find ${city}. Try another city.`)

  const location = locations.results[0]
  const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: 'auto',
      forecast_days: 7,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,visibility',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
    },
  })
  const currentDetails = weatherDetails(data.current.weather_code)

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
    forecast: data.daily.time.map((date, index) => ({
      day: dayName(new Date(`${date}T12:00:00`), index),
      date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`)),
      icon: weatherDetails(data.daily.weather_code[index]).icon,
      high: Math.round(data.daily.temperature_2m_max[index]),
      low: Math.round(data.daily.temperature_2m_min[index]),
      rain: data.daily.precipitation_probability_max[index] || 0,
    })),
  }
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

      <section className="forecast-section">
        <div className="section-header"><div><p className="eyebrow">Looking ahead</p><h2>7-day forecast</h2></div><span className="forecast-note">Live data · auto-refreshes every 10 min</span></div>
        <div className="forecast-grid">{weather.forecast.map((day) => <article className="forecast-day" key={`${day.day}-${day.date}`}><p className="forecast-day-name">{day.day}</p><p className="forecast-date">{day.date}</p><div className="forecast-icon">{weatherIcon(day.icon, 30)}</div><div className="forecast-temp"><strong>{day.high}°</strong><span>{day.low}°</span></div><p className="rain-chance"><CloudRain size={13} /> {day.rain}%</p></article>)}</div>
      </section>
      <footer>Weatherly <span>•</span> simple weather, thoughtfully presented</footer>
    </main>
  )
}

export default App
