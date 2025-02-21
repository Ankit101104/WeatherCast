const API_KEY = config.API_KEY;  // Get API key from config file
const WEATHER_API = 'https://api.openweathermap.org/data/2.5';
let units = 'metric';

document.addEventListener('DOMContentLoaded', () => {
    const getWeatherButton = document.getElementById('getweather');
    const cityInput = document.getElementById('city');
    const weatherdataDiv = document.getElementById('weatherdata');
    const temperaturePara = document.getElementById('temperature');
    const descriptionPara = document.getElementById('description');
    const iconImg = document.getElementById('icon');
    const errormessage = document.getElementById('errormessage');
    const loadingMessage = document.createElement('p');

    loadingMessage.textContent = "Loading...";
    loadingMessage.id = "loading";
    document.body.appendChild(loadingMessage);

    console.log(getWeatherButton); 
    console.log(cityInput);        
    
    let isCelsius = true;  // tracks the current unit (celsius or fahrenheit)
    let temperatureInCelsius = 0; // stores the celsius temperature

    // fetch weather data
    getWeatherButton.addEventListener('click', async () => {
        await getWeather();
    });

    // toggle temperature units
    const toggleUnitsButton = document.getElementById('toggleUnits');
    toggleUnitsButton.addEventListener('click', () => {
        isCelsius = !isCelsius;
        updateTemperatureDisplay();
    });

    // update temperature display
    function updateTemperatureDisplay() {
        if (isCelsius) {
            temperaturePara.textContent = `Temperature: ${temperatureInCelsius.toFixed(2)} °C`;
            toggleUnitsButton.textContent = 'Switch to F';
        } else {
            const temperatureInFahrenheit = (temperatureInCelsius * 9) / 5 + 32;
            temperaturePara.textContent = `Temperature: ${temperatureInFahrenheit.toFixed(2)} °F`;
            toggleUnitsButton.textContent = 'Switch to C';
        }
    }

    async function getWeather() {
        const cityInput = document.getElementById('city');
        const weatherData = document.getElementById('weatherdata');
        const errorMessage = document.getElementById('errormessage');
        const loading = document.getElementById('loading');
        
        weatherData.classList.add('hidden');
        errorMessage.classList.add('hidden');
        loading.classList.add('loading');
        
        try {
            const city = cityInput.value.trim();
            if (!city) throw new Error('Please enter a city name');
            
            // Get current weather
            const currentWeatherURL = `${WEATHER_API}/weather?q=${city}&units=${units}&appid=${API_KEY}`;
            const currentWeatherResponse = await fetch(currentWeatherURL);
            const currentWeatherData = await currentWeatherResponse.json();
            
            if (!currentWeatherResponse.ok) {
                throw new Error(currentWeatherData.message || 'City not found');
            }
            
            // Get 5-day forecast using coordinates (more accurate)
            const { lat, lon } = currentWeatherData.coord;
            const forecastURL = `${WEATHER_API}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
            const forecastResponse = await fetch(forecastURL);
            const forecastData = await forecastResponse.json();
            
            if (!forecastResponse.ok) {
                throw new Error('Failed to fetch forecast data');
            }
            
            // Update displays
            updateCurrentWeather(currentWeatherData);
            updateForecast(forecastData);
            
            weatherData.classList.remove('hidden');
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        } finally {
            loading.classList.remove('loading');
        }
    }

    function updateCurrentWeather(data) {
        const tempElement = document.getElementById('temperature');
        const descElement = document.getElementById('description');
        
        const temp = Math.round(data.main.temp);
        const description = data.weather[0].description;
        
        tempElement.textContent = `${temp}°${units === 'metric' ? 'C' : 'F'}`;
        descElement.textContent = description.charAt(0).toUpperCase() + description.slice(1);
    }

    function updateForecast(data) {
        const forecastContainer = document.getElementById('forecast');
        forecastContainer.innerHTML = '';
        
        // Group forecast by day
        const dailyForecasts = groupForecastsByDay(data.list);
        
        // Create forecast cards
        Object.entries(dailyForecasts).slice(1, 6).forEach(([date, forecasts]) => {
            const dayData = getDayForecastData(forecasts);
            const forecastCard = createForecastCard(date, dayData);
            forecastContainer.appendChild(forecastCard);
        });
    }

    function groupForecastsByDay(forecastList) {
        return forecastList.reduce((days, forecast) => {
            const date = new Date(forecast.dt * 1000).toLocaleDateString();
            if (!days[date]) {
                days[date] = [];
            }
            days[date].push(forecast);
            return days;
        }, {});
    }

    function getDayForecastData(dayForecasts) {
        // Calculate min and max temperature
        const temps = dayForecasts.map(forecast => forecast.main.temp);
        const minTemp = Math.round(Math.min(...temps));
        const maxTemp = Math.round(Math.max(...temps));
        
        // Get the most frequent weather condition
        const conditions = dayForecasts.map(forecast => forecast.weather[0].id);
        const mostFrequentCondition = getMostFrequent(conditions);
        const weatherData = dayForecasts.find(forecast => 
            forecast.weather[0].id === mostFrequentCondition).weather[0];
        
        return {
            minTemp,
            maxTemp,
            icon: weatherData.icon,
            description: weatherData.description
        };
    }

    function createForecastCard(date, dayData) {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Choose weather icon based on description
        let weatherIcon = 'fa-sun';
        if (dayData.description.includes('cloud')) {
            weatherIcon = 'fa-cloud';
        } else if (dayData.description.includes('rain')) {
            weatherIcon = 'fa-cloud-rain';
        } else if (dayData.description.includes('snow')) {
            weatherIcon = 'fa-snowflake';
        }
        
        card.innerHTML = `
            <div class="forecast-day">
                <h3>${dayName}</h3>
                <p class="forecast-date">${monthDay}</p>
            </div>
            <i class="fas ${weatherIcon}"></i>
            <p class="forecast-temp">${dayData.maxTemp}° / ${dayData.minTemp}°</p>
            <p class="forecast-desc">${dayData.description}</p>
        `;
        
        return card;
    }

    function getMostFrequent(arr) {
        return arr.sort((a,b) =>
            arr.filter(v => v === a).length - arr.filter(v => v === b).length
        ).pop();
    }

    // Temperature unit toggle
    document.getElementById('toggleUnits').addEventListener('click', function() {
        units = units === 'metric' ? 'imperial' : 'metric';
        this.textContent = `Switch to ${units === 'metric' ? 'F' : 'C'}`;
        
        const city = document.getElementById('city').value.trim();
        if (city) {
            getWeather();
        }
    });

    // Event listeners
    document.getElementById('getweather').addEventListener('click', getWeather);
    document.getElementById('city').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            getWeather();
        }
    });
});