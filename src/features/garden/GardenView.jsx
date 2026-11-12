import React, { useMemo, useState } from 'react'
import { Check, CloudRain, Droplets, Flower2, Leaf, Pickaxe, Sun, Sprout, Wind } from 'lucide-react'
import { buildGardenAdvice } from '../weather/weatherData'

const gardenTasks = [
  { id: 'soil', label: 'Check the soil before watering', icon: Droplets },
  { id: 'leaves', label: 'Look over leaves for new growth', icon: Leaf },
  { id: 'beds', label: 'Tidy paths and pull a few weeds', icon: Sprout },
]

function forecastIcon(type) {
  if (type === 'rain') return <CloudRain size={20} />
  if (type === 'sunny') return <Sun size={20} />
  return <Flower2 size={20} />
}

export default function GardenView({ weather }) {
  const [completedTasks, setCompletedTasks] = useState([])
  const advice = useMemo(() => buildGardenAdvice(weather, weather.forecast), [weather])
  const completedCount = completedTasks.length

  const toggleTask = (taskId) => {
    setCompletedTasks((current) => current.includes(taskId)
      ? current.filter((id) => id !== taskId)
      : [...current, taskId])
  }

  return (
    <section className="garden-page" aria-labelledby="garden-title">
      <header className="feature-intro garden-intro">
        <div>
          <p className="eyebrow">Day 1 · Valley field notes · {weather.city}</p>
          <h1 id="garden-title">A little more <em>green</em> each day.</h1>
          <p className="hero-copy">Check the skies, tend your patch, and make today count.</p>
        </div>
        <div className="garden-weather panel">
          <span className="garden-weather-icon">{forecastIcon(weather.icon)}</span>
          <div><small>Today in {weather.city}</small><strong>{weather.temperature}° · {weather.condition}</strong></div>
        </div>
      </header>

      <div className="garden-toolbar" aria-label="Garden tools">
        <span className="toolbar-label">TOOLBELT</span>
        <span className="tool-slot active"><Pickaxe size={18} /></span>
        <span className="tool-slot"><Droplets size={18} /></span>
        <span className="tool-slot"><Sprout size={18} /></span>
        <span className="tool-slot"><Flower2 size={18} /></span>
        <span className="tool-slot"><Leaf size={18} /></span>
        <span className="toolbar-weather"><Sun size={15} /> {weather.temperature}°</span>
      </div>

      <div className="garden-scene" aria-label="Pixel-art garden scene">
        <div className="scene-sun" />
        <div className="scene-hill hill-back" />
        <div className="scene-hill hill-front" />
        <div className="scene-crops"><Sprout /><Flower2 /><Sprout /><Leaf /><Sprout /></div>
        <div className="scene-ground" />
        <span className="scene-caption">YOUR PATCH, YOUR PACE</span>
        <span className="scene-sign">WEATHERLY FARM</span>
      </div>

      <div className="garden-dashboard">
        <section className="garden-advice-board panel">
          <div className="section-header">
            <div><p className="eyebrow">Written in the weather</p><h2>Today’s field notes</h2></div>
            <span className="pixel-stamp"><Sun size={15} /> {weather.high}° HIGH</span>
          </div>
          <div className="field-note-list">
            <article className="field-note">
              <span className="note-icon water-note">{advice.watering.icon === 'rain' ? <CloudRain size={20} /> : <Droplets size={20} />}</span>
              <div><small>WATERING</small><h3>{advice.watering.title}</h3><p>{advice.watering.detail}</p></div>
            </article>
            <article className="field-note">
              <span className="note-icon planting-note"><Sprout size={20} /></span>
              <div><small>PLANTING</small><h3>{advice.planting.title}</h3><p>{advice.planting.detail}</p></div>
            </article>
          </div>
        </section>

        <section className="garden-tasks panel">
          <div className="section-header">
            <div><p className="eyebrow">A small daily ritual</p><h2>Farm chores</h2></div>
            <span className="task-count">{completedCount}/{gardenTasks.length}</span>
          </div>
          <div className="task-list">
            {gardenTasks.map(({ id, label, icon: Icon }) => {
              const isComplete = completedTasks.includes(id)
              return <button key={id} className={`task-row ${isComplete ? 'complete' : ''}`} onClick={() => toggleTask(id)} aria-pressed={isComplete}>
                <span className="task-check">{isComplete ? <Check size={14} /> : <Icon size={15} />}</span>
                <span>{label}</span>
              </button>
            })}
          </div>
          <p className="task-footnote"><Wind size={14} /> No rush. The garden will be here tomorrow.</p>
        </section>
      </div>

      <section className="garden-forecast">
        <div className="section-header"><div><p className="eyebrow">Plan a few days ahead</p><h2>Growing forecast</h2></div><span className="forecast-note">Rain chance and daily highs</span></div>
        <div className="garden-forecast-grid">
          {weather.forecast.map((day) => <article className="garden-day" key={`${day.day}-${day.date}`}>
            <div><strong>{day.day}</strong><small>{day.date}</small></div>
            <span className={`garden-day-icon ${day.icon}`}>{forecastIcon(day.icon)}</span>
            <strong>{day.high}°</strong>
            <span className="garden-rain"><CloudRain size={13} /> {day.rain}%</span>
          </article>)}
        </div>
      </section>
      <footer>Weatherly <span>•</span> made for slow mornings and good growing</footer>
    </section>
  )
}
