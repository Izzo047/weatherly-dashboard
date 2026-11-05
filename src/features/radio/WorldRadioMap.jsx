import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../../app/styles/radio-map.css'
import { MapPin } from 'lucide-react'

function makePopup(station, onSelectStation) {
  const content = document.createElement('div')
  content.className = 'radio-map-popup'

  const name = document.createElement('strong')
  name.textContent = station.name
  content.append(name)

  const details = document.createElement('small')
  details.textContent = [station.country, station.codec, station.bitrate ? `${station.bitrate} kbps` : ''].filter(Boolean).join(' · ')
  content.append(details)

  const listenButton = document.createElement('button')
  listenButton.type = 'button'
  listenButton.textContent = 'Listen to station'
  listenButton.addEventListener('click', (event) => {
    L.DomEvent.stopPropagation(event)
    onSelectStation(station)
  })
  content.append(listenButton)

  return content
}

export default function WorldRadioMap({ stations, selectedStation, onSelectStation }) {
  const mapElement = useRef(null)
  const mapInstance = useRef(null)
  const markerLayer = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const locatedStations = useMemo(() => stations.filter((station) => {
    if (station.geo_lat === null || station.geo_lat === undefined || station.geo_lat === ''
      || station.geo_long === null || station.geo_long === undefined || station.geo_long === '') return false
    const latitude = Number(station.geo_lat)
    const longitude = Number(station.geo_long)
    return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
  }), [stations])

  useEffect(() => {
    if (!mapElement.current || mapInstance.current) return undefined

    const map = L.map(mapElement.current, { scrollWheelZoom: false }).setView([24, 8], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    markerLayer.current = L.layerGroup().addTo(map)
    mapInstance.current = map
    setMapReady(true)

    return () => {
      map.remove()
      mapInstance.current = null
      markerLayer.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstance.current
    const layer = markerLayer.current
    if (!mapReady || !map || !layer) return

    layer.clearLayers()
    const markerById = new Map()

    locatedStations.forEach((station) => {
      const position = [Number(station.geo_lat), Number(station.geo_long)]
      const isSelected = station.stationuuid === selectedStation?.stationuuid
      const marker = L.circleMarker(position, {
        radius: isSelected ? 9 : 6,
        color: '#fffdf6',
        weight: 2,
        fillColor: isSelected ? '#bc783d' : '#3f7850',
        fillOpacity: 0.94,
      }).addTo(layer)

      marker.bindPopup(makePopup(station, onSelectStation))
      marker.on('click', () => onSelectStation(station))
      markerById.set(station.stationuuid, marker)
    })

    if (locatedStations.length > 1) {
      map.fitBounds(L.latLngBounds(locatedStations.map((station) => [Number(station.geo_lat), Number(station.geo_long)])), {
        padding: [28, 28],
        maxZoom: 5,
      })
    } else if (locatedStations.length === 1) {
      map.setView([Number(locatedStations[0].geo_lat), Number(locatedStations[0].geo_long)], 5)
    } else {
      map.setView([24, 8], 2)
    }

    if (selectedStation) {
      markerById.get(selectedStation.stationuuid)?.openPopup()
    }
  }, [locatedStations, mapReady, onSelectStation, selectedStation])

  return (
    <section className="radio-map-panel panel" aria-labelledby="radio-map-title">
      <div className="radio-map-heading">
        <div><p className="eyebrow">Listen from anywhere</p><h2 id="radio-map-title">Stations on the map</h2></div>
        <span className="radio-map-count"><MapPin size={14} /> {locatedStations.length} mapped / {stations.length} results</span>
      </div>
      <div className="radio-map-canvas" ref={mapElement} role="application" aria-label="Map of public radio stations. Select a marker to listen." />
      <p className="radio-map-note">Select a marker to tune in. Some stations do not publish their location and are only shown in the station list.</p>
    </section>
  )
}
