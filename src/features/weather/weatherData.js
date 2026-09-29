export const DEFAULT_CITY = 'Portland'

export const RECENT_CITIES = ['Portland', 'Reykjavik', 'Tokyo']

export const demoWeather = {
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

export function formatLocalTime(value) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export function dayName(date, index) {
  if (index === 0) return 'Today'
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date)
}

export function weatherDetails(code) {
  if ([95, 96, 99].includes(code)) return { condition: 'Thunderstorms', icon: 'rain', description: 'Thunderstorms nearby' }
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { condition: 'Rainy', icon: 'rain', description: 'Rain showers expected' }
  if ([1, 2].includes(code)) return { condition: 'Partly cloudy', icon: 'partly', description: 'A mix of sun and clouds' }
  if (code === 3) return { condition: 'Overcast', icon: 'partly', description: 'Cloudy skies' }
  if (code === 45 || code === 48) return { condition: 'Foggy', icon: 'partly', description: 'Reduced visibility' }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: 'Snowy', icon: 'rain', description: 'Snow showers expected' }
  return { condition: 'Clear', icon: 'sunny', description: 'Clear skies' }
}

export function aqiDetails(aqi) {
  if (aqi <= 50) return { label: 'Good', description: 'Air quality is clean for outdoor plans', tone: 'good' }
  if (aqi <= 100) return { label: 'Moderate', description: 'Most people can enjoy the outdoors', tone: 'moderate' }
  if (aqi <= 150) return { label: 'Sensitive groups', description: 'Consider lighter outdoor activity', tone: 'caution' }
  return { label: 'Unhealthy', description: 'Limit prolonged outdoor exertion', tone: 'poor' }
}

export function pollenLevel(value) {
  if (value === null || value === undefined) return 'Not reported'
  if (value < 1) return 'Low'
  if (value < 10) return 'Moderate'
  return 'High'
}

export function buildGardenAdvice(current, forecast) {
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
