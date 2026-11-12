import React, { useEffect, useRef, useState } from 'react'
import { Activity, CircleDot, Crosshair, ExternalLink, Gauge, LoaderCircle, Radio, Ruler, Satellite, Search, Sparkles, ZoomIn, ZoomOut } from 'lucide-react'
import '../../app/styles/satellite.css'

const CATALOG_API = 'https://celestrak.org/NORAD/elements/gp.php'
const CATALOG_PROXY = 'https://r.jina.ai/http://celestrak.org/NORAD/elements/gp.php'
const EARTH_TEXTURE = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_2048.png'
const GROUPS = [
  { label: 'All satellites', options: [{ value: 'active', label: 'All active satellites' }] },
  { label: 'Human spaceflight', options: [{ value: 'stations', label: 'Space stations' }] },
  { label: 'Communications', options: [{ value: 'starlink', label: 'Starlink constellation' }, { value: 'iridium', label: 'Iridium communications' }, { value: 'oneweb', label: 'OneWeb communications' }, { value: 'geo', label: 'Geostationary communications' }] },
  { label: 'Earth observation', options: [{ value: 'weather', label: 'Weather satellites' }, { value: 'resource', label: 'Land and resource sensing' }] },
  { label: 'Navigation', options: [{ value: 'gps-ops', label: 'GPS operations' }, { value: 'galileo', label: 'Galileo navigation' }, { value: 'beidou', label: 'BeiDou navigation' }, { value: 'glonass', label: 'GLONASS navigation' }] },
  { label: 'Science and research', options: [{ value: 'science', label: 'Science missions' }] },
]

function parseCatalog(records) {
  return records.map((record) => {
    try {
      const line = record.TLE_LINE2
      const tleEpochYear = line ? Number(record.TLE_LINE1.slice(18, 20)) : 0
      const tleEpochDay = line ? Number(record.TLE_LINE1.slice(20, 32)) : 0
      const tleEpoch = new Date(Date.UTC(tleEpochYear < 57 ? 2000 + tleEpochYear : 1900 + tleEpochYear, 0, 1))
      if (line) tleEpoch.setTime(tleEpoch.getTime() + (tleEpochDay - 1) * 86400000)
      return {
        id: String(record.NORAD_CAT_ID),
        name: record.OBJECT_NAME?.trim() || 'Unnamed satellite',
        orbital: {
          epoch: line ? tleEpoch : new Date(record.EPOCH),
          inclination: Number(line ? line.slice(8, 16) : record.INCLINATION) * Math.PI / 180,
          raan: Number(line ? line.slice(17, 25) : record.RA_OF_ASC_NODE) * Math.PI / 180,
          eccentricity: Number(line ? `0.${line.slice(26, 33)}` : record.ECCENTRICITY),
          argumentOfPerigee: Number(line ? line.slice(34, 42) : record.ARG_OF_PERICENTER) * Math.PI / 180,
          meanAnomaly: Number(line ? line.slice(43, 51) : record.MEAN_ANOMALY) * Math.PI / 180,
          meanMotion: Number(line ? line.slice(52, 63) : record.MEAN_MOTION),
        },
        inclination: `${Number(line ? line.slice(8, 16) : record.INCLINATION).toFixed(2)}°`,
        epoch: record.EPOCH || 'Current catalog epoch',
      }

    } catch {
      return null
    }
  }).filter(Boolean)
}

async function fetchCatalog(group, signal) {
  try {
    const direct = await fetch(`${CATALOG_API}?GROUP=${group}&FORMAT=json`, { signal })
    if (direct.ok) {
      const data = await direct.json()
      if (Array.isArray(data)) return data
    }
  } catch (requestError) {
    if (requestError.name === 'AbortError') throw requestError
  }
  const proxy = await fetch(`${CATALOG_PROXY}?GROUP=${group}%26FORMAT=json`, { signal })
  if (!proxy.ok) throw new Error('The orbital catalog returned an error.')
  const text = await proxy.text()
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start < 0 || end <= start) throw new Error('The orbital catalog returned an unreadable response.')
  return JSON.parse(text.slice(start, end + 1))
}

