const apiKey = 'bea8ecca931835278480578bba62d4a1'; // Replace with your API key
let unit = 'metric';
let currentCity = '';
let favorites = [];

// Load favorites from local storage
function loadFavorites() {
  const storedFavorites = localStorage.getItem('weatherFavorites');
  favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
  updateFavoritesDisplay();
}

// Save favorites to local storage
function saveFavorites() {
  localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
  updateFavoritesDisplay();
}

// Update favorites display
function updateFavoritesDisplay() {
  const favoritesContainer = document.getElementById('favorites');
  favoritesContainer.innerHTML = '<h2>Favorites</h2>';
  
  favorites.forEach(city => {
    const favButton = document.createElement('button');
    favButton.textContent = city;
    favButton.addEventListener('click', () => {
      fetchWeather(city);
      fetchCurrentWeather(city);
    });

    const removeButton = document.createElement('button');
    removeButton.textContent = '✖';
    removeButton.className = 'remove-favorite';
    removeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      favorites = favorites.filter(fav => fav !== city);
      saveFavorites();
    });

    const cityContainer = document.createElement('div');
    cityContainer.className = 'favorite-city';
    cityContainer.appendChild(favButton);
    cityContainer.appendChild(removeButton);

    favoritesContainer.appendChild(cityContainer);
  });
}

// Add to favorites
function addToFavorites(city) {
  if (!favorites.includes(city)) {
    favorites.push(city);
    saveFavorites();
  }
}

// Weather image selection
function getWeatherImage(weatherCondition) {
  const weatherImages = {
    'Clear': 'images/clear-sky.png',
    'Clouds': 'images/cloud.png',
    'Rain': 'images/rainy.jpg',
    'Snow': 'images/snowy.jpg',
    'Thunderstorm': 'images/thunderstorm.jpg',
    'Drizzle': 'images/drizzle.jpg',
    'Mist': 'images/misty.jpg',
    'default': 'images/default-weather.png'
  };

  return weatherImages[weatherCondition] || weatherImages['default'];
}

// Display current weather
function displayCurrentWeather(data) {
  const container = document.getElementById('current-weather');
  const weatherCondition = data.weather[0].main; // Main weather condition
  const weatherImage = getWeatherImage(weatherCondition); // Get corresponding image

  container.innerHTML = `
    <h2>Current Weather in ${data.name}</h2>
    <img 
        id="weather-image" 
        class="weather-image"
        src="${weatherImage}" 
        alt="${weatherCondition}">
    <p>Temperature: ${data.main.temp.toFixed(1)}°${unit === 'metric' ? 'C' : 'F'}</p>
    <p>Feels Like: ${data.main.feels_like.toFixed(1)}°${unit === 'metric' ? 'C' : 'F'}</p>
    <p>Humidity: ${data.main.humidity}%</p>
    <p>Wind Speed: ${data.wind.speed} ${unit === 'metric' ? 'm/s' : 'mph'}</p>
  `;
}

// Display forecast
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

    const mainWeather = dayForecast[0].weather[0].main; // Use the first entry's weather condition
    const weatherImage = getWeatherImage(mainWeather); // Get image for weather condition

    const card = document.createElement('div');
    card.className = 'weather-card';

    // Hourly data
    const hourlyData = displayHourlyForecast(dayForecast);

    card.innerHTML = `
      <img src="${weatherImage}" alt="${mainWeather}" class="weather-image">
      <h3>${date}</h3>
      <p>Avg Temp: ${avgTemp.toFixed(1)}°${unit === 'metric' ? 'C' : 'F'}</p>
      <p>Weather: ${mainWeather}</p>
    `;

    card.appendChild(hourlyData);
    container.appendChild(card);
  });
}

// Display hourly forecast
function displayHourlyForecast(forecast) {
  const container = document.createElement('div');
  container.className = 'hourly-container';

  forecast.forEach(entry => {
    const time = new Date(entry.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const weatherCondition = entry.weather[0].main;
    const weatherImage = getWeatherImage(weatherCondition);

    container.innerHTML += `
      <div class="hourly-card">
        <img src="${weatherImage}" alt="${weatherCondition}" class="hourly-weather-image">
        <p>${time}</p>
        <p>${entry.main.temp.toFixed(1)}°${unit === 'metric' ? 'C' : 'F'}</p>
      </div>
    `;
  });

  return container;
}

// Fetch weather data
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

// Initialize favorites and search events
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

document.getElementById('add-favorite').addEventListener('click', () => {
  if (currentCity) {
    addToFavorites(currentCity);
  }
});

// Load favorites on page load
loadFavorites();

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
