import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Map as MapIcon, MapPin, Radar } from 'lucide-react'

export default function MapRadar({ weather }) {
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
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map)
    mapInstance.current = map
    return () => { map.remove(); mapInstance.current = null }
  }, [])

  useEffect(() => {
    if (!mapInstance.current || !weather.latitude || !weather.longitude) return
    mapInstance.current.setView([weather.latitude, weather.longitude], 8)
    locationMarker.current?.remove()
    locationMarker.current = L.circleMarker([weather.latitude, weather.longitude], { radius: 8, color: '#f7fbf4', weight: 3, fillColor: '#3e7654', fillOpacity: 1 }).addTo(mapInstance.current)
    locationMarker.current.bindTooltip(`${weather.city}, ${weather.country}`, { direction: 'top', offset: [0, -8] })
  }, [weather.latitude, weather.longitude, weather.city, weather.country])

  useEffect(() => {
    let active = true
    axios.get('https://api.rainviewer.com/public/weather-maps.json').then(({ data }) => {
      const frame = data.radar?.past?.at(-1)
      if (active && frame) {
        setRadarFrame(`https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`)
        setRadarUpdated(new Date(frame.time * 1000))
      }
    }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!mapInstance.current) return
    radarLayer.current?.remove()
    radarLayer.current = mode === 'radar' && radarFrame
      ? L.tileLayer(radarFrame, { opacity: 0.65, zIndex: 5, tileSize: 256 }).addTo(mapInstance.current)
      : null
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