function getSatellitePosition(record, date) {
  const { orbital } = record
  const gravitationalParameter = 398600.4418
  const earthRadius = 6378.137
  const meanMotion = orbital.meanMotion * Math.PI * 2 / 86400
  const semiMajorAxis = Math.cbrt(gravitationalParameter / (meanMotion * meanMotion))
  const elapsed = (date.getTime() - orbital.epoch.getTime()) / 1000
  const meanAnomaly = orbital.meanAnomaly + meanMotion * elapsed
  let eccentricAnomaly = meanAnomaly
  for (let iteration = 0; iteration < 4; iteration += 1) eccentricAnomaly -= (eccentricAnomaly - orbital.eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) / (1 - orbital.eccentricity * Math.cos(eccentricAnomaly))
  const radius = semiMajorAxis * (1 - orbital.eccentricity * Math.cos(eccentricAnomaly))
  const trueAnomaly = 2 * Math.atan2(Math.sqrt(1 + orbital.eccentricity) * Math.sin(eccentricAnomaly / 2), Math.sqrt(1 - orbital.eccentricity) * Math.cos(eccentricAnomaly / 2))
  const argument = orbital.argumentOfPerigee + trueAnomaly
  const x = radius * (Math.cos(orbital.raan) * Math.cos(argument) - Math.sin(orbital.raan) * Math.sin(argument) * Math.cos(orbital.inclination))
  const y = radius * (Math.sin(orbital.raan) * Math.cos(argument) + Math.cos(orbital.raan) * Math.sin(argument) * Math.cos(orbital.inclination))
  const z = radius * Math.sin(argument) * Math.sin(orbital.inclination)
  const julianDate = date.getTime() / 86400000 + 2440587.5
  const centuries = (julianDate - 2451545) / 36525
  const gmst = ((280.46061837 + 360.98564736629 * (julianDate - 2451545) + .000387933 * centuries * centuries - centuries * centuries * centuries / 38710000) % 360 + 360) % 360 * Math.PI / 180
  const longitude = Math.atan2(y, x) - gmst
  const geocentricRadius = Math.sqrt(x * x + y * y + z * z)
  return {
    latitude: Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI,
    longitude: ((longitude * 180 / Math.PI + 540) % 360) - 180,
    altitude: geocentricRadius - earthRadius,
  }
}

