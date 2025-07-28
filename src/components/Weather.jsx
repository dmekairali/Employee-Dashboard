import React, { useState, useEffect } from 'react';
import { MapPin, Sun, Cloud } from 'lucide-react';

const locations = [
  {
    name: 'Delhi, India',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&current_weather=true&hourly=temperature_2m',
  },
  {
    name: 'Palakkad, Kerala, India',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=10.7750&longitude=76.6566&current_weather=true&hourly=temperature_2m',
  },
  {
    name: 'Pollachi, Tamil Nadu, India',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=10.6589&longitude=77.0085&current_weather=true&hourly=temperature_2m',
  },
];

const Weather = () => {
  const [weatherData, setWeatherData] = useState([]);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    setLoading(true);
    const data = await Promise.all(
      locations.map(async (location) => {
        const response = await fetch(location.url);
        const json = await response.json();
        return {
          name: location.name,
          temp: json.current_weather.temperature,
          condition: json.current_weather.weathercode < 3 ? 'sunny' : 'cloudy',
        };
      })
    );
    setWeatherData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 3600000); // Refresh every hour
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const locationInterval = setInterval(() => {
      setCurrentLocationIndex((prevIndex) => (prevIndex + 1) % locations.length);
    }, 5000); // Cycle every 5 seconds
    return () => clearInterval(locationInterval);
  }, []);

  if (loading) {
    return <div>Loading weather...</div>;
  }

  const currentWeather = weatherData[currentLocationIndex];

  if (!currentWeather) {
    return null;
  }

  const WeatherIcon = currentWeather.condition === 'sunny' ? Sun : Cloud;

  return (
    <div className="flex items-center space-x-6 text-sm opacity-80">
        <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>{currentWeather.name}</span>
        </div>
        <div className="flex items-center space-x-2">
            <WeatherIcon className="w-4 h-4" />
            <span>{currentWeather.temp}°C</span>
        </div>
    </div>
  );
};

export default Weather;
