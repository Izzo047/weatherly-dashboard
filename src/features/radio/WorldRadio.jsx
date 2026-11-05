import React, { useEffect, useRef, useState } from 'react'
import { Headphones, LoaderCircle, MapPin, Play, Radio, Search, Signal, Volume2 } from 'lucide-react'
import { loadRadioCountries, searchRadioStations } from './radioApi'
import WorldRadioMap from './WorldRadioMap'

export default function WorldRadio() {
  const [countries, setCountries] = useState([])
  const [countryCode, setCountryCode] = useState('')
  const [query, setQuery] = useState('')
  const [stations, setStations] = useState([])
  const [selectedStation, setSelectedStation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playbackError, setPlaybackError] = useState('')
  const audioRef = useRef(null)

  useEffect(() => {
    let active = true
    loadRadioCountries().then((result) => {
      if (active) setCountries(result)
    }).catch(() => {
      if (active) setError('Country filters could not be loaded. You can still browse worldwide stations.')
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const result = await searchRadioStations({ countryCode, query })
        if (active) setStations(result)
      } catch {
        if (active) setError('The station directory is unavailable right now. Please try again shortly.')
      } finally {
        if (active) setLoading(false)
      }
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [countryCode, query])

  useEffect(() => {
    const audio = audioRef.current
    if (!selectedStation || !audio) return
    audio.load()
    audio.play().catch(() => setPlaybackError('This stream could not start here. Try another station or visit its station page.'))
  }, [selectedStation])

  const selectStation = (station) => {
    setPlaybackError('')
    setSelectedStation(station)
  }

  return (
    <section className="radio-page" aria-labelledby="radio-title">
      <header className="feature-intro radio-intro">
        <div><p className="eyebrow">A signal from somewhere</p><h1 id="radio-title">The world, <em>on air.</em></h1><p className="hero-copy">Find a station, settle in, and listen across borders.</p></div>
        <div className="radio-dial" aria-hidden="true"><span /><span /><span /><Radio size={30} /></div>
      </header>

      <section className="radio-console panel" aria-label="Browse radio stations">
        <div className="radio-console-heading"><div><span className="live-dot" /> LIVE DIRECTORY</div><span>Public stations · worldwide</span></div>
        <div className="radio-filters">
          <label className="radio-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search station names..." aria-label="Search station names" /></label>
          <label className="country-select"><MapPin size={17} /><select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} aria-label="Filter by country"><option value="">Worldwide</option>{countries.map((country) => <option key={country.iso_3166_1} value={country.iso_3166_1}>{country.name} · {country.stationcount.toLocaleString()}</option>)}</select></label>
        </div>
        <p className="radio-source-note">Browse community-listed public streams from India, Japan, the US, the UK, and beyond. Stream availability depends on each station.</p>
      </section>

      {selectedStation && <section className="now-playing panel" aria-label="Now playing">
        <span className="playing-art"><Volume2 size={23} /></span>
        <div className="playing-details"><small>NOW TUNING IN</small><strong>{selectedStation.name}</strong><span>{selectedStation.country || 'Worldwide'}{selectedStation.codec ? ` · ${selectedStation.codec}` : ''}{selectedStation.bitrate ? ` · ${selectedStation.bitrate} kbps` : ''}</span></div>
        <audio ref={audioRef} controls autoPlay src={selectedStation.url_resolved || selectedStation.url} onError={() => setPlaybackError('This station stream is unavailable. Try another station.')} onPlay={() => setPlaybackError('')} aria-label={`Listen to ${selectedStation.name}`} />
        {playbackError && <p className="playback-error" role="status">{playbackError}</p>}
      </section>}

      <WorldRadioMap stations={stations} selectedStation={selectedStation} onSelectStation={selectStation} />

      <section className="station-section" aria-labelledby="station-list-title">
        <div className="station-heading"><div><p className="eyebrow">Tune in</p><h2 id="station-list-title">{countryCode ? countries.find((country) => country.iso_3166_1 === countryCode)?.name || 'Country stations' : 'Around the dial'}</h2></div><span>{loading ? 'Finding stations...' : `${stations.length} stations`}</span></div>
        {error && <p className="radio-error" role="alert">{error}</p>}
        {loading && stations.length === 0 && <div className="radio-loading"><LoaderCircle className="spin" size={20} /> Searching the airwaves...</div>}
        {!loading && !error && stations.length === 0 && <div className="radio-empty"><Headphones size={24} /><p>No stations matched. Try another country or search.</p></div>}
        <div className="station-grid">
          {stations.map((station) => <article className={`station-card panel ${selectedStation?.stationuuid === station.stationuuid ? 'selected' : ''}`} key={station.stationuuid}>
            <div className="station-card-top"><span className="station-mark"><Radio size={18} /></span><span className="station-bitrate">{station.bitrate ? `${station.bitrate} kbps` : 'LIVE'}</span></div>
            <h3 title={station.name}>{station.name}</h3>
            <p className="station-country"><MapPin size={13} />{station.country || 'Unknown country'}{station.language ? ` · ${station.language.split(',')[0]}` : ''}</p>
            <div className="station-card-bottom"><span><Signal size={13} /> {station.codec || 'Stream'}</span><button onClick={() => selectStation(station)} aria-label={`Play ${station.name}`} aria-pressed={selectedStation?.stationuuid === station.stationuuid}><Play size={15} fill="currentColor" /> Listen</button></div>
            {station.homepage && <a className="station-homepage" href={station.homepage} target="_blank" rel="noreferrer">Station website</a>}
          </article>)}
        </div>
      </section>
      <footer>Station listings from Radio Browser <span>•</span> streams are provided by their broadcasters</footer>
    </section>
  )
}
