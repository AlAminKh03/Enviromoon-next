# ESP32 Remote Setup Guide

## Overview

This guide will help you set up your ESP32 to connect to your EnviroMoon backend server via WiFi, eliminating the need for a direct computer connection.

## Prerequisites

1. **ESP32 Development Board** (ESP32-WROOM-32 or similar)
2. **Arduino IDE** with ESP32 board support installed
3. **Required Libraries:**
   - DHT sensor library (by Adafruit)
   - ArduinoJson (by Benoit Blanchon)
   - HTTPClient (included with ESP32)

## Step 1: Install ESP32 Board Support

1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "ESP32" and install "esp32 by Espressif Systems"
6. Select your board: **Tools → Board → ESP32 Arduino → ESP32 Dev Module**

## Step 2: Install Required Libraries

1. Go to **Sketch → Include Library → Manage Libraries**
2. Install:
   - **DHT sensor library** by Adafruit
   - **ArduinoJson** by Benoit Blanchon (version 6.x)

## Step 3: Configure WiFi and Server

1. Open `esp32-remote.ino` in Arduino IDE
2. Update these lines with your information:

```cpp
// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";           // Your WiFi network name
const char* password = "YOUR_WIFI_PASSWORD";   // Your WiFi password

// Backend server URL (your computer's IP address)
const char* serverUrl = "http://192.168.68.107:5000";  // Update with your server IP
```

**To find your server IP:**

- Windows: Open Command Prompt, type `ipconfig`, look for "IPv4 Address"
- Mac/Linux: Open Terminal, type `ifconfig`, look for "inet" under your network interface

## Step 4: Connect Hardware

Connect your sensors to ESP32:

```
DHT22/DHT11:
- VCC → 3.3V
- GND → GND
- DATA → GPIO 2

LDR (Light Sensor):
- One leg → 3.3V
- Other leg → A0 (via 10kΩ resistor to GND)

LED (Optional):
- Anode → GPIO 13 (via 220Ω resistor)
- Cathode → GND
```

## Step 5: Upload Code

1. Connect ESP32 to your computer via USB
2. Select the correct port: **Tools → Port → COMx** (Windows) or **/dev/ttyUSBx** (Linux/Mac)
3. Click **Upload** button
4. Open Serial Monitor (115200 baud) to see connection status

## Step 6: Verify Connection

After uploading, you should see in Serial Monitor:

```
Connecting to WiFi: YOUR_SSID
WiFi connected!
IP address: 192.168.x.x
Signal strength (RSSI): -xx dBm

=== EnviroMoon ESP32 Remote ===
Device ready!
Server URL: http://192.168.68.107:5000
```

## Step 7: Test Remote Access

1. Make sure your backend server is running
2. Open your mobile app or frontend
3. You should see data coming from ESP32 automatically
4. Try controlling the device from the mobile app

## How It Works

### Data Flow:

1. **ESP32 reads sensors** every 10 seconds (configurable)
2. **ESP32 sends data** to backend via HTTP POST: `/api/sensors/data`
3. **Backend saves** data to MongoDB
4. **Mobile app** fetches data from backend

### Command Flow:

1. **Mobile app** sends command via: `/api/device/control`
2. **Backend queues** command for ESP32
3. **ESP32 polls** `/api/device/commands` every loop
4. **ESP32 receives** and executes command

## Troubleshooting

### ESP32 won't connect to WiFi

- Check SSID and password are correct
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Check WiFi signal strength
- Try restarting ESP32

### No data received by server

- Verify server IP address is correct
- Check server is running and accessible
- Check firewall allows port 5000
- Verify ESP32 and server are on same network

### Serial Monitor shows errors

- Check baud rate is set to 115200
- Verify all libraries are installed
- Check sensor connections
- Ensure DHT sensor type matches (DHT22 vs DHT11)

### Commands not working

- Verify ESP32 is polling `/api/device/commands`
- Check Serial Monitor for received commands
- Ensure backend is queueing commands correctly

## Advantages of ESP32 Setup

✅ **No computer needed** - ESP32 connects directly to WiFi  
✅ **Remote access** - Control from anywhere on your network  
✅ **Multiple devices** - Can have multiple ESP32s reporting to same server  
✅ **Better reliability** - No USB connection issues  
✅ **Scalable** - Easy to add more sensors or devices

## Next Steps

- Add more sensors (CO2, pressure, etc.)
- Implement MQTT for cloud connectivity
- Add OTA (Over-The-Air) updates
- Set up port forwarding for internet access
- Add authentication/security

## Support

If you encounter issues:

1. Check Serial Monitor output
2. Check server console logs
3. Verify network connectivity
4. Test with simple HTTP requests
