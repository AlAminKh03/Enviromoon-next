export interface SensorData {
  temperature: number;
  humidity: number;
  ldr: number;
  timestamp: string;
}

export interface LatestSensorReading {
  temperature: number;
  humidity: number;
  ldr: number;
  timestamp: string;
  formatted?: string;
  message?: string;
}

export interface DeviceStatus {
  uptime?: number;
  totalReadings?: number;
  samplingInterval?: number;
  ledState?: boolean;
  temperatureOffset?: number;
  humidityOffset?: number;
  lightThreshold?: number;
  ipAddress?: string;
  rssi?: number;
  timestamp?: string;
  message?: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastDataReceived: {
    timestamp: string;
    timeAgo: string;
  } | null;
  lastStatusUpdate: {
    timestamp: string;
    timeAgo: string;
  } | null;
  lastCommandPoll: {
    timestamp: string;
    timeAgo: string;
  } | null;
  statistics: {
    totalDataReceived: number;
    totalCommandsSent: number;
  };
  latestSensorData: SensorData | null;
}

export interface Alert {
  _id?: string;
  message: string;
  timestamp: string;
}

export interface SensorHistoryResponse {
  period: string;
  startTime: string;
  endTime: string;
  count: number;
  data: SensorData[];
}

// API Base URL - Set NEXT_PUBLIC_API_URL environment variable or replace the default URL
// IMPORTANT: Check your backend structure:
// - If endpoints are at root: https://enviromoon-node.vercel.app/sensors/history → use: "https://enviromoon-node.vercel.app"
// - If endpoints are under /api: https://enviromoon-node.vercel.app/api/sensors/history → use: "https://enviromoon-node.vercel.app/api"
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://enviromoon-node.vercel.app/api";

// Log API URL for debugging
if (typeof window !== "undefined") {
  console.log("🌐 API Base URL:", API_BASE_URL);
}

// ✅ GET /api/sensors - Fetch latest sensor data (last 10 readings)
export async function getLatestSensorData(): Promise<SensorData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/sensors`);
    if (!response.ok) {
      throw new Error("Failed to fetch sensor data");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    throw error;
  }
}

// ✅ GET /api/sensors/latest - Get the most recent sensor reading
export async function getLatestSensorReading(): Promise<LatestSensorReading> {
  try {
    const response = await fetch(`${API_BASE_URL}/sensors/latest`);
    if (!response.ok) {
      throw new Error("Failed to fetch latest sensor reading");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching latest sensor reading:", error);
    throw error;
  }
}

// ✅ GET /api/sensors/range - Get readings with time range
export async function getSensorDataByRange(
  start: Date,
  end: Date,
  limit?: number
): Promise<SensorData[]> {
  try {
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
      ...(limit && { limit: limit.toString() }),
    });

    const response = await fetch(`${API_BASE_URL}/sensors/range?${params}`);
    if (!response.ok) {
      throw new Error("Failed to fetch sensor data range");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching sensor data range:", error);
    throw error;
  }
}

// ✅ GET /api/sensors/history - Fetch sensor data for a specific time period
export async function getSensorHistory(
  period: string,
  limit?: number
): Promise<SensorHistoryResponse> {
  try {
    const params = new URLSearchParams({
      period,
      ...(limit && { limit: limit.toString() }),
    });

    const url = `${API_BASE_URL}/sensors/history?${params}`;
    console.log("🔍 Fetching:", url);

    const response = await fetch(url);

    console.log("📡 Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error Response:", errorText);

      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = {
          error: errorText || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const errorMessage =
        error.error || `Failed to fetch sensor history (${response.status})`;
      console.error("API Error:", errorMessage, "URL:", url);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(
      "✅ Successfully fetched sensor history:",
      data.count,
      "records"
    );
    return data;
  } catch (error) {
    console.error("❌ Error fetching sensor history:", error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Network error: Unable to reach API at ${API_BASE_URL}. Please check your API URL configuration and CORS settings.`
      );
    }
    throw error;
  }
}

// ✅ GET /api/device/status - Get latest device status
export async function getDeviceStatus(): Promise<DeviceStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/device/status`);
    if (!response.ok) {
      throw new Error("Failed to fetch device status");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching device status:", error);
    throw error;
  }
}

// ✅ GET /api/device/connection - Check device connection status
export async function getConnectionStatus(): Promise<ConnectionStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/device/connection`);
    if (!response.ok) {
      throw new Error("Failed to fetch connection status");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching connection status:", error);
    throw error;
  }
}