function LiveGlobe({ records, selectedId, onSelect }) {
  const canvasRef = useRef(null)
  const earthTextureRef = useRef(null)
  const rotationRef = useRef({ longitude: -20, latitude: 8 })
  const zoomRef = useRef(1)
  const pointerRef = useRef(null)
  const hitTargetsRef = useRef([])
  const trailsRef = useRef([])
  const renderRecords = records.length > 4000
    ? records.filter((record, index) => index % Math.ceil(records.length / 4000) === 0 || record.id === selectedId)
    : records

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const context = canvas.getContext('2d')
    let frame
    let width = 0
    let height = 0
    let lastPositionUpdate = 0
    const positionCache = new Map()

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      width = bounds.width
      height = bounds.height
      const ratio = window.devicePixelRatio || 1
      canvas.width = width * ratio
      canvas.height = height * ratio
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const project = (latitude, longitude, radius, centerX, centerY) => {
      const lat = latitude * Math.PI / 180
      let delta = (longitude - rotationRef.current.longitude) * Math.PI / 180
      while (delta > Math.PI) delta -= Math.PI * 2
      while (delta < -Math.PI) delta += Math.PI * 2
      const viewLat = rotationRef.current.latitude * Math.PI / 180
      const x = Math.sin(delta) * Math.cos(lat)
      const y = Math.sin(lat) * Math.cos(viewLat) - Math.cos(lat) * Math.sin(viewLat) * Math.cos(delta)
      const z = Math.cos(lat) * Math.cos(viewLat) * Math.cos(delta) + Math.sin(lat) * Math.sin(viewLat)
      return { x: centerX + x * radius, y: centerY - y * radius, z }
    }

    const draw = () => {
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) * .32 * zoomRef.current
      const now = new Date()
      context.clearRect(0, 0, width, height)
      const stars = 75
      context.fillStyle = 'rgba(190, 235, 222, .65)'
      for (let index = 0; index < stars; index += 1) {
        const x = (index * 83) % width
        const y = (index * 47) % height
        context.fillRect(x, y, index % 4 === 0 ? 2 : 1, index % 4 === 0 ? 2 : 1)
      }

      context.save()
      context.beginPath()
      context.arc(centerX, centerY, radius, 0, Math.PI * 2)
      context.clip()
      context.strokeStyle = 'rgba(190, 239, 218, .24)'
      context.lineWidth = 1
      for (let latitude = -60; latitude <= 60; latitude += 30) {
        const start = project(latitude, -180, radius, centerX, centerY)
        const end = project(latitude, 180, radius, centerX, centerY)
        context.beginPath()
        context.moveTo(start.x, start.y)
        context.quadraticCurveTo(centerX, centerY + (centerY - start.y) * .15, end.x, end.y)
        context.stroke()
      }
      for (let longitude = -150; longitude <= 180; longitude += 30) {
        const start = project(-90, longitude, radius, centerX, centerY)
        const end = project(90, longitude, radius, centerX, centerY)
        context.beginPath()
        context.moveTo(start.x, start.y)
        context.quadraticCurveTo(centerX, centerY, end.x, end.y)
        context.stroke()
      }
      context.restore()

      context.strokeStyle = 'rgba(153, 230, 215, .55)'
      context.lineWidth = 2
      context.beginPath()
      context.arc(centerX, centerY, radius + 3, 0, Math.PI * 2)
      context.stroke()

      const hitTargets = []
      if (now.getTime() - lastPositionUpdate > 1000 || positionCache.size === 0) {
        positionCache.clear()
        renderRecords.forEach((record) => {
          const position = getSatellitePosition(record, now)
          if (position) positionCache.set(record.id, { record, position })
        })
        lastPositionUpdate = now.getTime()
      }
      positionCache.forEach(({ record, position }) => {
        const orbitalRadius = radius + Math.min(radius * .35, Math.max(12, position.altitude / 2000))
        const point = project(position.latitude, position.longitude, orbitalRadius, centerX, centerY)
        if (point.z < -.14) return
        const isSelected = record.id === selectedId
        context.fillStyle = isSelected ? '#ffd37e' : 'rgba(191, 226, 168, .7)'
        context.beginPath()
        context.arc(point.x, point.y, isSelected ? 4 : 1.7, 0, Math.PI * 2)
        context.fill()
        if (isSelected) {
          context.strokeStyle = '#ffd37e'
          context.lineWidth = 1
          context.beginPath()
          context.arc(point.x, point.y, 10, 0, Math.PI * 2)
          context.stroke()
          const trail = trailsRef.current
          trail.push(point)
          if (trail.length > 38) trail.shift()
          context.strokeStyle = 'rgba(255, 211, 126, .5)'
          context.beginPath()
          trail.forEach((trailPoint, index) => index ? context.lineTo(trailPoint.x, trailPoint.y) : context.moveTo(trailPoint.x, trailPoint.y))
          context.stroke()
        }
        hitTargets.push({ record, x: point.x, y: point.y })
      })
      hitTargetsRef.current = hitTargets
      context.fillStyle = 'rgba(202, 235, 215, .8)'
      context.font = '9px Silkscreen, monospace'
      context.fillText(`${hitTargets.length.toLocaleString()} plotted · ${records.length.toLocaleString()} tracked`, 14, height - 15)
      context.fillText('DRAG TO ROTATE · SCROLL TO ZOOM', width - 196, height - 15)
      frame = requestAnimationFrame(draw)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()
    draw()
    frame = requestAnimationFrame(draw)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [records, renderRecords, selectedId, onSelect])

  const handlePointerDown = (event) => {
    pointerRef.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const handlePointerMove = (event) => {
    if (!pointerRef.current) return
    rotationRef.current.longitude -= (event.clientX - pointerRef.current.x) * .45
    rotationRef.current.latitude = Math.max(-65, Math.min(65, rotationRef.current.latitude + (event.clientY - pointerRef.current.y) * .35))
    if (earthTextureRef.current) earthTextureRef.current.style.backgroundPosition = `${50 + rotationRef.current.longitude / 3.6}% ${50 - rotationRef.current.latitude / 3.6}%`
    pointerRef.current = { x: event.clientX, y: event.clientY }
  }
  const handlePointerUp = (event) => {
    const target = hitTargetsRef.current.reduce((closest, candidate) => {
      const distance = Math.hypot(candidate.x - event.nativeEvent.offsetX, candidate.y - event.nativeEvent.offsetY)
      return distance < (closest?.distance || 16) ? { ...candidate, distance } : closest
    }, null)
    if (target && target.distance < 16) onSelect(target.record)
    pointerRef.current = null
  }

  return <div className="live-globe-wrap">
    <div ref={earthTextureRef} className="earth-texture" style={{ backgroundImage: `url(${EARTH_TEXTURE})` }} aria-label="Realistic Earth texture" role="img" />
    <canvas ref={canvasRef} className="live-globe" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onWheel={(event) => { event.preventDefault(); zoomRef.current = Math.max(.72, Math.min(1.55, zoomRef.current - event.deltaY * .001)) }} aria-label="Interactive live satellite globe" />
    <div className="globe-controls"><button onClick={() => { zoomRef.current = Math.min(1.55, zoomRef.current + .12) }} aria-label="Zoom in"><ZoomIn size={15} /></button><button onClick={() => { zoomRef.current = Math.max(.72, zoomRef.current - .12) }} aria-label="Zoom out"><ZoomOut size={15} /></button></div>
  </div>
}

