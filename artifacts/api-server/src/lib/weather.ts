import { logger } from "./logger";

const OWM_BASE = "https://api.openweathermap.org/data/2.5";

interface OWMCurrent {
  main: { temp: number; humidity: number; feels_like: number };
  weather: { description: string; icon: string }[];
  wind: { speed: number };
  name: string;
  rain?: { "1h"?: number };
}

interface OWMForecastItem {
  dt: number;
  main: { temp: number; humidity: number };
  weather: { description: string; icon: string }[];
  pop: number; // probability of precipitation 0-1
  rain?: { "3h"?: number };
}

interface OWMForecast {
  list: OWMForecastItem[];
  city: { name: string };
}

export interface WeatherResult {
  temperature: number;
  humidity: number;
  rainProbability: number;
  description: string;
  icon: string;
  windSpeed: number;
  waterScore: number;
  recommendation: string;
  pumpDurationMultiplier: number;
  shouldIrrigate: boolean;
  city: string;
}

export interface ForecastItem {
  timestamp: string;
  temperature: number;
  rainProbability: number;
  humidity: number;
  description: string;
  icon: string;
}

export interface ForecastResult {
  city: string;
  items: ForecastItem[];
}

/**
 * Water Score Heuristic Algorithm
 *
 * Inputs: Rain Probability (P_rain), Temperature (T °C), Humidity (H %)
 *
 * Rules:
 * - If P_rain > 60% → skip irrigation (score drops significantly)
 * - If T > 30°C and H < 40% → increase pump duration by 1.5x (high evapotranspiration)
 * - Base score computed from temperature and humidity stress
 * - Final waterScore is 0–100 (higher = more irrigation needed)
 */
export function computeIrrigationLogic(
  temperature: number,
  humidity: number,
  rainProbability: number
): {
  waterScore: number;
  shouldIrrigate: boolean;
  pumpDurationMultiplier: number;
  recommendation: string;
} {
  // Normalize rain probability to 0-100 if given as 0-1
  const rainPct = rainProbability > 1 ? rainProbability : rainProbability * 100;

  // Base water score: higher temp = more water needed, lower humidity = more needed
  const tempStress = Math.max(0, (temperature - 15) / 25) * 40; // 0-40 pts
  const humidityStress = Math.max(0, (70 - humidity) / 70) * 40; // 0-40 pts
  const rainReduction = (rainPct / 100) * 50; // 0-50 pts reduction

  let waterScore = Math.max(0, Math.min(100, tempStress + humidityStress - rainReduction + 20));

  let pumpDurationMultiplier = 1.0;
  let shouldIrrigate = true;
  let recommendation = "";

  // Rule 1: High rain probability → skip irrigation
  if (rainPct > 60) {
    shouldIrrigate = false;
    waterScore = Math.max(0, waterScore * 0.2);
    recommendation = `Heavy rain detected (${Math.round(rainPct)}% probability). Irrigation paused automatically to conserve water.`;
    pumpDurationMultiplier = 0;
  }
  // Rule 2: Hot and dry → increase pump duration 1.5x
  else if (temperature > 30 && humidity < 40) {
    pumpDurationMultiplier = 1.5;
    waterScore = Math.min(100, waterScore * 1.3);
    recommendation = `High evapotranspiration detected (${temperature.toFixed(1)}°C, ${humidity}% humidity). Pump duration increased by 1.5x.`;
  }
  // Rule 3: Moderate conditions
  else if (waterScore < 30) {
    shouldIrrigate = false;
    pumpDurationMultiplier = 0;
    recommendation = `Conditions are favorable. Low water stress detected — irrigation not required at this time.`;
  } else if (waterScore > 70) {
    pumpDurationMultiplier = 1.2;
    recommendation = `Elevated water stress. Irrigation recommended with increased duration.`;
  } else {
    recommendation = `Normal irrigation cycle recommended. Water stress index: ${Math.round(waterScore)}/100.`;
  }

  return {
    waterScore: Math.round(waterScore),
    shouldIrrigate,
    pumpDurationMultiplier,
    recommendation,
  };
}

export async function fetchCurrentWeather(location: string): Promise<WeatherResult> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("OPENWEATHER_API_KEY not set");

  const url = `${OWM_BASE}/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) {
    logger.error({ status: res.status, location }, "OpenWeatherMap current weather request failed");
    if (res.status === 404) {
      throw new Error(`City "${location}" not found. Please check the spelling and try again.`);
    }
    throw new Error("Weather service unavailable. Please try again later.");
  }

  const data = (await res.json()) as OWMCurrent;
  const temperature = data.main.temp;
  const humidity = data.main.humidity;
  const rainProbability = 0;

  const logic = computeIrrigationLogic(temperature, humidity, rainProbability);

  return {
    temperature,
    humidity,
    rainProbability,
    description: data.weather[0]?.description ?? "clear",
    icon: data.weather[0]?.icon ?? "01d",
    windSpeed: data.wind?.speed ?? 0,
    city: data.name,
    ...logic,
  };
}

export async function fetchWeatherWithForecast(location: string): Promise<WeatherResult> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("OPENWEATHER_API_KEY not set");

  const forecastUrl = `${OWM_BASE}/forecast?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric&cnt=3`;
  const currentUrl = `${OWM_BASE}/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;

  const [forecastRes, currentRes] = await Promise.all([fetch(forecastUrl), fetch(currentUrl)]);

  if (!currentRes.ok) {
    logger.error({ status: currentRes.status, location }, "OpenWeatherMap current weather request failed");
    if (currentRes.status === 404) {
      throw new Error(`City "${location}" not found. Please check the spelling and try again.`);
    }
    throw new Error("Weather service unavailable. Please try again later.");
  }

  const current = (await currentRes.json()) as OWMCurrent;
  const temperature = current.main.temp;
  const humidity = current.main.humidity;

  let rainProbability = 0;
  if (forecastRes.ok) {
    const forecast = (await forecastRes.json()) as OWMForecast;
    const maxPop = Math.max(...forecast.list.slice(0, 3).map((item) => item.pop ?? 0));
    rainProbability = Math.round(maxPop * 100);
  }

  const logic = computeIrrigationLogic(temperature, humidity, rainProbability);

  return {
    temperature,
    humidity,
    rainProbability,
    description: current.weather[0]?.description ?? "clear",
    icon: current.weather[0]?.icon ?? "01d",
    windSpeed: current.wind?.speed ?? 0,
    city: current.name,
    ...logic,
  };
}

export async function fetchForecast(location: string): Promise<ForecastResult> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("OPENWEATHER_API_KEY not set");

  const url = `${OWM_BASE}/forecast?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) {
    logger.error({ status: res.status, location }, "OpenWeatherMap forecast request failed");
    if (res.status === 404) {
      throw new Error(`City "${location}" not found. Please check the spelling and try again.`);
    }
    throw new Error("Weather service unavailable. Please try again later.");
  }

  const data = (await res.json()) as OWMForecast;

  return {
    city: data.city.name,
    items: data.list.map((item) => ({
      timestamp: new Date(item.dt * 1000).toISOString(),
      temperature: item.main.temp,
      rainProbability: Math.round((item.pop ?? 0) * 100),
      humidity: item.main.humidity,
      description: item.weather[0]?.description ?? "clear",
      icon: item.weather[0]?.icon ?? "01d",
    })),
  };
}
