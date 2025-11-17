# EnviroMoon Hardware Setup Guide

## Components Required

### Essential Components

1. **Arduino Uno/Nano** OR **ESP32 Development Board**
2. **DHT22 Temperature & Humidity Sensor** (or DHT11)
3. **LDR (Light Dependent Resistor)** - Photoresistor
4. **10kΩ Resistor** (for LDR voltage divider)
5. **220Ω Resistor** (for LED, optional)
6. **LED** (optional, for status indication)
7. **Breadboard** (for prototyping)
8. **Jumper Wires** (Male-to-Male)
9. **USB Cable** (for Arduino/ESP32)

### Optional Components

- **Power Supply** (9V adapter or battery pack)
- **Enclosure/Case** (for final installation)
- **Solderable PCB** (for permanent installation)

---

## Pin Connections

### For Arduino Uno/Nano

```
┌─────────────────────────────────────────┐
│           ARDUINO UNO/NANO              │
│                                          │
│  D2  ────► DHT22 DATA                    │
│  A0  ────► LDR (via voltage divider)    │
│  D13 ────► LED (via 220Ω resistor)       │
│  5V  ────► DHT22 VCC                     │
│  GND ────► DHT22 GND, LDR GND, LED GND   │
└─────────────────────────────────────────┘
```

### For ESP32

```
┌─────────────────────────────────────────┐
│              ESP32 DEV BOARD             │
│                                          │
│  GPIO 2 ────► DHT22 DATA                 │
│  GPIO 0 (A0) ────► LDR (via divider)    │
│  GPIO 13 ────► LED (via 220Ω resistor)  │
│  3.3V ────► DHT22 VCC                    │
│  GND ────► DHT22 GND, LDR GND, LED GND   │
└─────────────────────────────────────────┘
```

---

## Detailed Wiring Instructions

### Step 1: DHT22 Temperature & Humidity Sensor

**DHT22 Pinout:**

- **Pin 1 (Left)**: VCC (Power) - Red wire
- **Pin 2**: DATA - Yellow/White wire
- **Pin 3**: Not used
- **Pin 4 (Right)**: GND (Ground) - Black wire

**Wiring:**

```
DHT22 Pin 1 (VCC)  → Arduino 5V (or ESP32 3.3V)
DHT22 Pin 2 (DATA) → Arduino D2 (or ESP32 GPIO 2)
DHT22 Pin 4 (GND)  → Arduino GND
```

**Note:** DHT22 can work with 3.3V or 5V. ESP32 uses 3.3V, Arduino uses 5V.

---

### Step 2: LDR (Light Dependent Resistor)

**LDR Voltage Divider Circuit:**

```
    3.3V/5V
      │
      │
    ┌─┴─┐
    │   │ LDR (Photoresistor)
    └─┬─┘
      │
      ├──────► A0 (Analog Input)
      │
    ┌─┴─┐
    │   │ 10kΩ Resistor
    └─┬─┘
      │
     GND
```

**Wiring:**

1. Connect one leg of LDR to **5V (Arduino)** or **3.3V (ESP32)**
2. Connect the other leg of LDR to **A0** (analog pin)
3. Connect **10kΩ resistor** between **A0** and **GND**

**How it works:**

- When light increases, LDR resistance decreases → higher voltage at A0
- When light decreases, LDR resistance increases → lower voltage at A0
- Arduino reads 0-1023 (0V to 5V) or 0-4095 (ESP32, 0V to 3.3V)

---

### Step 3: LED (Optional - for Status Indication)

**Wiring:**

```
Arduino D13 (or ESP32 GPIO 13)
      │
      │
    ┌─┴─┐
    │   │ 220Ω Resistor
    └─┬─┘
      │
    ┌─┴─┐
    │ + │ LED (Anode = longer leg)
    │ - │ LED (Cathode = shorter leg)
    └─┬─┘
      │
     GND
```

**LED Polarity:**

- **Anode (longer leg, +)**: Connect to resistor
- **Cathode (shorter leg, -)**: Connect to GND

