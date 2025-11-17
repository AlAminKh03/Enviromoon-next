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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
