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
import { Input } from "@/components/ui/input";
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
  getSensorDataByRange,
  getLatestSensorReading,
  updateSamplingInterval,
  getConnectionStatus,
} from "@/lib/api";
import {
  Droplets,
  Sun,
  Thermometer,
  TrendingDown,
  TrendingUp,
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
  { label: "Last Hour", value: "1h" },
  { label: "Last 6 Hours", value: "6h" },
  { label: "Last 24 Hours", value: "24h" },
  { label: "Last Week", value: "7d" },
  { label: "Last Month", value: "30d" },
];

export function SensorDashboard() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [latestReading, setLatestReading] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [timeRange, setTimeRange] = useState("1h");
  const [samplingInterval, setSamplingInterval] = useState(30);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      }

      // Fetch connection status
      try {
        const connection = await getConnectionStatus();
        setIsConnected(connection.isConnected);
      } catch (err) {
        console.error("Failed to fetch connection status:", err);
      }

      // Fetch historical data
      const end = new Date();
      const start = new Date();

      switch (timeRange) {
        case "1h":
          start.setHours(start.getHours() - 1);
          break;
        case "6h":
          start.setHours(start.getHours() - 6);
          break;
        case "24h":
          start.setHours(start.getHours() - 24);
          break;
        case "7d":
          start.setDate(start.getDate() - 7);
          break;
        case "30d":
          start.setDate(start.getDate() - 30);
          break;
      }

      const data = await getSensorDataByRange(start, end);
      setSensorData(data);
      
      // If we have data but no latest reading was fetched, use first item
      if (data.length > 0 && !latestReading) {
        setLatestReading(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch sensor data:", error);
      setError("Failed to fetch sensor data. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const handleSamplingIntervalChange = async () => {
    try {
      await updateSamplingInterval(samplingInterval);
      // Refresh data after updating interval
      fetchData();
    } catch (error) {
      console.error("Failed to update sampling interval:", error);
    }
  };

  // Use latestReading if available, otherwise fall back to first item in sensorData
  const latestData = latestReading || sensorData[0];
  const previousData = sensorData[1];

  // Calculate trends
  const tempTrend = previousData && latestData
    ? ((latestData.temperature - previousData.temperature) /
        previousData.temperature) *
      100
    : 0;

  const humidityTrend = previousData && latestData
    ? ((latestData.humidity - previousData.humidity) /
        previousData.humidity) *
      100
    : 0;

  if (loading) {
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
            Check if the backend server is running on port 5000
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

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Data Controls</CardTitle>
          <CardDescription>
            Configure data collection and viewing settings
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
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
          <div className="space-y-2">
            <Label>Sampling Interval (seconds)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={samplingInterval}
                onChange={(e) => setSamplingInterval(Number(e.target.value))}
                min="1"
                max="3600"
                className="flex-1"
              />
              <Button onClick={handleSamplingIntervalChange}>Update</Button>
            </div>
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
            <div className="text-2xl font-bold">{latestData ? latestData.ldr : "0"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sensor History</CardTitle>
          <CardDescription>
            Environmental data from the last {sensorData.length} readings
          </CardDescription>
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
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, 100]}
                label={{
                  value: "Temperature (°C) / Humidity (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
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
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleString()}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
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
                Last updated: {latestData ? new Date(latestData.timestamp).toLocaleString() : "Never"}
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
