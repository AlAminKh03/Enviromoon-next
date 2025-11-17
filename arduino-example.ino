/*
 * EnviroMoon Arduino Code Example
 * This code demonstrates how to handle commands from the backend
 * and control the device remotely
 */

#include <DHT.h>

// Pin definitions
#define DHTPIN 2          // DHT sensor pin
#define DHTTYPE DHT22     // DHT22 or DHT11
#define LDR_PIN A0        // Light sensor pin
#define LED_PIN 13        // Built-in LED (or external LED)

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

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  dht.begin();
  deviceStartTime = millis();
  
  // Wait for serial connection
  while (!Serial) {
    delay(10);
  }
  
  Serial.println("EnviroMoon Device Ready");
  Serial.println("Commands: READ, STATUS, INTERVAL:xxx, LED:ON, LED:OFF, RESET, RESTART");
  Serial.println("CALIB_TEMP:x, CALIB_HUMID:x, CALIB_LIGHT:x");
  Serial.println("ALERT_TEMP:min,max, ALERT_HUMID:min,max, ALERT_LIGHT:min,max");
}

void loop() {
  // Check for incoming commands
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    handleCommand(command);
  }
  
  // Automatic reading based on interval
  if (millis() - lastReading >= samplingInterval) {
    readSensors();
    checkAlerts(); // Check alerts after each reading
    lastReading = millis();
  }
}

void readSensors() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int ldrValue = analogRead(LDR_PIN);
  
  // Apply calibration offsets
  temperature += temperatureOffset;
  humidity += humidityOffset;
  
  // Check for sensor errors
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Error: Failed to read from DHT sensor!");
    return;
  }
  
  // Format and send data
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print(" °C, Humidity: ");
  Serial.print(humidity);
  Serial.print(" %, LDR Output: ");
  Serial.println(ldrValue);
  
  totalReadings++;
}

void handleCommand(String command) {
  if (command == "READ") {
    readSensors();
  }
  else if (command == "STATUS") {
    sendStatus();
  }
  else if (command.startsWith("INTERVAL:")) {
    int interval = command.substring(9).toInt();
    if (interval > 0) {
      samplingInterval = interval;
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
    delay(100);
    // Reset all settings to defaults
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
    // Software restart - works on AVR-based boards (Uno, Nano, etc.)
    // For ESP32/ESP8266, use ESP.restart() instead
    #if defined(ESP32) || defined(ESP8266)
      ESP.restart();
    #else
      asm volatile ("  jmp 0");
    #endif
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
  else {
    Serial.print("Unknown command: ");
    Serial.println(command);
  }
}

void sendStatus() {
  Serial.println("=== Device Status ===");
  Serial.print("Uptime: ");
  Serial.print((millis() - deviceStartTime) / 1000);
  Serial.println(" seconds");
  Serial.print("Total Readings: ");
  Serial.println(totalReadings);
  Serial.print("Sampling Interval: ");
  Serial.print(samplingInterval / 1000);
  Serial.println(" seconds");
  Serial.print("LED State: ");
  Serial.println(ledState ? "ON" : "OFF");
  Serial.print("Temperature Offset: ");
  Serial.println(temperatureOffset);
  Serial.print("Humidity Offset: ");
  Serial.println(humidityOffset);
  Serial.print("Light Threshold: ");
  Serial.println(lightThreshold);
  Serial.println("====================");
}

void checkAlerts() {
  // Use the last read values instead of reading again
  // This function should be called right after readSensors()
  // For now, we'll read again but you can optimize by passing values as parameters
  float temperature = dht.readTemperature() + temperatureOffset;
  float humidity = dht.readHumidity() + humidityOffset;
  int ldrValue = analogRead(LDR_PIN);
  
  // Check temperature alerts
  if (temperature < thresholds.tempMin || temperature > thresholds.tempMax) {
    Serial.print("ALERT: Temperature out of range! Value: ");
    Serial.print(temperature);
    Serial.print(" (Range: ");
    Serial.print(thresholds.tempMin);
    Serial.print(" - ");
    Serial.print(thresholds.tempMax);
    Serial.println(")");
  }
  
  // Check humidity alerts
  if (humidity < thresholds.humidityMin || humidity > thresholds.humidityMax) {
    Serial.print("ALERT: Humidity out of range! Value: ");
    Serial.print(humidity);
    Serial.print(" (Range: ");
    Serial.print(thresholds.humidityMin);
    Serial.print(" - ");
    Serial.print(thresholds.humidityMax);
    Serial.println(")");
  }
  
  // Check light alerts
  if (ldrValue < thresholds.lightMin || ldrValue > thresholds.lightMax) {
    Serial.print("ALERT: Light out of range! Value: ");
    Serial.print(ldrValue);
    Serial.print(" (Range: ");
    Serial.print(thresholds.lightMin);
    Serial.print(" - ");
    Serial.print(thresholds.lightMax);
    Serial.println(")");
  }
}

