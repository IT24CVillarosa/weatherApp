const apiKey = 'bea8ecca931835278480578bba62d4a1';
const newsApiKey = 'YOUR_NEWS_API_KEY';
let unit = 'metric';
let currentCity = '';

document.getElementById('search-button').addEventListener('click', () => {
  const city = document.getElementById('city-input').value;
  if (city) {
    fetchWeather(city);
    fetchCurrentWeather(city);
  }
});

document.getElementById('unit-toggle').addEventListener('click', () => {
  unit = unit === 'metric' ? 'imperial' : 'metric';
  if (currentCity) {
    fetchWeather(currentCity);
    fetchCurrentWeather(currentCity);
  }
});

async function fetchWeather(city) {
  currentCity = city;
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${apiKey}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    displayWeather(data);
    displayMap(data.city.coord.lat, data.city.coord.lon);
  } catch (error) {
    console.error('Error fetching weather:', error);
  }
}

async function fetchCurrentWeather(city) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    displayCurrentWeather(data);
  } catch (error) {
    console.error('Error fetching current weather:', error);
  }
}

function displayWeather(data) {
  const container = document.getElementById('weather-container');
  container.innerHTML = '';
  const dailyForecasts = {};
  data.list.forEach(entry => {
    const date = new Date(entry.dt_txt).toDateString();
    if (!dailyForecasts[date]) dailyForecasts[date] = [];
    dailyForecasts[date].push(entry);
  });

  Object.keys(dailyForecasts).slice(0, 7).forEach(date => {
    const dayForecast = dailyForecasts[date];
    const avgTemp = dayForecast.reduce((sum, item) => sum + item.main.temp, 0) / dayForecast.length;
    const card = document.createElement('div');
    card.className = 'weather-card';

    const hourlyData = displayHourlyForecast(dayForecast);

    card.innerHTML = `
      <h3>${date}</h3>
      <p>Avg Temp: ${avgTemp.toFixed(1)}°${unit === 'metric' ? 'C' : 'F'}</p>
    `;
    card.appendChild(hourlyData);
    container.appendChild(card);
  });
}

function displayCurrentWeather(data) {
  const container = document.getElementById('current-weather');
  container.innerHTML = `
    <h2>Current Weather in ${data.name}</h2>
    <p>Temperature: ${data.main.temp.toFixed(1)}°${unit === 'metric' ? 'C' : 'F'}</p>
    <p>Feels Like: ${data.main.feels_like.toFixed(1)}°${unit === 'metric' ? 'C' : 'F'}</p>
    <p>Humidity: ${data.main.humidity}%</p>
    <p>Wind Speed: ${data.wind.speed} ${unit === 'metric' ? 'm/s' : 'mph'}</p>
  `;
}

function displayHourlyForecast(forecast) {
  const container = document.createElement('div');
  container.className = 'hourly-container';
  forecast.forEach(entry => {
    const time = new Date(entry.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    container.innerHTML += `
      <div class="hourly-card">
        <p>${time}</p>
        <p>${entry.main.temp.toFixed(1)}°${unit === 'metric' ? 'C' : 'F'}</p>
      </div>
    `;
  });
  return container;
}

function displayMap(lat, lon) {
  const map = L.map('map').setView([lat, lon], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  L.marker([lat, lon]).addTo(map);
}

function fetchSuggestions(query) {
  const apiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`;
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      const suggestions = document.getElementById('suggestions');
      suggestions.innerHTML = '';
      data.forEach(city => {
        const item = document.createElement('li');
        item.textContent = `${city.name}, ${city.country}`;
        item.addEventListener('click', () => {
          fetchWeather(city.name);
          fetchCurrentWeather(city.name);
        });
        suggestions.appendChild(item);
      });
    });
}
