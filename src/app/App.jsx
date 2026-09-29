import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDown, ArrowUp, CloudRain, CloudSun, Droplets, Flower2, Gauge, Globe2, Leaf,
  LoaderCircle, MapPin, Moon, Search, Sprout, Sun, Sunrise, Sunset, Wind, X,
} from 'lucide-react'
import MapRadar from '../features/map/MapRadar'
import { aqiDetails, buildGardenAdvice, demoWeather, DEFAULT_CITY, pollenLevel, RECENT_CITIES } from '../features/weather/weatherData'
import { loadWeather } from '../features/weather/weatherApi'

function weatherIcon(type, size = 28) {
  if (type === 'rain') return <CloudRain size={size} strokeWidth={1.6} />
  if (type === 'sunny') return <Sun size={size} strokeWidth={1.6} />
  return <CloudSun size={size} strokeWidth={1.6} />
}

function Stat({ icon, label, value, unit }) {
  return <div className="stat-item"><span className="stat-icon">{icon}</span><div><p className="stat-label">{label}</p><p className="stat-value">{value}<small>{unit}</small></p></div></div>
}

export default function App() {
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

  useEffect(() => { refreshWeather(DEFAULT_CITY) }, [])
  useEffect(() => {
    const timer = window.setInterval(async () => {
      try { setWeather(await loadWeather(selectedCity)) } catch { setError('The automatic weather update failed. We will try again soon.') }
    }, 10 * 60 * 1000)
    return () => window.clearInterval(timer)
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
        <div className="brand" aria-label="Weatherly"><span className="brand-mark"><CloudSun size={21} /></span><span>weatherly</span></div>
        <div className="topbar-actions"><span className="live-status"><span className="status-dot" /> Live weather</span><button className="icon-button" onClick={() => setIsDark((value) => !value)} aria-label="Toggle dark mode" title="Toggle dark mode">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button></div>
      </header>

      <section className="hero-row">
        <div><p className="eyebrow">Your daily outlook</p><h1>Make plans with<br /><em>better weather.</em></h1><p className="hero-copy">A clear view of what’s happening outside, wherever you are.</p></div>
        <form className="search-wrap" onSubmit={(event) => { event.preventDefault(); refreshWeather(cityInput) }}><Search size={19} /><input value={cityInput} onChange={(event) => setCityInput(event.target.value)} placeholder="Search a city..." aria-label="Search for a city" />{cityInput && <button type="button" className="clear-search" onClick={() => setCityInput('')} aria-label="Clear search"><X size={15} /></button>}<button className="search-button" type="submit">Search</button></form>
      </section>
      {error && <div className="error-message" role="alert">{error}</div>}

      <div className="dashboard-grid">
        <section className="current-card panel">
          <div className="card-heading"><div><div className="location"><MapPin size={16} /> {weather.city}, {weather.country}</div><p className="muted">{dateLabel} · {weather.updatedAt}</p></div>{loading ? <LoaderCircle className="spin" size={22} /> : <span className="current-tag">Current</span>}</div>
          <div className="temperature-block"><div className="main-weather-icon">{weatherIcon(weather.icon || 'partly', 72)}</div><div className="temperature">{weather.temperature}<sup>°</sup></div><div className="condition-copy"><strong>{weather.condition}</strong><span>{weather.description}</span></div></div>
          <div className="high-low"><span><ArrowUp size={15} /> {weather.high}°</span><span><ArrowDown size={15} /> {weather.low}°</span><span>Feels like {weather.feelsLike}°</span></div>
          <div className="stats-grid"><Stat icon={<Droplets size={19} />} label="Humidity" value={weather.humidity} unit="%" /><Stat icon={<Wind size={19} />} label="Wind" value={weather.wind} unit=" km/h" /><Stat icon={<Gauge size={19} />} label="Pressure" value={weather.pressure} unit=" hPa" /><Stat icon={<Globe2 size={19} />} label="Visibility" value={weather.visibility} unit=" km" /></div>
        </section>

        <aside className="side-column">
          <section className="sun-card panel"><div className="card-heading"><div><p className="section-label">Daylight</p><h2>Sunrise & sunset</h2></div><Sun size={20} className="sun-icon" /></div><div className="sun-path"><span className="sun-orb" /><span className="sun-arc" /></div><div className="sun-times"><span><Sunrise size={16} /><small>Sunrise</small><strong>{weather.sunrise}</strong></span><span><Sunset size={16} /><small>Sunset</small><strong>{weather.sunset}</strong></span></div></section>
          <section className="recent-card panel"><p className="section-label">Quick search</p><h2>Recent cities</h2><div className="recent-list">{RECENT_CITIES.map((city) => <button key={city} onClick={() => refreshWeather(city)}><MapPin size={14} />{city}<span>→</span></button>)}</div></section>
        </aside>
      </div>

      <div className="insight-grid">
        <section className="garden-card panel"><div className="feature-heading"><div><p className="section-label">Garden guide</p><h2>Grow with the forecast</h2></div><span className="feature-icon green"><Sprout size={21} /></span></div><div className="garden-advice"><div className="advice-row"><span className="advice-icon">{gardenAdvice.watering.icon === 'rain' ? <CloudRain size={18} /> : <Droplets size={18} />}</span><div><strong>{gardenAdvice.watering.title}</strong><p>{gardenAdvice.watering.detail}</p></div></div><div className="advice-row"><span className="advice-icon"><Leaf size={18} /></span><div><strong>{gardenAdvice.planting.title}</strong><p>{gardenAdvice.planting.detail}</p></div></div></div></section>
        <section className="air-card panel"><div className="feature-heading"><div><p className="section-label">Live air</p><h2>Air quality</h2></div><span className={`feature-icon ${airDetails.tone}`}><Activity size={20} /></span></div><div className="aqi-reading"><strong>{liveAqi ?? '—'}</strong><span>US AQI</span><em className={airDetails.tone}>{airDetails.label}</em></div><p className="feature-description">{airDetails.description}</p><div className="mini-stats"><span><small>PM2.5</small><strong>{weather.airQuality?.pm25 ?? '—'}<i> μg/m³</i></strong></span><span><small>PM10</small><strong>{weather.airQuality?.pm10 ?? '—'}<i> μg/m³</i></strong></span></div></section>
        <section className="pollen-card panel"><div className="feature-heading"><div><p className="section-label">Seasonal signal</p><h2>Pollen</h2></div><span className="feature-icon amber"><Flower2 size={20} /></span></div><div className="pollen-status"><span className="status-dot" /> {weather.pollen?.status || 'Checking regional data'}</div><div className="pollen-list"><span><small>Grass</small><strong>{pollenLevel(weather.pollen?.grass)}</strong></span><span><small>Birch</small><strong>{pollenLevel(weather.pollen?.birch)}</strong></span><span><small>Ragweed</small><strong>{pollenLevel(weather.pollen?.ragweed)}</strong></span></div></section>
      </div>

      <MapRadar weather={weather} />
      <section className="forecast-section"><div className="section-header"><div><p className="eyebrow">Looking ahead</p><h2>7-day forecast</h2></div><span className="forecast-note">Live data · auto-refreshes every 10 min</span></div><div className="forecast-grid">{weather.forecast.map((day) => <article className="forecast-day" key={`${day.day}-${day.date}`}><p className="forecast-day-name">{day.day}</p><p className="forecast-date">{day.date}</p><div className="forecast-icon">{weatherIcon(day.icon, 30)}</div><div className="forecast-temp"><strong>{day.high}°</strong><span>{day.low}°</span></div><p className="rain-chance"><CloudRain size={13} /> {day.rain}%</p></article>)}</div></section>
      <footer>Weatherly <span>•</span> simple weather, thoughtfully presented</footer>
    </main>
  )
}
