"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SensorData,
  getConnectionStatus,
  getDeviceSettings,
  getLatestSensorReading,
  getSensorHistory,
  type DeviceSettings,
} from "@/lib/api";
import {
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  CloudSun,
  Droplets,
  Flame,
  Heart,
  Home,
  Moon,
  Snowflake,
  Sun,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Wind,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TIME_RANGES = [
  { label: "Last 1 Minute", value: "1m" },
  { label: "Last 5 Minutes", value: "5m" },
  { label: "Last 15 Minutes", value: "15m" },
  { label: "Last 30 Minutes", value: "30m" },
  { label: "Last Hour", value: "1h" },
  { label: "Last 6 Hours", value: "6h" },
  { label: "Last 12 Hours", value: "12h" },
  { label: "Last 24 Hours", value: "1d" },
  { label: "Last 3 Days", value: "3d" },
  { label: "Last Week", value: "1w" },
  { label: "Last Month", value: "30d" },
];

export function SensorDashboard() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [latestReading, setLatestReading] = useState<SensorData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [timeRange, setTimeRange] = useState("30m");
  const [historyMetadata, setHistoryMetadata] = useState<{
    count: number;
    startTime: string;
    endTime: string;
    period: string;
  } | null>(null);
  const [deviceSettings, setDeviceSettings] = useState<DeviceSettings | null>(
    null
  );
  const [selectedMetric, setSelectedMetric] = useState<
    "all" | "temperature" | "humidity" | "light"
  >("all");

  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsInitialLoading(true);
        setError(null); // Only clear error on initial load
      } else {
        setIsRefreshing(true);
      }

      // Fetch latest reading first
      try {
        const latest = await getLatestSensorReading();
        if (latest && !latest.message) {
          setLatestReading({
            temperature: latest.temperature,
            humidity: latest.humidity,
            ldr: latest.ldr,
            timestamp: latest.timestamp,
          });
        }
      } catch (err) {
        console.error("Failed to fetch latest reading:", err);
        // Only set error on initial load
        if (isInitial) {
          setError("Failed to fetch latest reading");
        }
      }

      // Fetch connection status
      try {
        const connection = await getConnectionStatus();
        setIsConnected(connection.isConnected);
      } catch (err) {
        console.error("Failed to fetch connection status:", err);
      }

      // Fetch device settings
      try {
        const settings = await getDeviceSettings();
        setDeviceSettings(settings);
      } catch (err) {
        console.error("Failed to fetch device settings:", err);
      }

      // Fetch historical data using new history endpoint
      try {
        const historyResponse = await getSensorHistory(timeRange);
        setSensorData(historyResponse.data);

        // Store metadata for display
        setHistoryMetadata({
          count: historyResponse.count,
          startTime: historyResponse.startTime,
          endTime: historyResponse.endTime,
          period: historyResponse.period,
        });

        // Clear error if we successfully fetched data
        if (error) {
          setError(null);
        }

        // If we have data but no latest reading was fetched, use first item
        if (historyResponse.data.length > 0) {
          // Use the most recent reading from history if we don't have a latest reading
          // Use functional update to avoid stale closure
          setLatestReading((currentLatest) => {
            if (
              !currentLatest ||
              new Date(historyResponse.data[0].timestamp) >
                new Date(currentLatest.timestamp)
            ) {
              return historyResponse.data[0];
            }
            return currentLatest;
          });
        }
      } catch (err) {
        console.error("Failed to fetch historical data:", err);
        // Only set error on initial load, don't block UI on refresh failures
        if (isInitial) {
          setError(
            "Failed to fetch sensor data. Make sure the backend server is running."
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch sensor data:", error);
      // Only set error on initial load
      if (isInitial) {
        setError(
          "Failed to fetch sensor data. Please check your API connection."
        );
      }
    } finally {
      if (isInitial) {
        setIsInitialLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    // Reset to initial loading when timeRange changes
    setIsInitialLoading(true);
    fetchData(true); // Initial load
    const interval = setInterval(() => fetchData(false), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const getEnvironmentStatus = () => {
    if (!latestReading || !deviceSettings) {
      return {
        status: "Unknown",
        message: "No sensor data available",
        color: "bg-gray-500",
        textColor: "text-gray-700",
        icon: AlertTriangle,
        tips: "Make sure your device is connected and collecting data.",
        lightLevel: "unknown" as const,
      };
    }

    const { temperature, humidity, ldr } = latestReading;
    const { alertThresholds } = deviceSettings;

    // Calculate status scores
    const tempInRange =
      temperature >= alertThresholds.temperature.min &&
      temperature <= alertThresholds.temperature.max;
    const humidityInRange =
      humidity >= alertThresholds.humidity.min &&
      humidity <= alertThresholds.humidity.max;
    // Light: 0 means dark, higher values (closer to 1023) mean brighter
    const lightLevel = ldr > 768 ? "bright" : ldr > 256 ? "moderate" : "dim";

    // Determine overall status
    let status: string;
    let message: string;
    let color: string;
    let textColor: string;
    let icon: React.ComponentType<{ className?: string }>;
    let tips: string;

    if (tempInRange && humidityInRange) {
      // Perfect conditions
      if (
        temperature >= 20 &&
        temperature <= 25 &&
        humidity >= 40 &&
        humidity <= 60
      ) {
        status = "Perfect";
        message = "Your environment is perfectly balanced! 🌟";
        color = "bg-green-500";
        textColor = "text-green-700";
        icon = CheckCircle2;
        tips =
          "Temperature and humidity are in the ideal range. Great for comfort and health!";
      } else if (temperature >= 18 && temperature <= 22) {
        status = "Cozy";
        message = "Your space feels cozy and comfortable! 🏠";
        color = "bg-green-400";
        textColor = "text-green-700";
        icon = Home;
        tips =
          "Perfect for relaxation. The temperature is just right for a cozy atmosphere.";
      } else {
        status = "Healthy";
        message = "Your environment is healthy and comfortable! ✅";
        color = "bg-green-500";
        textColor = "text-green-700";
        icon = Heart;
        tips = "All parameters are within safe ranges. Keep it up!";
      }
    } else if (!tempInRange && !humidityInRange) {
      // Both out of range
      if (
        temperature > alertThresholds.temperature.max &&
        humidity < alertThresholds.humidity.min
      ) {
        status = "Hot & Dry";
        message = "It's too hot and dry in here! 🔥";
        color = "bg-red-500";
        textColor = "text-red-700";
        icon = Flame;
        tips =
          "Consider cooling down and adding humidity. Use a fan or AC, and a humidifier if available.";
      } else if (
        temperature < alertThresholds.temperature.min &&
        humidity > alertThresholds.humidity.max
      ) {
        status = "Cold & Damp";
        message = "It's too cold and humid! ❄️";
        color = "bg-blue-500";
        textColor = "text-blue-700";
        icon = Snowflake;
        tips =
          "Warm up the space and reduce humidity. Consider heating and ventilation.";
      } else {
        status = "Uncomfortable";
        message = "Multiple factors need attention";
        color = "bg-orange-500";
        textColor = "text-orange-700";
        icon = AlertTriangle;
        tips =
          "Temperature and humidity are both outside optimal ranges. Adjust both for better comfort.";
      }
    } else if (!tempInRange) {
      // Temperature out of range
      if (temperature > alertThresholds.temperature.max) {
        status = "Too Hot";
        message = "It's getting too warm! 🌡️";
        color = "bg-red-500";
        textColor = "text-red-700";
        icon = Flame;
        tips =
          "Consider opening windows, using a fan, or turning on AC to cool down.";
      } else {
        status = "Too Cold";
        message = "It's a bit chilly! 🧊";
        color = "bg-blue-500";
        textColor = "text-blue-700";
        icon = Snowflake;
        tips =
          "Warm up the space with heating or close windows to retain heat.";
      }
    } else {
      // Humidity out of range
      if (humidity < alertThresholds.humidity.min) {
        status = "Too Dry";
        message = "The air is too dry! 💨";
        color = "bg-orange-400";
        textColor = "text-orange-700";
        icon = Wind;
        tips =
          "Add moisture with a humidifier, plants, or by placing water bowls around.";
      } else {
        status = "Too Humid";
        message = "The air is too moist! 💧";
        color = "bg-indigo-500";
        textColor = "text-indigo-700";
        icon = CloudRain;
        tips =
          "Improve ventilation, use a dehumidifier, or open windows to reduce moisture.";
      }
    }

    // Add light level info to tips
    let lightStatus = "";
    if (lightLevel === "bright") {
      lightStatus = " The space is well-lit.";
    } else if (lightLevel === "moderate") {
      lightStatus = " The lighting is moderate.";
    } else {
      lightStatus =
        " The space is quite dark. Consider adding more light for better visibility.";
    }
    tips += lightStatus;

    return { status, message, color, textColor, icon, tips, lightLevel };
  };

  // Use latestReading if available, otherwise fall back to first item in sensorData
  const latestData = latestReading || sensorData[0];
  const previousData = sensorData[1];

  // Calculate trends
  const tempTrend =
    previousData && latestData
      ? ((latestData.temperature - previousData.temperature) /
          previousData.temperature) *
        100
      : 0;

  const humidityTrend =
    previousData && latestData
      ? ((latestData.humidity - previousData.humidity) /
          previousData.humidity) *
        100
      : 0;

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Loading sensor data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{error}</p>
          <p className="text-red-600 text-sm mt-2">
            Please verify your API URL is correctly configured and the backend
            is accessible.
          </p>
        </div>
      </div>
    );
  }

  if (!latestData && sensorData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-4">
          <p className="text-muted-foreground font-medium mb-2">
            No sensor data available yet
          </p>
          <p className="text-muted-foreground text-sm">
            {isConnected
              ? "Waiting for ESP32 to send data..."
              : "ESP32 is not connected. Make sure it's powered on and connected to WiFi."}
          </p>
        </div>
      </div>
    );
  }

  const envStatus = getEnvironmentStatus();
  const LightIcon =
    envStatus.lightLevel === "bright"
      ? Sun
      : envStatus.lightLevel === "moderate"
      ? CloudSun
      : Moon;

  return (
    <div className="space-y-4">
      {/* Environment Status */}
      {latestReading && deviceSettings && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <envStatus.icon className={`h-5 w-5 ${envStatus.textColor}`} />
              <CardTitle>Environment Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`${envStatus.color} text-white p-6 rounded-lg mb-4 text-center`}
            >
              <div className="text-3xl font-bold mb-2">{envStatus.status}</div>
              <div className="text-sm opacity-90">{envStatus.message}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Tips
                </span>
              </div>
              <p className="text-sm">{envStatus.tips}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <Thermometer className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <div className="text-lg font-semibold">
                  {latestReading.temperature.toFixed(1)}°C
                </div>
              </div>
              <div className="text-center">
                <Droplets className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <div className="text-lg font-semibold">
                  {latestReading.humidity.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <LightIcon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <div className="text-lg font-semibold">{latestReading.ldr}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {envStatus.lightLevel}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Range Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>View Settings</CardTitle>
              <CardDescription>
                Select the time range for historical data
              </CardDescription>
            </div>
            {isRefreshing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>Updating...</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Time Range</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {historyMetadata && (
              <div className="pt-2 border-t space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data Points:</span>
                  <span className="font-medium">
                    {historyMetadata.count.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Time Range:</span>
                  <span className="font-medium text-right">
                    {new Date(historyMetadata.startTime).toLocaleTimeString()} -{" "}
                    {new Date(historyMetadata.endTime).toLocaleTimeString()}
                  </span>
                </div>
                {sensorData.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Latest Reading:
                    </span>
                    <span className="font-medium">
                      {new Date(sensorData[0].timestamp).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sensor Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestData ? latestData.temperature.toFixed(1) : "0.0"}°C
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {previousData && latestData ? (
                <>
                  {tempTrend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  {Math.abs(tempTrend).toFixed(1)}% from last reading
                </>
              ) : (
                <span>No previous reading</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Humidity</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestData ? latestData.humidity.toFixed(1) : "0.0"}%
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {previousData && latestData ? (
                <>
                  {humidityTrend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  {Math.abs(humidityTrend).toFixed(1)}% from last reading
                </>
              ) : (
                <span>No previous reading</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Light Level</CardTitle>
            <Sun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestData ? latestData.ldr : "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sensor History</CardTitle>
          <CardDescription>
            {historyMetadata
              ? `Environmental data: ${historyMetadata.count.toLocaleString()} readings from ${
                  TIME_RANGES.find(
                    (r) => r.value === timeRange
                  )?.label.toLowerCase() || timeRange
                }`
              : `Environmental data from ${sensorData.length} readings`}
          </CardDescription>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={selectedMetric === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric("all")}
            >
              All
            </Button>
            <Button
              variant={selectedMetric === "temperature" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric("temperature")}
            >
              <Thermometer className="h-4 w-4 mr-2" />
              Temperature
            </Button>
            <Button
              variant={selectedMetric === "humidity" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric("humidity")}
            >
              <Droplets className="h-4 w-4 mr-2" />
              Humidity
            </Button>
            <Button
              variant={selectedMetric === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric("light")}
            >
              <Sun className="h-4 w-4 mr-2" />
              Light
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[...sensorData].reverse()}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient
                  id="temperatureGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient
                  id="humidityGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#4dabf7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4dabf7" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="lightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffd43b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ffd43b" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
              />
              {(selectedMetric === "all" ||
                selectedMetric === "temperature" ||
                selectedMetric === "humidity") && (
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={
                    selectedMetric === "temperature"
                      ? ["auto", "auto"]
                      : selectedMetric === "humidity"
                      ? [0, 100]
                      : [0, 100]
                  }
                  label={{
                    value:
                      selectedMetric === "temperature"
                        ? "Temperature (°C)"
                        : selectedMetric === "humidity"
                        ? "Humidity (%)"
                        : "Temperature (°C) / Humidity (%)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
              )}
              {(selectedMetric === "all" || selectedMetric === "light") && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={[0, 1023]}
                  label={{
                    value: "Light Level",
                    angle: 90,
                    position: "insideRight",
                  }}
                />
              )}
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleString()}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              {(selectedMetric === "all" ||
                selectedMetric === "temperature") && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  stroke="#ff6b6b"
                  fill="url(#temperatureGradient)"
                  fillOpacity={1}
                  strokeWidth={2}
                />
              )}
              {(selectedMetric === "all" || selectedMetric === "humidity") && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity (%)"
                  stroke="#4dabf7"
                  fill="url(#humidityGradient)"
                  fillOpacity={1}
                  strokeWidth={2}
                />
              )}
              {(selectedMetric === "all" || selectedMetric === "light") && (
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="ldr"
                  name="Light Level"
                  stroke="#ffd43b"
                  fill="url(#lightGradient)"
                  fillOpacity={1}
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-start gap-4 text-sm">
            <div className="grid gap-1">
              <div className="flex items-center gap-2 font-medium leading-none">
                Temperature {tempTrend > 0 ? "up" : "down"} by{" "}
                {Math.abs(tempTrend).toFixed(1)}%
                {tempTrend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="text-muted-foreground">
                Last updated:{" "}
                {latestData
                  ? new Date(latestData.timestamp).toLocaleString()
                  : "Never"}
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
