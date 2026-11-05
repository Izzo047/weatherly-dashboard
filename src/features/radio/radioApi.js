import axios from 'axios'

const RADIO_API = 'https://de1.api.radio-browser.info/json'

export async function loadRadioCountries() {
  const { data } = await axios.get(`${RADIO_API}/countries`, {
    params: { order: 'stationcount', reverse: true },
    timeout: 12000,
  })
  return data.filter((country) => country.stationcount > 0)
}

export async function searchRadioStations({ countryCode, query }) {
  const params = {
    limit: 48,
    hidebroken: true,
    order: 'clickcount',
    reverse: true,
  }
  if (countryCode) params.countrycode = countryCode
  if (query.trim()) params.name = query.trim()

  const { data } = await axios.get(`${RADIO_API}/stations/search`, { params, timeout: 15000 })
  return data
}
