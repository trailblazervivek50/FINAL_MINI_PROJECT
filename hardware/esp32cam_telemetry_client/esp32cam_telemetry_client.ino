/*
 * ============================================================================
 * SMART MUNICIPAL DUSTBIN MONITORING PLATFORM
 * ESP32-CAM WI-FI TELEMETRY CLIENT GATEWAY SKETCH
 * ============================================================================
 *
 * Microcontroller: ESP32-CAM (AI-Thinker module)
 * Role: Dedicated Wi-Fi Communication Gateway (Camera disabled for low power & stability)
 * Hardware Target: Receives serial telemetry from Arduino UNO, forwards to Backend API.
 *
 * HARDWARE CONNECTIONS & LEVEL SHIFTING (MANDATORY):
 * ----------------------------------------------------------------------------
 * 1. Power Supply:
 *    - ESP32-CAM 5V pin  <- Dedicated 5V / 2A Power Source (or USB FTDI programmer 5V)
 *    - ESP32-CAM GND pin <- Power Source GND
 *    - Arduino UNO GND   <-> ESP32-CAM GND (COMMON GROUND IS STRICTLY REQUIRED)
 *
 * 2. Serial Interface (Arduino UNO -> ESP32-CAM):
 *    - Arduino UNO D11 (TX) -> 1kΩ Resistor -> Junction -> ESP32-CAM U0RXD (GPIO 3)
 *    - Junction             -> 1kΩ Resistor -> GND
 *      (50% Voltage divider steps 5V down to 2.5V safe logic level for 3.3V ESP32)
 *    - Arduino UNO D10 (RX) <- ESP32-CAM U0TXD (GPIO 1) (Direct: 3.3V recognized as HIGH by 5V Arduino)
 *
 *    Note: When flashing the ESP32-CAM via FTDI:
 *    - Connect GPIO 0 to GND, press reset to enter flash mode.
 *    - Disconnect GPIO 0 from GND after upload.
 *
 * DATA FLOW:
 * ----------------------------------------------------------------------------
 * HC-SR04 -> Arduino UNO -> LCD + Serial -> ESP32-CAM -> Wi-Fi -> Backend API -> PostgreSQL -> Dashboard
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============================================================================
// NETWORK & BACKEND CONFIGURATION
// ============================================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Backend API URL: Replace with your laptop/server IP address on LAN
// Your laptop's current Wi-Fi LAN IP is 10.109.195.25
const char* BACKEND_API_URL = "http://10.109.195.25:5000/api/v1/bins/telemetry";

// Device API Keys (Matches server device_credentials in DB)
// BIN_001 -> KEY_BIN_001_SECRET_9871 (also accepts REAL_DEVICE_KEY_001)
// BIN_002 -> KEY_BIN_002_SECRET_5422
// BIN_003 -> KEY_BIN_003_SECRET_3319
// BIN_004 -> KEY_BIN_004_SECRET_7741
// BIN_005 -> KEY_BIN_005_SECRET_1120
const char* DEFAULT_API_KEY = "KEY_BIN_001_SECRET_9871";

// Status LED (Onboard Red LED on ESP32-CAM is GPIO 33, active LOW)
const int LED_STATUS = 33;

// Serial Buffer
String serialBuffer = "";
unsigned long lastPacketSent = 0;
const unsigned long MIN_SEND_INTERVAL_MS = 2000; // Rate limit 2 seconds

void setup() {
  // ESP32-CAM Serial0 communicates with Arduino UNO at 9600 baud
  Serial.begin(9600);
  delay(500);

  pinMode(LED_STATUS, OUTPUT);
  digitalWrite(LED_STATUS, HIGH); // Off

  Serial.println();
  Serial.println(F("=================================================="));
  Serial.println(F(" ESP32-CAM WI-FI TELEMETRY GATEWAY - MUNICIPAL IOT"));
  Serial.println(F(" Camera Functionality: DISABLED"));
  Serial.println(F(" Mode: Wi-Fi Serial Bridge Gateway"));
  Serial.println(F("=================================================="));

  connectWiFi();
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print(F("[WIFI] Connecting to "));
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(F("."));
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println(F("[WIFI] Connected successfully!"));
    Serial.print(F("[WIFI] Gateway IP: "));
    Serial.println(WiFi.localIP());
    // Blink LED to indicate connection success
    digitalWrite(LED_STATUS, LOW);
    delay(200);
    digitalWrite(LED_STATUS, HIGH);
  } else {
    Serial.println();
    Serial.println(F("[WIFI] Connection failed. Will retry on packet receipt."));
  }
}

/**
 * Maps bin ID to its unique authenticating device key
 */
const char* getApiKeyForBin(const String& binId) {
  if (binId == "BIN_001") return "KEY_BIN_001_SECRET_9871";
  if (binId == "BIN_002") return "KEY_BIN_002_SECRET_5422";
  if (binId == "BIN_003") return "KEY_BIN_003_SECRET_3319";
  if (binId == "BIN_004") return "KEY_BIN_004_SECRET_7741";
  if (binId == "BIN_005") return "KEY_BIN_005_SECRET_1120";
  return DEFAULT_API_KEY;
}

