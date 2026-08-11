import { useQuery } from "@tanstack/react-query";

export type AirQualityStatus = "Good" | "Moderate" | "Unhealthy" | "Hazardous";

export type EnvSensorNode = {
  id: string;
  location: string;
  aqi: number;
  pm25: number;
  co2ppm: number;
  temperatureC: number;
  humidity: number;
  status: AirQualityStatus;
  lastUpdated: string;
};

const MOCK_SENSORS: EnvSensorNode[] = [
  {
    id: "ENV-N-01",
    location: "Commonwealth Ave (North)",
    aqi: 45,
    pm25: 12.5,
    co2ppm: 420,
    temperatureC: 32.5,
    humidity: 68,
    status: "Good",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "ENV-S-02",
    location: "Visayas Ave Intersection",
    aqi: 110,
    pm25: 45.2,
    co2ppm: 850,
    temperatureC: 34.1,
    humidity: 62,
    status: "Unhealthy",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "ENV-W-03",
    location: "Tandang Sora Palengke",
    aqi: 75,
    pm25: 22.1,
    co2ppm: 610,
    temperatureC: 33.2,
    humidity: 65,
    status: "Moderate",
    lastUpdated: new Date().toISOString(),
  }
];

export function useEnvSensors() {
  return useQuery({
    queryKey: ["env-sensors"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
      return MOCK_SENSORS;
    }
  });
}
