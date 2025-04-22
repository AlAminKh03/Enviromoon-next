export interface SensorData {
  temperature: number;
  humidity: number;
  ldr: number;
  timestamp: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