// ✅ GET /api/alerts - Get recent alerts
export async function getAlerts(limit?: number): Promise<Alert[]> {
  try {
    const params = new URLSearchParams();
    if (limit) {
      params.append("limit", limit.toString());
    }

    const url = limit
      ? `${API_BASE_URL}/alerts?${params}`
      : `${API_BASE_URL}/alerts`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch alerts");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching alerts:", error);
    throw error;
  }
}

// ✅ POST /api/device/command - Queue a command for ESP32
export async function queueCommand(
  command: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/device/command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command }),
    });

    if (!response.ok) {
      throw new Error("Failed to queue command");
    }
    return response.json();
  } catch (error) {
    console.error("Error queueing command:", error);
    throw error;
  }
}

// ✅ POST /api/sensors/read - Force immediate reading
export async function triggerImmediateRead(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/sensors/read`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to trigger immediate read");
    }
    return response.json();
  } catch (error) {
    console.error("Error triggering immediate read:", error);
    throw error;
  }
}

// ✅ POST /api/settings/sampling-interval - Update sampling interval
export async function updateSamplingInterval(
  interval: number
): Promise<{ success: boolean; interval: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/sampling-interval`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ interval }),
    });

    if (!response.ok) {
      throw new Error("Failed to update sampling interval");
    }
    return response.json();
  } catch (error) {
    console.error("Error updating sampling interval:", error);
    throw error;
  }
}

export interface DeviceSettings {
  temperatureOffset: number;
  humidityOffset: number;
  lightThreshold: number;
  alertThresholds: {
    temperature: { min: number; max: number };
    humidity: { min: number; max: number };
    light: { min: number; max: number };
  };
  autoReconnect: boolean;
  debugMode: boolean;
}

// ✅ GET /api/device/settings - Get device settings
export async function getDeviceSettings(): Promise<DeviceSettings> {
  try {
    const response = await fetch(`${API_BASE_URL}/device/settings`);
    if (!response.ok) {
      throw new Error("Failed to fetch device settings");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching device settings:", error);
    // Return default settings if fetch fails
    return {
      temperatureOffset: 0,
      humidityOffset: 0,
      lightThreshold: 512,
      alertThresholds: {
        temperature: { min: 10, max: 35 },
        humidity: { min: 30, max: 80 },
        light: { min: 0, max: 1023 },
      },
      autoReconnect: true,
      debugMode: false,
    };
  }
}

// ✅ POST /api/sensors/temp/enable - Enable temperature/humidity readings
export async function enableTempSensor(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/sensors/temp/enable`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to enable temperature sensor");
    }
    return response.json();
  } catch (error) {
    console.error("Error enabling temperature sensor:", error);
    throw error;
  }
}

// ✅ POST /api/sensors/temp/disable - Disable temperature/humidity readings
export async function disableTempSensor(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/sensors/temp/disable`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to disable temperature sensor");
    }
    return response.json();
  } catch (error) {
    console.error("Error disabling temperature sensor:", error);
    throw error;
  }
}

// ✅ POST /api/sensors/light/enable - Enable light (LDR) readings
export async function enableLightSensor(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/sensors/light/enable`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to enable light sensor");
    }
    return response.json();
  } catch (error) {
    console.error("Error enabling light sensor:", error);
    throw error;
  }
}

// ✅ POST /api/sensors/light/disable - Disable light (LDR) readings
export async function disableLightSensor(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/sensors/light/disable`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to disable light sensor");
    }
    return response.json();
  } catch (error) {
    console.error("Error disabling light sensor:", error);
    throw error;
  }
}

// ✅ POST /api/device/calibration - Update sensor calibration
export async function updateCalibration(
  temperatureOffset?: number,
  humidityOffset?: number,
  lightThreshold?: number
): Promise<{ success: boolean; settings: DeviceSettings }> {
  try {
    const body: any = {};
    if (temperatureOffset !== undefined) {
      body.temperatureOffset = temperatureOffset;
    }
    if (humidityOffset !== undefined) {
      body.humidityOffset = humidityOffset;
    }
    if (lightThreshold !== undefined) {
      body.lightThreshold = lightThreshold;
    }

    const response = await fetch(`${API_BASE_URL}/device/calibration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to update calibration");
    }
    return response.json();
  } catch (error) {
    console.error("Error updating calibration:", error);
    throw error;
  }
}
