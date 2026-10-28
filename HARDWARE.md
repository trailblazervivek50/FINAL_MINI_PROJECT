# SMART MUNICIPAL DUSTBIN MONITORING PLATFORM
## HARDWARE SPECIFICATION & ELECTRICAL SCHEMATIC (ESP32-CAM GATEWAY)

---

## 1. Bill of Materials (Per Physical Receptacle Node)

| Component | Quantity | Specification / Role |
|---|---|---|
| **Arduino UNO R3** | 1 | Primary real-time local controller (measurement, LCD display, calculations) |
| **ESP32-CAM (AI-Thinker)** | 1 | Dedicated Wi-Fi Gateway Module (Camera disabled for low power & stability) |
| **HC-SR04** | 1 | Ultrasonic range sensor (2cm – 400cm range, 40kHz ultrasound) |
| **16x2 I2C LCD** | 1 | Character LCD with PCF8574 I2C backpack (Address `0x27`) |
| **Resistors (1kΩ)** | 2 | 1/4W 5% tolerance resistors forming logic level shifter |
| **FTDI / USB-TTL Programmer** | 1 | For initial firmware flashing of the ESP32-CAM module |
| **Breadboard & Jumper Wires** | 1 set | Prototyping interconnections |
| **Power Supply** | 1 set | 5V DC power source / dual USB feeds |

> [!IMPORTANT]
> The ESP8266 has been removed and is NOT part of this hardware architecture. The ESP32-CAM is the sole wireless communication gateway. The camera function is intentionally omitted to maximize network performance and reduce power draw.

---

## 2. Complete Wiring Pinout Table

### 2.1 Ultrasonic HC-SR04 &rarr; Arduino UNO
| HC-SR04 Pin | Target Connection | Signal Type | Notes |
|---|---|---|---|
| **VCC** | Arduino 5V | Power | Powers internal 40kHz transducer |
| **GND** | Arduino GND | Ground | Common system ground reference |
| **TRIG** | Arduino Pin D7 | Digital Output | 10µs pulse triggers ultrasound burst |
| **ECHO** | Arduino Pin D6 | Digital Input | Measures time-of-flight return pulse |

### 2.2 16x2 I2C Character LCD &rarr; Arduino UNO
| LCD Backpack Pin | Target Connection | Signal Type | Notes |
|---|---|---|---|
| **VCC** | Arduino 5V | Power | Backlight & driver power |
| **GND** | Arduino GND | Ground | Common ground reference |
| **SDA** | Arduino Pin A4 | I2C Data | Serial data line |
| **SCL** | Arduino Pin A5 | I2C Clock | Serial clock line |

### 2.3 Arduino UNO &rarr; ESP32-CAM Serial Level Shifting (CRITICAL)
| Signal Origin | Connection Path | Destination | Logic Voltage |
|---|---|---|---|
| **Arduino D11 (TX)** | 1kΩ Resistor R1 &rarr; Junction | ESP32-CAM U0RXD (GPIO3) | Stepped down: **2.5V safe logic** |
| **Junction** | 1kΩ Resistor R2 &rarr; GND | Circuit Ground | Completes 50% voltage divider |
| **Arduino D10 (RX)** | Direct Wire Connection | ESP32-CAM U0TXD (GPIO1) | 3.3V recognized as HIGH by Arduino |
| **Arduino GND** | Direct Wire Connection | ESP32-CAM GND | **MANDATORY COMMON GROUND** |
| **Power 5V** | Regulated 5V / 2A | ESP32-CAM 5V pin | Dedicated stable power |

---

## 3. Voltage Divider Level Shifter Schematic

The ESP32-CAM operates on **3.3V CMOS logic** and is **not 5V-tolerant** on its input pins. Driving 5V directly from the Arduino UNO D11 output pin into the ESP32-CAM U0RXD (GPIO3) pin will permanently damage the ESP32 chip.

We use a precision two-resistor voltage divider:

```
Arduino UNO Pin D11 (TX - 5V)
             │
           [1kΩ] Resistor R1
             │
             ├─── Junction (V_out = 2.5V) ───────> ESP32-CAM U0RXD (GPIO3)
             │
           [1kΩ] Resistor R2
             │
Arduino GND ─┴───────────────────────────────────> ESP32-CAM GND
```

### Voltage Calculation:
$$V_{\text{out}} = V_{\text{in}} \times \frac{R_2}{R_1 + R_2} = 5.0\text{V} \times \frac{1000}{1000 + 1000} = 2.50\text{V}$$

$2.50\text{V}$ is safely within the ESP32 CMOS logic-high range ($0.75 \times 3.3\text{V} = 2.475\text{V}$) and safely below its absolute maximum rating ($3.6\text{V}$).

---

## 4. ESP32-CAM Flashing & Deployment Mode

The ESP32-CAM does not feature an onboard USB-to-serial chip. An external FTDI programmer or Arduino Uno in bypass mode is used for flashing:

### 4.1 Flashing Wiring:
- **FTDI VCC (5V)** &rarr; ESP32-CAM 5V
- **FTDI GND** &rarr; ESP32-CAM GND
- **FTDI TX** &rarr; ESP32-CAM U0RXD (GPIO 3)
- **FTDI RX** &rarr; ESP32-CAM U0TXD (GPIO 1)
- **ESP32-CAM GPIO 0** &rarr; **GND** (Required to enter bootloader flashing mode)

### 4.2 Flash & Run Steps:
1. Connect GPIO 0 to GND.
2. Press the onboard RST button.
3. In Arduino IDE, select Board: **"AI Thinker ESP32-CAM"**.
4. Upload [`hardware/esp32cam_telemetry_client/esp32cam_telemetry_client.ino`](file:///d:/project%20IOT/hardware/esp32cam_telemetry_client/esp32cam_telemetry_client.ino).
5. Disconnect GPIO 0 from GND and press RST to enter normal run mode.
6. Connect U0RXD to the Arduino voltage divider junction and U0TXD to Arduino D10.

---

## 5. Firmware Sketches

1. **Arduino UNO Local Controller**:
   - Sketch: [`hardware/arduino_uno_dustbin/arduino_uno_dustbin.ino`](file:///d:/project%20IOT/hardware/arduino_uno_dustbin/arduino_uno_dustbin.ino)
   - Baud Rate: 9600 baud
   - Output Protocol: `BIN_001,distance_cm,fill_percent,status` (and key-value fallback)

2. **ESP32-CAM Wi-Fi Gateway**:
   - Sketch: [`hardware/esp32cam_telemetry_client/esp32cam_telemetry_client.ino`](file:///d:/project%20IOT/hardware/esp32cam_telemetry_client/esp32cam_telemetry_client.ino)
   - Ingests serial packets from Arduino UNO, parses telemetry, and sends HTTP POST to:
     `POST http://<SERVER_IP>:5000/api/v1/bins/telemetry`
     with `X-API-Key: REAL_DEVICE_KEY_001`
