/*
 * ============================================================================
 * SMART MUNICIPAL DUSTBIN MONITORING PLATFORM
 * ARDUINO UNO LOCAL CONTROLLER SKETCH
 * ============================================================================
 *
 * Device Identity: BIN_001 (configurable for BIN_001 .. BIN_005)
 * Primary Controller: Arduino UNO
 * Sensor: Ultrasonic HC-SR04
 * Display: 16x2 I2C LCD (PCF8574 address 0x27)
 * Comm Bridge: SoftwareSerial to ESP32-CAM via 1kΩ/1kΩ Voltage Divider
 *
 * HARDWARE WIRING (MANDATORY SPECIFICATION):
 * ----------------------------------------------------------------------------
 * 1. Ultrasonic HC-SR04:
 *    - VCC  -> Arduino 5V
 *    - GND  -> Arduino GND
 *    - TRIG -> Arduino D7
 *    - ECHO -> Arduino D6
 *
 * 2. 16x2 I2C LCD:
 *    - VCC  -> Arduino 5V
 *    - GND  -> Arduino GND
 *    - SDA  -> Arduino A4
 *    - SCL  -> Arduino A5
 *
 * 3. Arduino UNO -> ESP32-CAM Communication:
 *    - Arduino D11 (TX) -> 1kΩ resistor -> junction -> ESP32-CAM U0RXD (GPIO3)
 *    - junction         -> 1kΩ resistor -> GND
 *      (50% Voltage divider steps 5V down to 2.5V safe logic level for 3.3V ESP32)
 *    - Arduino D10 (RX) <- ESP32-CAM U0TXD (GPIO1) (Direct connection, 3.3V is logic HIGH)
 *    - Arduino GND      <-> ESP32-CAM GND (COMMON GROUND IS CRITICAL!)
 *    - ESP32-CAM Power: 5V power supply to 5V pin.
 *      DO NOT connect 5V directly to ESP32-CAM 3.3V pin.
 *
 * SENSOR SPECIFICATION:
 * ----------------------------------------------------------------------------
 * - EMPTY_DISTANCE = 30.0 cm
 * - FULL_DISTANCE  = 5.0 cm
 * - Formula: fill_percent = ((EMPTY_DISTANCE - distance_cm) / (EMPTY_DISTANCE - FULL_DISTANCE)) * 100
 * - Clamped: 0% to 100%
 * - Status:
 *     0  - 49% : LOW
 *     50 - 79% : MEDIUM
 *     80 - 89% : HIGH
 *     90 - 100%: FULL
 * ============================================================================
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <SoftwareSerial.h>

// --- Device Configuration ---
const char* BIN_ID = "BIN_001"; // Change to BIN_002..BIN_005 per device deployment

// --- Pin Assignments ---
const int PIN_TRIG = 7;
const int PIN_ECHO = 6;
const int PIN_ESP_RX = 10; // Arduino RX (receives from ESP8266 TX)
const int PIN_ESP_TX = 11; // Arduino TX (sends to ESP8266 RX via voltage divider)

// --- Calibration Constants ---
const float EMPTY_DISTANCE = 30.0; // cm
const float FULL_DISTANCE  = 5.0;  // cm

// --- Timing ---
const unsigned long TELEMETRY_INTERVAL_MS = 3000; // Sample & send every 3 seconds
unsigned long lastTelemetryTime = 0;

// --- Peripherals ---
LiquidCrystal_I2C lcd(0x27, 16, 2);
SoftwareSerial espSerial(PIN_ESP_RX, PIN_ESP_TX); // RX, TX

void setup() {
  Serial.begin(9600);       // Serial monitor debugging
  espSerial.begin(9600);    // Serial link to ESP8266

  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);

  // Initialize 16x2 I2C LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("MUNICIPAL DUSTBIN");
  lcd.setCursor(0, 1);
  lcd.print("ID: ");
  lcd.print(BIN_ID);
  delay(1500);

  Serial.println(F("[SYSTEM] Arduino UNO Controller Initialized"));
  Serial.print(F("[SYSTEM] Bin Identity: "));
  Serial.println(BIN_ID);
}

float measureDistanceCm() {
  // Clear trigger pin
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);

  // Send 10 microsecond pulse
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // Read echo duration (microseconds) with 35ms timeout (~600cm max range)
  long duration = pulseIn(PIN_ECHO, HIGH, 35000);
  if (duration == 0) {
    // Timeout: return maximum distance
    return EMPTY_DISTANCE;
  }

  // Speed of sound: 343 m/s = 0.0343 cm/microsecond. Divide by 2 for round-trip.
  float distance = (duration * 0.0343) / 2.0;

  // Bound within reasonable physical limits
  if (distance < 2.0) distance = 2.0;
  if (distance > 100.0) distance = EMPTY_DISTANCE;

  return distance;
}

int calculateFillPercent(float distanceCm) {
  float percent = ((EMPTY_DISTANCE - distanceCm) / (EMPTY_DISTANCE - FULL_DISTANCE)) * 100.0;
  
  // Strict clamping to 0% - 100%
  if (percent < 0.0) percent = 0.0;
  if (percent > 100.0) percent = 100.0;

  return (int)round(percent);
}

const char* determineStatus(int fillPercent) {
  if (fillPercent >= 90) return "FULL";
  if (fillPercent >= 80) return "HIGH";
  if (fillPercent >= 50) return "MEDIUM";
  return "LOW";
}

void updateLCD(float distanceCm, int fillPercent, const char* status) {
  // Line 1: BIN_001 [ 93%]
  lcd.setCursor(0, 0);
  lcd.print(BIN_ID);
  lcd.print(" [");
  if (fillPercent < 10) lcd.print(" ");
  if (fillPercent < 100) lcd.print(" ");
  lcd.print(fillPercent);
  lcd.print("%]  ");

  // Line 2: D: 6.8cm  FULL
  lcd.setCursor(0, 1);
  lcd.print("D:");
  lcd.print(distanceCm, 1);
  lcd.print("cm ");
  lcd.print(status);
  lcd.print("     ");
}

void transmitToESP(float distanceCm, int fillPercent, const char* status) {
  // Transmit structured packet line over SoftwareSerial to ESP8266:
  // Format: BIN_ID,DISTANCE_CM,FILL_PERCENT,STATUS
  // Example: BIN_001,6.8,93,FULL
  espSerial.print(BIN_ID);
  espSerial.print(",");
  espSerial.print(distanceCm, 1);
  espSerial.print(",");
  espSerial.print(fillPercent);
  espSerial.print(",");
  espSerial.println(status);

  // Also print to USB Serial for debugging
  Serial.print(F("[TELEMETRY] Sent to ESP32-CAM -> "));
  Serial.print(BIN_ID);
  Serial.print(F(" | Dist: "));
  Serial.print(distanceCm, 1);
  Serial.print(F("cm | Fill: "));
  Serial.print(fillPercent);
  Serial.print(F("% | Status: "));
  Serial.println(status);
}

void loop() {
  unsigned long now = millis();

  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = now;

    // Take sensor measurement
    float distanceCm = measureDistanceCm();
    int fillPercent = calculateFillPercent(distanceCm);
    const char* status = determineStatus(fillPercent);

    // Display on 16x2 I2C LCD
    updateLCD(distanceCm, fillPercent, status);

    // Transmit telemetry to ESP8266
    transmitToESP(distanceCm, fillPercent, status);
  }

  // Forward any incoming messages from ESP8266 to USB Serial
  if (espSerial.available()) {
    char c = espSerial.read();
    Serial.write(c);
  }
}
