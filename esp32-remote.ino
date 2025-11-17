/*
 * EnviroMoon ESP32 Remote Code
 * This code allows your ESP32 to connect to WiFi and communicate
 * with your backend server directly, eliminating the need for
 * a computer connection.
 * 
 * Setup:
 * 1. Install ESP32 board support in Arduino IDE
 * 2. Install libraries: DHT sensor library, ArduinoJson
 * 3. Update WiFi credentials and server IP below
 * 4. Upload to ESP32
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ========== CONFIGURATION ==========
// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend server URL (use your computer's IP address)
// Example: "http://192.168.68.107:5000"
const char* serverUrl = "http://192.168.68.107:5000";

// Pin definitions (matching your Arduino setup)
#define DHTPIN 2          // DHT22 sensor DATA pin (same as Arduino D2)
#define DHTTYPE DHT22     // DHT22 sensor type
#define LDR_PIN 3         // LDR Module digital output (same as Arduino D3)
#define LED_PIN 13        // Built-in LED (optional)

// Sensor objects
DHT dht(DHTPIN, DHTTYPE);

// Device settings
unsigned long samplingInterval = 10000;  // Default 10 seconds
unsigned long lastReading = 0;
float temperatureOffset = 0.0;
float humidityOffset = 0.0;
int lightThreshold = 512;

// Alert thresholds
struct Thresholds {
  float tempMin = 10.0;
  float tempMax = 35.0;
  float humidityMin = 30.0;
  float humidityMax = 80.0;
  int lightMin = 0;
  int lightMax = 1023;
} thresholds;

// Status tracking
unsigned long deviceStartTime = 0;
unsigned long totalReadings = 0;
bool ledState = false;
bool wifiConnected = false;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Configure LDR Module pin as input (digital)
  pinMode(LDR_PIN, INPUT);
  
  dht.begin();
  deviceStartTime = millis();
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("\n=== EnviroMoon ESP32 Remote ===");
  Serial.println("Device ready!");
  Serial.print("Server URL: ");
  Serial.println(serverUrl);
  Serial.println("Pin Configuration:");
  Serial.println("  DHT22 DATA -> GPIO 2");
  Serial.println("  LDR Module DO -> GPIO 3");
}

void loop() {
  // Reconnect WiFi if disconnected
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    connectToWiFi();
  }
  
  // Check for commands from server (polling)
  checkForCommands();
  
  // Automatic reading based on interval
  if (millis() - lastReading >= samplingInterval) {
    readAndSendSensors();
    checkAlerts();
    lastReading = millis();
  }
  
  delay(100); // Small delay to prevent watchdog issues
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    
    // Blink LED to indicate connection
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, HIGH);
      delay(200);
      digitalWrite(LED_PIN, LOW);
      delay(200);
    }
  } else {
    Serial.println("\nFailed to connect to WiFi!");
    Serial.println("Please check your credentials and try again.");
  }
}

void readAndSendSensors() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // LDR Module reads digital output (HIGH = light detected, LOW = dark)
  // Read multiple times for stability
  int lightDetections = 0;
  for (int i = 0; i < 10; i++) {
    if (digitalRead(LDR_PIN) == HIGH) {
      lightDetections++;
    }
    delay(1);
  }
  
  // Convert to 0-1023 scale (similar to analog reading)
  // HIGH readings = more light, LOW readings = less light
  int ldrValue = (lightDetections * 1023) / 10;
  
  // Apply calibration offsets
  temperature += temperatureOffset;
  humidity += humidityOffset;
  
  // Check for sensor errors
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Error: Failed to read from DHT sensor!");
    return;
  }
  
  // Print to serial (for debugging)
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print(" °C, Humidity: ");
  Serial.print(humidity);
  Serial.print(" %, LDR Output: ");
  Serial.println(ldrValue);
  
  // Send to backend server
  if (wifiConnected) {
    sendDataToServer(temperature, humidity, ldrValue);
  }
  
  totalReadings++;
}

void sendDataToServer(float temp, float humid, int ldr) {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  String url = String(serverUrl) + "/api/sensors/data";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["temperature"] = temp;
  doc["humidity"] = humid;
  doc["ldr"] = ldr;
  doc["timestamp"] = millis(); // Backend will add proper timestamp
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.print("Data sent successfully. Response code: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("Error sending data. Response code: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void checkForCommands() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  static unsigned long lastCommandCheck = 0;
  // Check for commands every 2 seconds (not every loop)
  if (millis() - lastCommandCheck < 2000) {
    return;
  }
  lastCommandCheck = millis();
  
  HTTPClient http;
  String url = String(serverUrl) + "/api/device/commands";
  
  http.begin(url);
  http.setTimeout(1000); // 1 second timeout
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    
    if (response.length() > 0 && response != "[]" && response != "{\"command\":null}") {
      // Parse JSON response
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, response);
      
      if (!error && doc.containsKey("command")) {
        String command = doc["command"].as<String>();
        if (command != "null" && command.length() > 0) {
          handleCommand(command);
        }
      }
    }
  }
  
  http.end();
}

void handleCommand(String command) {
  Serial.print("Received command: ");
  Serial.println(command);
  
  if (command == "READ") {
    readAndSendSensors();
  }
  else if (command == "STATUS") {
    sendStatusToServer();
  }
  else if (command.startsWith("INTERVAL:")) {
    int interval = command.substring(9).toInt();
    if (interval > 0) {
      samplingInterval = interval; // Already in milliseconds from backend
      Serial.print("Interval set to: ");
      Serial.print(samplingInterval / 1000);
      Serial.println(" seconds");
    }
  }
  else if (command == "LED:ON") {
    digitalWrite(LED_PIN, HIGH);
    ledState = true;
    Serial.println("LED ON");
  }
  else if (command == "LED:OFF") {
    digitalWrite(LED_PIN, LOW);
    ledState = false;
    Serial.println("LED OFF");
  }
  else if (command == "RESET") {
    Serial.println("Resetting device...");
    samplingInterval = 10000;
    temperatureOffset = 0.0;
    humidityOffset = 0.0;
    lightThreshold = 512;
    thresholds.tempMin = 10.0;
    thresholds.tempMax = 35.0;
    thresholds.humidityMin = 30.0;
    thresholds.humidityMax = 80.0;
    Serial.println("Device reset complete");
  }
  else if (command == "RESTART") {
    Serial.println("Restarting device...");
    delay(100);
    ESP.restart();
  }
  else if (command.startsWith("CALIB_TEMP:")) {
    temperatureOffset = command.substring(11).toFloat();
    Serial.print("Temperature offset set to: ");
    Serial.println(temperatureOffset);
  }
  else if (command.startsWith("CALIB_HUMID:")) {
    humidityOffset = command.substring(12).toFloat();
    Serial.print("Humidity offset set to: ");
    Serial.println(humidityOffset);
  }
  else if (command.startsWith("CALIB_LIGHT:")) {
    lightThreshold = command.substring(12).toInt();
    Serial.print("Light threshold set to: ");
    Serial.println(lightThreshold);
  }
  else if (command.startsWith("ALERT_TEMP:")) {
    int commaIndex = command.indexOf(',', 11);
    if (commaIndex > 0) {
      thresholds.tempMin = command.substring(11, commaIndex).toFloat();
      thresholds.tempMax = command.substring(commaIndex + 1).toFloat();
      Serial.print("Temperature alerts: ");
      Serial.print(thresholds.tempMin);
      Serial.print(" - ");
      Serial.println(thresholds.tempMax);
    }
  }
  else if (command.startsWith("ALERT_HUMID:")) {
    int commaIndex = command.indexOf(',', 12);
    if (commaIndex > 0) {
      thresholds.humidityMin = command.substring(12, commaIndex).toFloat();
      thresholds.humidityMax = command.substring(commaIndex + 1).toFloat();
      Serial.print("Humidity alerts: ");
      Serial.print(thresholds.humidityMin);
      Serial.print(" - ");
      Serial.println(thresholds.humidityMax);
    }
  }
  else if (command.startsWith("ALERT_LIGHT:")) {
    int commaIndex = command.indexOf(',', 12);
    if (commaIndex > 0) {
      thresholds.lightMin = command.substring(12, commaIndex).toInt();
      thresholds.lightMax = command.substring(commaIndex + 1).toInt();
      Serial.print("Light alerts: ");
      Serial.print(thresholds.lightMin);
      Serial.print(" - ");
      Serial.println(thresholds.lightMax);
    }
  }
}

void sendStatusToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  String url = String(serverUrl) + "/api/device/status-update";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(1024);
  doc["uptime"] = (millis() - deviceStartTime) / 1000;
  doc["totalReadings"] = totalReadings;
  doc["samplingInterval"] = samplingInterval / 1000;
  doc["ledState"] = ledState;
  doc["temperatureOffset"] = temperatureOffset;
  doc["humidityOffset"] = humidityOffset;
  doc["lightThreshold"] = lightThreshold;
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  http.POST(jsonString);
  http.end();
}

void checkAlerts() {
  float temperature = dht.readTemperature() + temperatureOffset;
  float humidity = dht.readHumidity() + humidityOffset;
  
  // Read LDR Module digital output
  int lightDetections = 0;
  for (int i = 0; i < 10; i++) {
    if (digitalRead(LDR_PIN) == HIGH) {
      lightDetections++;
    }
    delay(1);
  }
  int ldrValue = (lightDetections * 1023) / 10;
  
  bool alert = false;
  String alertMessage = "";
  
  if (temperature < thresholds.tempMin || temperature > thresholds.tempMax) {
    alert = true;
    alertMessage += "Temperature: " + String(temperature) + "°C (Range: " + 
                    String(thresholds.tempMin) + "-" + String(thresholds.tempMax) + "). ";
  }
  
  if (humidity < thresholds.humidityMin || humidity > thresholds.humidityMax) {
    alert = true;
    alertMessage += "Humidity: " + String(humidity) + "% (Range: " + 
                    String(thresholds.humidityMin) + "-" + String(thresholds.humidityMax) + "). ";
  }
  
  if (ldrValue < thresholds.lightMin || ldrValue > thresholds.lightMax) {
    alert = true;
    alertMessage += "Light: " + String(ldrValue) + " (Range: " + 
                    String(thresholds.lightMin) + "-" + String(thresholds.lightMax) + "). ";
  }
  
  if (alert) {
    Serial.print("ALERT: ");
    Serial.println(alertMessage);
    
    // Send alert to server
    if (wifiConnected) {
      sendAlertToServer(alertMessage);
    }
  }
}

void sendAlertToServer(String message) {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  String url = String(serverUrl) + "/api/device/alerts";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(512);
  doc["message"] = message;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  http.POST(jsonString);
  http.end();
}

