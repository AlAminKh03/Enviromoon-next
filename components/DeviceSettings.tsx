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

export function DeviceSettings() {
  return (
    <div className="space-y-4">
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
            <Input type="number" placeholder="30" min="1" max="3600" />
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
