/*
 * ============================================================================
 * SMART MUNICIPAL DUSTBIN MONITORING PLATFORM
 * ESP8266 WI-FI NETWORK COMMUNICATION MODULE SKETCH
 * ============================================================================
 *
 * Device Identity: BIN_001 (configured with its unique DEVICE_KEY)
 * Hardware Module: ESP8266 (NodeMCU / ESP-01 / Wemos D1 Mini)
 * Role: Network Gateway
 * Protocol: Authenticated HTTP POST to Municipal Backend API
 *
 * WIRING WITH ARDUINO UNO:
 * ----------------------------------------------------------------------------
 * - ESP8266 RX (GPIO3 / Pin D9) <- Junction between two 1kΩ resistors:
 *     Arduino D11 (TX) ---> [ 1kΩ ] ---> Junction ---> ESP8266 RX
 *                                          |
 *                                       [ 1kΩ ]
 *                                          |
 *                                         GND
 *   (Crucial: 5V stepped down to 2.5V, protecting ESP8266 3.3V input!)
 *
 * - ESP8266 TX (GPIO1 / Pin D10) ---> Arduino D10 (RX)
 *   (Direct connection: ESP8266 3.3V output is high enough to trigger Arduino 5V HIGH)
 *
 * - ESP8266 GND <---> Arduino GND (Common ground is mandatory)
 *
 * - ESP8266 Power: Powered via USB port during prototype.
 *   DO NOT supply 5V directly to ESP8266 3.3V pin.
 *
 * API SPECIFICATION:
 * ----------------------------------------------------------------------------
 * Endpoint: POST http://<SERVER_HOST>:<PORT>/api/v1/bins/telemetry
 * Headers:
 *   Content-Type: application/json
 *   X-API-Key: <DEVICE_KEY>
 *
 * Payload:
 *   {
 *     "bin_id": "BIN_001",
 *     "distance_cm": 6.8,
 *     "fill_percent": 93,
 *     "status": "FULL"
 *   }
 * ============================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// --- Wi-Fi Network Credentials ---
const char* WIFI_SSID     = "YOUR_MUNICIPAL_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// --- Backend API Server Configuration ---
// Point to your municipal backend server IP / hostname and port
const char* API_URL = "http://192.168.1.100:5000/api/v1/bins/telemetry";

// --- Device Identity & Authentication Key ---
// Each of the 5 real physical dustbins has its own provisioned API key:
// BIN_001 -> KEY_BIN_001_SECRET_9871
// BIN_002 -> KEY_BIN_002_SECRET_5422
// BIN_003 -> KEY_BIN_003_SECRET_3319
// BIN_004 -> KEY_BIN_004_SECRET_7741
// BIN_005 -> KEY_BIN_005_SECRET_1120
const char* DEVICE_BIN_ID = "BIN_001";
const char* DEVICE_KEY    = "KEY_BIN_001_SECRET_9871";

// Buffer for serial line reading from Arduino UNO
String inputBuffer = "";

void setup() {
  // Serial0 (GPIO1 TX, GPIO3 RX) communicates with Arduino UNO
  Serial.begin(9600);
  delay(100);

  Serial.println();
  Serial.println(F("========================================"));
  Serial.println(F("[ESP8266] Smart Dustbin Gateway Starting"));
  Serial.print(F("[ESP8266] Bound to: "));
  Serial.println(DEVICE_BIN_ID);
  Serial.println(F("========================================"));

  // Initialize Wi-Fi Connection
  connectToWiFi();
}

void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print(F("[WIFI] Connecting to "));
  Serial.print(WIFI_SSID);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("[WIFI] Connected successfully!"));
    Serial.print(F("[WIFI] IP Address: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("[WIFI] Connection failed. Will retry in loop."));
  }
}

bool sendTelemetryToAPI(const String& binId, float distanceCm, int fillPercent, const String& status) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[ERROR] Cannot send telemetry: Wi-Fi offline"));
    connectToWiFi();
    return false;
  }

  // Security Check: Enforce device identity integrity
  if (binId != DEVICE_BIN_ID) {
    Serial.println(F("[SECURITY WARNING] Mismatched BIN_ID received from Arduino!"));
    return false;
  }

  WiFiClient client;
  HTTPClient http;

  if (http.begin(client, API_URL)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", DEVICE_KEY);

    // Build JSON payload
    String jsonPayload = "{";
    jsonPayload += "\"bin_id\":\"" + binId + "\",";
    jsonPayload += "\"distance_cm\":" + String(distanceCm, 1) + ",";
    jsonPayload += "\"fill_percent\":" + String(fillPercent) + ",";
    jsonPayload += "\"status\":\"" + status + "\"";
    jsonPayload += "}";

    int httpCode = http.POST(jsonPayload);

    if (httpCode > 0) {
      Serial.printf("[HTTP] POST Result Code: %d\n", httpCode);
      if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
        String response = http.getString();
        Serial.printf("[HTTP] Server Response: %s\n", response.c_str());
        http.end();
        return true;
      }
    } else {
      Serial.printf("[HTTP] POST Failed. Error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
  } else {
    Serial.println(F("[HTTP] Unable to connect to backend server endpoint"));
  }

  return false;
}

void parseAndProcessPacket(const String& packet) {
  // Expected CSV packet format from Arduino:
  // BIN_ID,DISTANCE_CM,FILL_PERCENT,STATUS
  // Example: BIN_001,6.8,93,FULL

  int idx1 = packet.indexOf(',');
  int idx2 = packet.indexOf(',', idx1 + 1);
  int idx3 = packet.indexOf(',', idx2 + 1);

  if (idx1 > 0 && idx2 > idx1 && idx3 > idx2) {
    String binId     = packet.substring(0, idx1);
    float distanceCm = packet.substring(idx1 + 1, idx2).toFloat();
    int fillPercent  = packet.substring(idx2 + 1, idx3).toInt();
    String status    = packet.substring(idx3 + 1);
    status.trim();

    Serial.printf("[PACKET] Received: Bin=%s, Dist=%.1fcm, Fill=%d%%, Status=%s\n",
                  binId.c_str(), distanceCm, fillPercent, status.c_str());

    // Transmit to Backend API
    sendTelemetryToAPI(binId, distanceCm, fillPercent, status);
  } else {
    Serial.println(F("[WARNING] Received malformed packet from Arduino"));
  }
}

void loop() {
  // Ensure Wi-Fi stays connected
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Read incoming serial data from Arduino UNO
  while (Serial.available()) {
    char c = (char)Serial.read();

    if (c == '\n' || c == '\r') {
      inputBuffer.trim();
      if (inputBuffer.length() > 0) {
        parseAndProcessPacket(inputBuffer);
        inputBuffer = "";
      }
    } else {
      inputBuffer += c;
    }
  }

  delay(50);
}
