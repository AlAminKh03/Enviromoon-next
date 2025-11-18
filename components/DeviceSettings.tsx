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
import { Switch } from "@/components/ui/switch";
import {
  enableTempSensor,
  disableTempSensor,
  enableLightSensor,
  disableLightSensor,
  updateSamplingInterval,
} from "@/lib/api";
import { useState } from "react";
import { Thermometer, Sun } from "lucide-react";

export function DeviceSettings() {
  const [tempSensorEnabled, setTempSensorEnabled] = useState(true);
  const [lightSensorEnabled, setLightSensorEnabled] = useState(true);
  const [isUpdatingTemp, setIsUpdatingTemp] = useState(false);
  const [isUpdatingLight, setIsUpdatingLight] = useState(false);
  const [samplingInterval, setSamplingInterval] = useState(30);
  const [isUpdatingInterval, setIsUpdatingInterval] = useState(false);

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
    try {
      setIsUpdatingInterval(true);
      await updateSamplingInterval(samplingInterval);
    } catch (error) {
      console.error("Failed to update sampling interval:", error);
    } finally {
      setIsUpdatingInterval(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sensor Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Sensor Controls</CardTitle>
          <CardDescription>
            Enable or disable individual sensors on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Thermometer className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label>Temperature & Humidity Sensor</Label>
                <p className="text-sm text-muted-foreground">
                  Control temperature and humidity readings
                </p>
              </div>
            </div>
            <Switch
              checked={tempSensorEnabled}
              onCheckedChange={handleTempSensorToggle}
              disabled={isUpdatingTemp}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label>Light Sensor (LDR)</Label>
                <p className="text-sm text-muted-foreground">
                  Control light level readings
                </p>
              </div>
            </div>
            <Switch
              checked={lightSensorEnabled}
              onCheckedChange={handleLightSensorToggle}
              disabled={isUpdatingLight}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Device Configuration</CardTitle>
          <CardDescription>
            Configure your EnviroMoon device settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Settings */}
          <div className="space-y-2">
            <Label>Serial Port</Label>
            <Select defaultValue="COM3">
              <SelectTrigger>
                <SelectValue placeholder="Select port" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COM3">COM3</SelectItem>
                <SelectItem value="COM4">COM4</SelectItem>
                <SelectItem value="COM5">COM5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Baud Rate</Label>
            <Select defaultValue="9600">
              <SelectTrigger>
                <SelectValue placeholder="Select baud rate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9600">9600</SelectItem>
                <SelectItem value="115200">115200</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Collection Settings */}
          <div className="space-y-2">
            <Label>Sampling Interval (seconds)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={samplingInterval}
                onChange={(e) => setSamplingInterval(Number(e.target.value))}
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

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-reconnect</Label>
              <p className="text-sm text-muted-foreground">
                Automatically reconnect if connection is lost
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Debug Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable detailed logging for troubleshooting
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Changes</Button>
        </CardFooter>
      </Card>

      {/* Calibration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Sensor Calibration</CardTitle>
          <CardDescription>
            Calibrate your sensors for accurate readings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Temperature Offset (°C)</Label>
            <Input type="number" placeholder="0.0" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label>Humidity Offset (%)</Label>
            <Input type="number" placeholder="0.0" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label>Light Sensor Threshold</Label>
            <Input type="number" placeholder="512" min="0" max="1023" />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Calibrate Sensors</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