---

## Complete Wiring Diagram

### Arduino Setup

```
                    ┌─────────────┐
                    │   ARDUINO   │
                    │    UNO      │
                    │             │
     DHT22          │             │
    ┌─────┐         │             │
    │ VCC │────────►│ 5V          │
    │ DATA│────────►│ D2          │
    │ GND │────────►│ GND         │
    └─────┘         │             │
                    │             │
     LDR            │             │
    ┌───┐           │             │
    │   │──────────►│ 5V          │
    │   │           │             │
    └───┘           │             │
      │             │             │
      └─────────────►│ A0          │
                    │             │
    10kΩ            │             │
    ┌───┐           │             │
    │   │──────────►│ A0          │
    │   │           │             │
    └───┘           │             │
      │             │             │
      └─────────────►│ GND         │
                    │             │
     LED            │             │
    ┌───┐           │             │
    │ + │──────────►│ D13         │
    │ - │           │             │
    └───┘           │             │
      │             │             │
      └─────────────►│ GND         │
                    │             │
                    └─────────────┘
```

### ESP32 Setup

```
                    ┌─────────────┐
                    │    ESP32    │
                    │   DEV BOARD │
                    │             │
     DHT22          │             │
    ┌─────┐         │             │
    │ VCC │────────►│ 3.3V        │
    │ DATA│────────►│ GPIO 2      │
    │ GND │────────►│ GND         │
    └─────┘         │             │
                    │             │
     LDR            │             │
    ┌───┐           │             │
    │   │──────────►│ 3.3V        │
    │   │           │             │
    └───┘           │             │
      │             │             │
      └─────────────►│ GPIO 0 (A0) │
                    │             │
    10kΩ            │             │
    ┌───┐           │             │
    │   │──────────►│ GPIO 0 (A0) │
    │   │           │             │
    └───┐           │             │
      │             │             │
      └─────────────►│ GND         │
                    │             │
     LED            │             │
    ┌───┐           │             │
    │ + │──────────►│ GPIO 13     │
    │ - │           │             │
    └───┘           │             │
      │             │             │
      └─────────────►│ GND         │
                    │             │
                    └─────────────┘
```

---

## Step-by-Step Assembly

### Step 1: Prepare the Breadboard

1. Place Arduino/ESP32 on one side of breadboard
2. Leave space for components on the other side

### Step 2: Connect Power Rails

1. Connect **5V (Arduino)** or **3.3V (ESP32)** to breadboard power rail
2. Connect **GND** to breadboard ground rail

### Step 3: Install DHT22

1. Place DHT22 on breadboard
2. Connect VCC to power rail
3. Connect GND to ground rail
4. Connect DATA to D2 (Arduino) or GPIO 2 (ESP32)

### Step 4: Install LDR Circuit

1. Place LDR on breadboard
2. Connect one leg to power rail (5V/3.3V)
3. Connect other leg to A0 (Arduino) or GPIO 0 (ESP32)
4. Place 10kΩ resistor between A0 and ground rail

### Step 5: Install LED (Optional)

1. Place LED on breadboard (observe polarity)
2. Connect anode (long leg) to D13 (Arduino) or GPIO 13 (ESP32) via 220Ω resistor
3. Connect cathode (short leg) to ground rail

### Step 6: Double-Check Connections

- ✅ All VCC connections to power
- ✅ All GND connections to ground
- ✅ DHT22 DATA to correct digital pin
- ✅ LDR voltage divider properly connected
- ✅ LED polarity correct (if used)

---

## Testing the Setup

### 1. Upload Code

1. Connect Arduino/ESP32 to computer via USB
2. Open Arduino IDE
3. Select correct board and port
4. Upload the code (`arduino-example.ino` or `esp32-remote.ino`)

### 2. Open Serial Monitor

- **Arduino**: 9600 baud
- **ESP32**: 115200 baud

### 3. Expected Output

You should see:

```
EnviroMoon Device Ready
Temperature: 25.3 °C, Humidity: 60.5 %, LDR Output: 512
```

