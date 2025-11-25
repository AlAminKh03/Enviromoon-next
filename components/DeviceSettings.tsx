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
import { Switch } from "@/components/ui/switch";
import {
  disableLightSensor,
  disableTempSensor,
  enableLightSensor,
  enableTempSensor,
  getDeviceSettings,
  updateCalibration,
  updateSamplingInterval,
} from "@/lib/api";
import { Sparkles, Sun, Thermometer } from "lucide-react";
import { useEffect, useState } from "react";

export function DeviceSettings() {
  const [tempSensorEnabled, setTempSensorEnabled] = useState(true);
  const [lightSensorEnabled, setLightSensorEnabled] = useState(true);
  const [isUpdatingTemp, setIsUpdatingTemp] = useState(false);
  const [isUpdatingLight, setIsUpdatingLight] = useState(false);
  const [samplingInterval, setSamplingInterval] = useState("30");
  const [isUpdatingInterval, setIsUpdatingInterval] = useState(false);
  const [temperatureOffset, setTemperatureOffset] = useState("0.0");
  const [humidityOffset, setHumidityOffset] = useState("0.0");
  const [lightThreshold, setLightThreshold] = useState("512");
  const [isUpdatingCalibration, setIsUpdatingCalibration] = useState(false);

  // Load device settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getDeviceSettings();
        setTemperatureOffset(settings.temperatureOffset.toString());
        setHumidityOffset(settings.humidityOffset.toString());
        setLightThreshold(settings.lightThreshold.toString());
      } catch (error) {
        console.error("Failed to load device settings:", error);
      }
    };
    loadSettings();
  }, []);

  const handleTempSensorToggle = async (enabled: boolean) => {
    try {
      setIsUpdatingTemp(true);
      if (enabled) {
        await enableTempSensor();
        setTempSensorEnabled(true);
      } else {
        await disableTempSensor();
        setTempSensorEnabled(false);
      }
    } catch (error) {
      console.error("Failed to toggle temperature sensor:", error);
      // Revert state on error
      setTempSensorEnabled(!enabled);
    } finally {
      setIsUpdatingTemp(false);
    }
  };

  const handleLightSensorToggle = async (enabled: boolean) => {
    try {
      setIsUpdatingLight(true);
      if (enabled) {
        await enableLightSensor();
        setLightSensorEnabled(true);
      } else {
        await disableLightSensor();
        setLightSensorEnabled(false);
      }
    } catch (error) {
      console.error("Failed to toggle light sensor:", error);
      // Revert state on error
      setLightSensorEnabled(!enabled);
    } finally {
      setIsUpdatingLight(false);
    }
  };

  const handleSamplingIntervalChange = async () => {
    const intervalValue = parseInt(samplingInterval);
    if (!samplingInterval || isNaN(intervalValue) || intervalValue < 1) {
      return; // Don't update if empty or invalid
    }
    try {
      setIsUpdatingInterval(true);
      await updateSamplingInterval(intervalValue);
    } catch (error) {
      console.error("Failed to update sampling interval:", error);
    } finally {
      setIsUpdatingInterval(false);
    }
  };

  const handleCalibrationUpdate = async () => {
    try {
      setIsUpdatingCalibration(true);
      await updateCalibration(
        parseFloat(temperatureOffset) || 0,
        parseFloat(humidityOffset) || 0,
        parseInt(lightThreshold) || 512
      );
    } catch (error) {
      console.error("Failed to update calibration:", error);
    } finally {
      setIsUpdatingCalibration(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sensor Controls */}
      <Card className="relative opacity-75">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Sensor Controls
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  <Sparkles className="h-3 w-3" />
                  Upcoming
                </span>
              </CardTitle>
              <CardDescription>
                Enable or disable individual sensors on your device
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between opacity-60">
            <div className="flex items-center gap-3">
              <Thermometer className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label className="text-muted-foreground">
                  Temperature & Humidity Sensor
                </Label>
                <p className="text-sm text-muted-foreground">
                  Control temperature and humidity readings
                </p>
              </div>
            </div>
            <Switch
              checked={tempSensorEnabled}
              onCheckedChange={() => {}}
              disabled={true}
              className="cursor-not-allowed"
            />
          </div>

          <div className="flex items-center justify-between opacity-60">
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label className="text-muted-foreground">
                  Light Sensor (LDR)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Control light level readings
                </p>
              </div>
            </div>
            <Switch
              checked={lightSensorEnabled}
              onCheckedChange={() => {}}
              disabled={true}
              className="cursor-not-allowed"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Collection</CardTitle>
          <CardDescription>
            Configure how often the device collects sensor readings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sampling Interval (seconds)</Label>
            <p className="text-sm text-muted-foreground">
              How often the device takes a reading. Lower values = more frequent
              readings but more battery/data usage.
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                value={samplingInterval}
                onChange={(e) => setSamplingInterval(e.target.value)}
                placeholder="30"
                min="1"
                max="3600"
                className="flex-1"
                disabled={isUpdatingInterval}
              />
              <Button
                onClick={handleSamplingIntervalChange}
                disabled={isUpdatingInterval}
              >
                {isUpdatingInterval ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calibration Card */}
      <Card className="relative opacity-75">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Sensor Calibration
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  <Sparkles className="h-3 w-3" />
                  Upcoming
                </span>
              </CardTitle>
              <CardDescription>
                Adjust sensor readings if they're consistently off. Use positive
                values to increase readings, negative to decrease.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 opacity-60">
            <Label className="text-muted-foreground">
              Temperature Offset (°C)
            </Label>
            <p className="text-sm text-muted-foreground">
              Add or subtract from temperature readings. Example: +2.5 adds
              2.5°C to all readings.
            </p>
            <Input
              type="number"
              value={temperatureOffset}
              onChange={() => {}}
              placeholder="0.0"
              step="0.1"
              disabled={true}
              className="cursor-not-allowed"
            />
          </div>
          <div className="space-y-2 opacity-60">
            <Label className="text-muted-foreground">Humidity Offset (%)</Label>
            <p className="text-sm text-muted-foreground">
              Add or subtract from humidity readings. Example: -5 subtracts 5%
              from all readings.
            </p>
            <Input
              type="number"
              value={humidityOffset}
              onChange={() => {}}
              placeholder="0.0"
              step="0.1"
              disabled={true}
              className="cursor-not-allowed"
            />
          </div>
          <div className="space-y-2 opacity-60">
            <Label className="text-muted-foreground">
              Light Sensor Threshold
            </Label>
            <p className="text-sm text-muted-foreground">
              Threshold value for light sensor (0-1023). Lower values = more
              sensitive to light.
            </p>
            <Input
              type="number"
              value={lightThreshold}
              onChange={() => {}}
              placeholder="512"
              min="0"
              max="1023"
              disabled={true}
              className="cursor-not-allowed"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full cursor-not-allowed"
            onClick={() => {}}
            disabled={true}
          >
            Update Calibration
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
