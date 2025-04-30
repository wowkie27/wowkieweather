import React, { useState, useEffect, useCallback } from "react";
import './Weather.css';
import axios from "axios";

function Weather() {
    const [weatherData, setWeatherData] = useState(null);
    const [city, setCity] = useState("Moscow");
    const [inputCity, setInputCity] = useState("");
    const [lang, setLang] = useState("EN");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isOnline, setIsOnline] = useState(true);

    const API_KEY = "9aca33f9851e986e2000363811ce4c03"

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const getWeather = useCallback(async () => {
        if (!inputCity.trim()) return;
        if (!isOnline) {
            setError(lang === "ru" ? "Нет интернет-соединения" : "No internet connection");
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            // Добавляем timestamp для предотвращения кэширования на мобильных
            const timestamp = Date.now();
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${inputCity}&appid=${API_KEY}&units=metric&lang=${lang}&_=${timestamp}`
            );
            
            setWeatherData(response.data);
            setCity(inputCity);
            
            // Асинхронное сохранение для мобильных браузеров
            if (typeof window !== 'undefined') {
                localStorage.setItem('weatherCity', inputCity);
            }
        } catch (error) {
            console.error("Error fetching weather: ", error);
            setError(lang === "ru" ? "Город не найден" : "City not found");
        } finally {
            setLoading(false);
        }
    }, [inputCity, lang, isOnline,API_KEY]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Для мобильных: закрытие клавиатуры после отправки
        if (document.activeElement) document.activeElement.blur();
        getWeather();
    };

    const toggleLang = () => {
        const newLang = lang === "ru" ? "en" : "ru";
        setLang(newLang);
    };

    useEffect(() => {
        setInputCity(city);
        // Задержка для мобильных устройств
        const timer = setTimeout(() => {
            getWeather();
        }, 300);
        
        return () => clearTimeout(timer);
    }, []);

    const formatTimeWithTimezone = (timestamp, timezone) => {
        try {
            const date = new Date((timestamp + timezone) * 1000);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '--:--';
        }
    };

    const getGMTOffsetString = (timezoneSeconds) => {
        const hours = timezoneSeconds / 3600;
        const sign = hours >= 0 ? '+' : '-';
        const absoluteHours = Math.abs(hours);
        return `GMT${sign}${absoluteHours}`;
    }; 

    return (
        <div className="weather-app">
            <header className="app-header">
                <h1 className="app-title">WowkieWeather</h1>
                <button className="lang-button" onClick={toggleLang}>
                    {lang === "ru" ? "RU" : "EN"}
                </button>
            </header>
            
            <main className="app-content">
                <form className="search-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className="city-input"
                        value={inputCity}
                        onChange={(e) => setInputCity(e.target.value)}
                        placeholder={lang === "ru" ? "Введите город..." : "Enter city..."}
                        aria-label={lang === "ru" ? "Город для поиска погоды" : "City for weather search"}
                    />
                    <button 
                        type="submit" 
                        className="search-button"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="loader"></span>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                </svg>
                                {lang === "ru" ? "Поиск" : "Search"}
                            </>
                        )}
                    </button>
                </form>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {weatherData && (
                    <>
                        <div className="weather-header">
                            <h2 className="city-name">{city}</h2>
                            {weatherData.weather[0].icon && (
                                <img 
                                    src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`} 
                                    alt={weatherData.weather[0].description}
                                    className="weather-icon"
                                />
                            )}
                            <h2 className="gmt-time">{getGMTOffsetString(weatherData.timezone)}</h2>
                        </div>
                        
                        <div className="weather-widgets">
                            <div className="weather-widget">
                                <div className="widget-content">
                                    <h3>{lang === "ru" ? "Температура" : "Temperature"}</h3>
                                    <p>{Math.round(weatherData.main.temp)}°C</p>
                                </div>
                            </div>
                            
                            <div className="weather-widget">
                                <div className="widget-content">
                                    <h3>{lang === "ru" ? "Ощущается" : "Feels like"}</h3>
                                    <p>{Math.round(weatherData.main.feels_like)}°C</p>
                                </div>
                            </div>
                            
                            <div className="weather-widget">
                                <div className="widget-content">
                                    <h3>{lang === "ru" ? "Погода" : "Weather"}</h3>
                                    <p className="data-text">
                                        {weatherData.weather[0].description.charAt(0).toUpperCase() + 
                                         weatherData.weather[0].description.slice(1)}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="weather-widget">
                                <div className="widget-content">
                                    <h3>{lang === "ru" ? "Ветер" : "Wind"}</h3>
                                    <p>{Math.round(weatherData.wind.speed)} {lang === "ru" ? "м/с" : "m/s"}</p>
                                </div>
                            </div>
                            <div className="weather-widget sunrise-widget">
                                <div className="widget-content">
                                    <h3>{lang === "ru" ? "Восход" : "Sunrise"}</h3>
                                    <p>{formatTimeWithTimezone(weatherData.sys.sunrise, weatherData.timezone)}</p>
                                </div>
                            </div>
                            <div className="weather-widget sunset-widget">
                                <div className="widget-content">
                                    <h3>{lang === "ru" ? "Закат" : "Sunset"}</h3>
                                    <p>{formatTimeWithTimezone(weatherData.sys.sunset, weatherData.timezone)}</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default Weather;