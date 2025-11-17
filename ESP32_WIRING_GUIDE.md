# ESP32 Wiring Guide - Matching Your Current Arduino Setup

## Your Current Arduino Setup

Based on your hardware configuration:

- **DHT22**: DATA → D2 (with 10kΩ pull-up to 5V)
- **LDR Module**: DO (Digital Output) → D3
- **Power**: 5V and GND from breadboard rails

## ESP32 Equivalent Setup

### ⚠️ Important Voltage Note

**ESP32 uses 3.3V instead of 5V!**

However, your components will work:

- **DHT22**: Works with both 3.3V and 5V ✅
- **LDR Module**: Most modules work with 3.3V ✅
- **10kΩ Pull-up**: Works the same way ✅

### Pin Mapping

| Arduino Pin | ESP32 GPIO | Component     |
| ----------- | ---------- | ------------- |
| D2          | GPIO 2     | DHT22 DATA    |
| D3          | GPIO 3     | LDR Module DO |
| 5V          | 3.3V       | Power Rail    |
| GND         | GND        | Ground Rail   |

## Wiring Instructions

### Step 1: Power Setup

```
ESP32 3.3V → Breadboard + rail (Power)
ESP32 GND  → Breadboard – rail (Ground)
```

**Note**: Change from Arduino's 5V to ESP32's 3.3V!

### Step 2: DHT22 Sensor (Same Connections)

```
DHT22 VCC  → Breadboard + rail (3.3V instead of 5V)
DHT22 GND  → Breadboard – rail (GND)
DHT22 DATA → ESP32 GPIO 2 (same as Arduino D2)
10kΩ Resistor between DATA and 3.3V (+ rail)
```

### Step 3: LDR Module (Same Connections)

```
LDR Module VCC → Breadboard + rail (3.3V instead of 5V)
LDR Module GND  → Breadboard – rail (GND)
LDR Module DO  → ESP32 GPIO 3 (same as Arduino D3)
```

## Complete ESP32 Wiring Diagram

```
                    ┌─────────────────┐
                    │    ESP32 DEV    │
                    │                 │
     ┌──────────────┤ 3.3V            │
     │              │                 │
     │ DHT22        │ GPIO 2 ◄────────┼─── DATA
     │ ┌─────┐      │                 │
     │ │ VCC │──────┼─── 3.3V         │
     │ │DATA │      │                 │
     │ │ GND │──────┼─── GND           │
     │ └─────┘      │                 │
     │              │                 │
     │ 10kΩ         │                 │
     │ ┌───┐        │                 │
     │ │   │────────┼─── GPIO 2        │
     │ │   │        │                 │
     │ └───┘        │                 │
     │   │          │                 │
     │   └──────────┼─── 3.3V         │
     │              │                 │
     │ LDR Module   │ GPIO 3 ◄────────┼─── DO (Digital Output)
     │ ┌─────┐      │                 │
     │ │ VCC │──────┼─── 3.3V         │
     │ │ DO  │      │                 │
     │ │ GND │──────┼─── GND           │
     │ └─────┘      │                 │
                    └─────────────────┘
```

## Key Differences from Arduino

### 1. Voltage Change

- **Arduino**: 5V power rail
- **ESP32**: 3.3V power rail
- **Action**: Move all VCC connections from 5V to 3.3V

### 2. Pin Numbers

- **Same GPIO numbers**: GPIO 2 and GPIO 3 work the same way
- **No changes needed** to your breadboard connections (just move power)

### 3. LDR Module Reading

- Your LDR module uses **digital output** (HIGH/LOW)
- ESP32 code reads this as digital input
- Converts to 0-1023 scale for compatibility

## Step-by-Step Migration

### Option 1: Keep Same Breadboard (Recommended)

1. **Disconnect Arduino** from breadboard
2. **Connect ESP32** to breadboard
3. **Move power connection**:
   - Remove: Arduino 5V → Breadboard +
   - Add: ESP32 3.3V → Breadboard +
4. **Keep all other connections the same**:
   - DHT22 DATA → GPIO 2 (same position)
   - LDR Module DO → GPIO 3 (same position)
   - All GND connections stay the same

### Option 2: New Breadboard Setup

1. Set up new breadboard with ESP32
2. Follow the same wiring pattern:
   - DHT22: VCC→3.3V, DATA→GPIO2, GND→GND
   - 10kΩ pull-up: Between GPIO2 and 3.3V
   - LDR Module: VCC→3.3V, DO→GPIO3, GND→GND

## Code Configuration

The ESP32 code (`esp32-remote.ino`) has been updated to match your setup:

```cpp
#define DHTPIN 2          // DHT22 DATA (GPIO 2)
#define LDR_PIN 3         // LDR Module DO (GPIO 3)
```

The code automatically:

- Reads DHT22 from GPIO 2
- Reads LDR Module digital output from GPIO 3
- Converts LDR digital readings to 0-1023 scale
- Sends data to your backend server

## Testing

1. **Upload code** to ESP32
2. **Open Serial Monitor** (115200 baud)
3. **Expected output**:

   ```
   WiFi connected!
   Temperature: 25.3 °C, Humidity: 60.5 %, LDR Output: 512
   ```

4. **Test LDR Module**:
   - Cover sensor → LDR Output should decrease
   - Shine light → LDR Output should increase

## Troubleshooting

### DHT22 Not Working

- ✅ Check if using 3.3V (not 5V)
- ✅ Verify 10kΩ pull-up resistor is connected
- ✅ Check GPIO 2 connection

### LDR Module Not Responding

- ✅ Verify module is powered (3.3V)
- ✅ Check GPIO 3 connection
- ✅ Test module with multimeter (DO should toggle HIGH/LOW)

### ESP32 Won't Connect to WiFi

- ✅ Check WiFi credentials in code
- ✅ Ensure 2.4GHz network (not 5GHz)
- ✅ Check signal strength

## Advantages of ESP32 Setup

✅ **Same hardware** - No need to change sensors or wiring  
✅ **Remote access** - No USB connection needed  
✅ **Same functionality** - All features work identically  
✅ **Better reliability** - No USB connection issues

## Summary

**What Changes:**

- Power: 5V → 3.3V
- Board: Arduino → ESP32

**What Stays the Same:**

- DHT22 on GPIO 2 (was D2)
- LDR Module on GPIO 3 (was D3)
- All sensor connections
- Pull-up resistor configuration
- Breadboard layout

Your existing breadboard setup can be reused with minimal changes - just swap the power connection from 5V to 3.3V!