### 4. Test Each Sensor

**DHT22 Test:**

- Breathe on sensor → humidity should increase
- Hold sensor → temperature should increase

**LDR Test:**

- Cover LDR → value should decrease
- Shine light on LDR → value should increase

**LED Test:**

- Send `LED:ON` command → LED should turn on
- Send `LED:OFF` command → LED should turn off

---

## Troubleshooting

### DHT22 Not Reading

- ✅ Check DATA pin connection (D2 for Arduino, GPIO 2 for ESP32)
- ✅ Verify VCC and GND connections
- ✅ Check if DHT library is installed
- ✅ Try different DHT22 (may be faulty)
- ✅ Add 4.7kΩ pull-up resistor between DATA and VCC (some DHT22 modules have this built-in)

### LDR Reading Incorrect

- ✅ Check voltage divider circuit
- ✅ Verify 10kΩ resistor value
- ✅ Check A0 connection
- ✅ Test with multimeter: voltage should change when covering/uncovering LDR

### LED Not Working

- ✅ Check LED polarity (long leg = anode)
- ✅ Verify 220Ω resistor is connected
- ✅ Check D13/GPIO 13 connection
- ✅ Test LED directly with battery (should light up)

### ESP32 WiFi Issues

- ✅ Check WiFi credentials in code
- ✅ Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- ✅ Check signal strength
- ✅ Verify server IP address is correct

### No Serial Output

- ✅ Check USB cable (data cable, not just power)
- ✅ Verify correct COM port selected
- ✅ Check baud rate matches code (9600 for Arduino, 115200 for ESP32)
- ✅ Try different USB port

---

## Component Specifications

### DHT22

- **Operating Voltage**: 3.3V - 5V
- **Temperature Range**: -40°C to 80°C
- **Humidity Range**: 0% to 100% RH
- **Accuracy**: ±0.5°C, ±1% RH
- **Sampling Rate**: 0.5 Hz (once every 2 seconds)

### LDR (Photoresistor)

- **Resistance Range**: 1kΩ (bright) to 10MΩ (dark)
- **Response Time**: ~100ms
- **Spectral Peak**: ~550nm (green light)

### Resistors

- **10kΩ**: For LDR voltage divider (brown-black-orange-gold)
- **220Ω**: For LED current limiting (red-red-brown-gold)

---

## Power Considerations

### Arduino Uno

- **USB Power**: 5V, 500mA (sufficient for all sensors)
- **External Power**: 7-12V DC adapter or 9V battery
- **Current Draw**: ~50-100mA (with all sensors)

### ESP32

- **USB Power**: 5V, 500mA (sufficient)
- **External Power**: 5V via USB or 3.3V direct
- **Current Draw**: ~80-240mA (WiFi active)

**Note**: For permanent installation, consider using a wall adapter or battery pack.

---

## Permanent Installation Tips

1. **Use Perfboard or PCB**: Solder components for reliability
2. **Add Enclosure**: Protect from dust and moisture
3. **Strain Relief**: Secure wires to prevent breakage
4. **Label Connections**: Mark wires for easy troubleshooting
5. **Add Fuses**: Protect against short circuits
6. **Weatherproofing**: Use waterproof enclosure for outdoor use

---

## Safety Notes

⚠️ **Important:**

- Always disconnect power before making wiring changes
- Double-check polarity for LED and power connections
- Don't exceed voltage ratings (ESP32 uses 3.3V, Arduino uses 5V)
- Use appropriate resistor values to prevent component damage
- Keep breadboard circuits away from water and moisture

---

## Next Steps

After hardware setup:

1. ✅ Test all sensors individually
2. ✅ Upload code and verify serial output
3. ✅ Connect to backend server
4. ✅ Test from mobile app
5. ✅ Calibrate sensors if needed

For code setup, see:

- `arduino-example.ino` - For Arduino with USB connection
- `esp32-remote.ino` - For ESP32 with WiFi connection
- `ESP32_SETUP.md` - For ESP32 software configuration