function SatelliteModel({ color }) {
  return <div className="satellite-model" style={{ '--satellite-accent': color }}>
    <span className="model-body"><i /><i /></span><span className="model-panel left-panel" /><span className="model-panel right-panel" /><span className="model-boom" /><span className="model-dish" />
  </div>
}

export default function SatelliteView() {
  const [records, setRecords] = useState([])
  const [group, setGroup] = useState('active')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    fetchCatalog(group, controller.signal)
      .then((data) => {
        const nextRecords = parseCatalog(data)
        setRecords(nextRecords)
        setSelected((current) => nextRecords.find((record) => record.id === current?.id) || nextRecords.find((record) => /ISS/i.test(record.name)) || nextRecords[0] || null)
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError('Live orbital data could not be loaded. Check your connection and try again.')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [group, retryToken])

  const selectSatellite = (record) => setSelected(record)
  const position = selected ? getSatellitePosition(selected, new Date()) : null
  const selectedColor = '#f0b45b'

  return <section className="satellite-page" aria-labelledby="satellite-title">
    <header className="feature-intro satellite-intro">
      <div><p className="eyebrow">Orbital observatory · About</p><h1 id="satellite-title">A living map of <em>our sky.</em></h1><p className="hero-copy">Live positions calculated from current orbital elements. Drag the globe to look around Earth.</p></div>
      <div className="orbit-status"><span className="orbit-status-dot" /> LIVE ORBITAL INDEX <strong>{records.length.toLocaleString()} TRACKED</strong></div>
    </header>
    <div className="catalog-toolbar panel">
      <label><Search size={15} /><select aria-label="Satellite catalog by usage" value={group} onChange={(event) => setGroup(event.target.value)}>{GROUPS.map((section) => <optgroup key={section.label} label={section.label}>{section.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</optgroup>)}</select></label>
      <span><Radio size={14} /> Categorized by usage · CelesTrak orbital elements</span>
    </div>
    {error && <p className="satellite-error" role="alert">{error} <button type="button" onClick={() => setRetryToken((current) => current + 1)}>Retry</button></p>}
    <div className="satellite-layout">
      <section className="orbit-panel panel" aria-labelledby="orbit-title">
        <div className="satellite-panel-heading"><div><p className="eyebrow">Above the atmosphere</p><h2 id="orbit-title">Live Earth orbit</h2></div><span className="orbit-legend"><i /> live position + trail</span></div>
        {loading ? <div className="satellite-loading"><LoaderCircle className="spin" size={22} /> Loading the satellite catalog...</div> : <LiveGlobe records={records} selectedId={selected?.id} onSelect={selectSatellite} />}
      </section>
      <aside className="satellite-detail panel" aria-labelledby="satellite-detail-title">
        {selected ? <><div className="satellite-detail-top"><span className="detail-eyebrow"><Activity size={13} /> SELECTED OBJECT</span><span className="satellite-status">{position ? 'LIVE POSITION' : 'NO SIGNAL'}</span></div><div className="satellite-model-wrap"><SatelliteModel color={selectedColor} /><span className="model-label">STRUCTURE VIEW</span></div><p className="eyebrow">Catalog profile</p><h2 id="satellite-detail-title">{selected.name}</h2><p className="satellite-type">NORAD {selected.id} · Current orbital element set</p><p className="satellite-purpose">Live position calculated from its current orbital element set. This view represents the satellite above Earth, not a scale model.</p><div className="orbital-stats"><span><Gauge size={15} /><small>Altitude</small><strong>{position ? `${Math.round(position.altitude).toLocaleString()} km` : '—'}</strong></span><span><CircleDot size={15} /><small>Latitude</small><strong>{position ? `${position.latitude.toFixed(1)}°` : '—'}</strong></span><span><Crosshair size={15} /><small>Longitude</small><strong>{position ? `${position.longitude.toFixed(1)}°` : '—'}</strong></span></div><div className="structure-info"><div className="structure-info-heading"><Sparkles size={15} /><strong>Structure & signal</strong></div><p><Ruler size={13} /> Inclination · {selected.inclination}</p><p><Ruler size={13} /> Catalog epoch · {selected.epoch.slice(0, 10)}</p><p><Satellite size={13} /> Position refreshed every frame</p></div><button className="detail-link" type="button"><ExternalLink size={14} /> Open catalog reference</button></> : <div className="satellite-empty"><Satellite size={28} /><p>Select a live object to inspect it.</p></div>}
      </aside>
    </div>
    <footer>Live orbital elements from CelesTrak <span>•</span> positions are approximate and continuously propagated</footer>
  </section>
}
