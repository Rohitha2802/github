document.getElementById('weather-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const city = document.getElementById('city').value;
    getWeather(city);
});

async function getWeather(city) {
    const apiKey = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod === 200) {
            const weatherResult = document.getElementById('weather-result');
            weatherResult.innerHTML = `
                <h2>Weather in ${data.name}</h2>
                <p>Temperature: ${data.main.temp} °C</p>
                <p>Weather: ${data.weather[0].description}</p>
                <p>Humidity: ${data.main.humidity} %</p>
                <p>Wind Speed: ${data.wind.speed} m/s</p>
            `;
        } else {
            alert('City not found. Please try again.');
        }
    } catch (error) {
        console.error('Error fetching the weather data', error);
        alert('Error fetching the weather data');
    }
}