/**
 * Transmits parsed telemetry to the Backend REST API
 */
bool sendTelemetry(const String& binId, float distanceCm, int fillPercent, const String& status) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[HTTP] Wi-Fi offline. Reconnecting..."));
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println(F("[HTTP] Cannot send - Wi-Fi disconnected"));
      return false;
    }
  }

  HTTPClient http;
  http.begin(BACKEND_API_URL);
  http.setTimeout(4000);

  // Set Headers
  http.addHeader("Content-Type", "application/json");
  const char* apiKey = getApiKeyForBin(binId);
  http.addHeader("X-API-Key", apiKey);

  // Build JSON body
  StaticJsonDocument<256> doc;
  doc["bin_id"] = binId;
  doc["distance_cm"] = distanceCm;
  doc["fill_percent"] = fillPercent;
  doc["status"] = status;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  digitalWrite(LED_STATUS, LOW); // LED ON during transmission
  int httpCode = http.POST(jsonPayload);
  digitalWrite(LED_STATUS, HIGH); // LED OFF

  if (httpCode > 0) {
    Serial.print(F("[HTTP] POST Code: "));
    Serial.print(httpCode);
    String response = http.getString();
    Serial.print(F(" | Response: "));
    Serial.println(response);
    http.end();
    return (httpCode >= 200 && httpCode < 300);
  } else {
    Serial.print(F("[HTTP] POST Failed. Error: "));
    Serial.println(http.errorToString(httpCode).c_str());
    http.end();
    return false;
  }
}

/**
 * Parses telemetry packet from Arduino UNO.
 * Supports:
 * 1. CSV Format: "BIN_001,11.9,72,MEDIUM"
 * 2. Key-Value Format: "BIN_ID:BIN_001,DIST:11.9,FILL:72,STATUS:MEDIUM"
 */
void parseAndProcessLine(String line) {
  line.trim();
  if (line.length() < 5) return;

  String binId = "";
  float distanceCm = 0.0;
  int fillPercent = 0;
  String status = "";

  if (line.indexOf("BIN_ID:") >= 0) {
    // Key-value format: BIN_ID:BIN_001,DIST:11.9,FILL:72,STATUS:MEDIUM
    int idxBin = line.indexOf("BIN_ID:");
    int idxDist = line.indexOf("DIST:");
    int idxFill = line.indexOf("FILL:");
    int idxStat = line.indexOf("STATUS:");

    if (idxBin >= 0 && idxDist >= 0 && idxFill >= 0 && idxStat >= 0) {
      binId = line.substring(idxBin + 7, line.indexOf(',', idxBin));
      distanceCm = line.substring(idxDist + 5, line.indexOf(',', idxDist)).toFloat();
      fillPercent = line.substring(idxFill + 5, line.indexOf(',', idxFill)).toInt();
      status = line.substring(idxStat + 7);
      status.trim();
    }
  } else if (line.indexOf(',') > 0) {
    // CSV format: BIN_001,11.9,72,MEDIUM
    int comma1 = line.indexOf(',');
    int comma2 = line.indexOf(',', comma1 + 1);
    int comma3 = line.indexOf(',', comma2 + 1);

    if (comma1 > 0 && comma2 > 0 && comma3 > 0) {
      binId = line.substring(0, comma1);
      distanceCm = line.substring(comma1 + 1, comma2).toFloat();
      fillPercent = line.substring(comma2 + 1, comma3).toInt();
      status = line.substring(comma3 + 1);
      status.trim();
    }
  }

  if (binId.startsWith("BIN_") && distanceCm >= 0) {
    Serial.print(F("[GATEWAY] Ingested packet -> ID: "));
    Serial.print(binId);
    Serial.print(F(" | Dist: "));
    Serial.print(distanceCm);
    Serial.print(F("cm | Fill: "));
    Serial.print(fillPercent);
    Serial.print(F("% | Status: "));
    Serial.println(status);

    unsigned long now = millis();
    if (now - lastPacketSent >= MIN_SEND_INTERVAL_MS) {
      lastPacketSent = now;
      sendTelemetry(binId, distanceCm, fillPercent, status);
    }
  }
}

void loop() {
  // Read incoming serial characters from Arduino UNO
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      if (serialBuffer.length() > 0) {
        parseAndProcessLine(serialBuffer);
        serialBuffer = "";
      }
    } else {
      if (serialBuffer.length() < 128) {
        serialBuffer += c;
      }
    }
  }

  // Periodic Wi-Fi reconnection check every 15s if disconnected
  static unsigned long lastWifiCheck = 0;
  if (millis() - lastWifiCheck > 15000) {
    lastWifiCheck = millis();
    if (WiFi.status() != WL_CONNECTED) {
      connectWiFi();
    }
  }
}
