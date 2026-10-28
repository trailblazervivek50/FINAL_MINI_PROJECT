/*
 * SMART GARBAGE — Arduino + ESP8266 + Ultrasonic + Moisture + LCD 16x2
 * Hardware Node Telemetry Sketch for Dustbin D-104
 * 
 * Hardware Connections:
 * - Ultrasonic HC-SR04:
 *     Trig Pin -> D5 (GPIO 14)
 *     Echo Pin -> D6 (GPIO 12)
 * - Soil Moisture Sensor:
 *     Analog Out -> A0
 * - I2C LCD 1602:
 *     SDA -> D2 (GPIO 4)
 *     SCL -> D1 (GPIO 5)
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Bridge server URL (laptop IP address running bridge_server.js)
const char* serverUrl = "http://192.168.1.100:8080/api/iot/readings";

// Ultrasonic Pins
const int trigPin = 14; // D5
const int echoPin = 12; // D6
const int moisturePin = A0;

// Dustbin physical depth (cm)
const float BIN_DEPTH_CM = 100.0;
const char* DUSTBIN_ID = "D-104";

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Serial.begin(115200);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("SMART GARBAGE");
  lcd.setCursor(0, 1);
  lcd.print("NODE D-104 BOOT");

  delay(1500);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  lcd.clear();
  if (WiFi.status() == WL_CONNECTED) {
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
  } else {
    lcd.setCursor(0, 0);
    lcd.print("WiFi Offline");
    lcd.setCursor(0, 1);
    lcd.print("Demo Standalone");
  }
  delay(1500);
}

float measureDistanceCm() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout
  if (duration == 0) return BIN_DEPTH_CM;

  float distance = duration * 0.0343 / 2.0;
  if (distance > BIN_DEPTH_CM) distance = BIN_DEPTH_CM;
  if (distance < 2.0) distance = 2.0;
  return distance;
}

int calculateFillPercentage(float distanceCm) {
  float fill = ((BIN_DEPTH_CM - distanceCm) / BIN_DEPTH_CM) * 100.0;
  if (fill < 0) fill = 0;
  if (fill > 100) fill = 100;
  return (int)fill;
}

int readMoisture() {
  int raw = analogRead(moisturePin); // 0 to 1023
  // Invert if 1023 is dry, 0 is wet
  int percentage = map(1023 - raw, 0, 1023, 0, 100);
  if (percentage < 0) percentage = 0;
  if (percentage > 100) percentage = 100;
  return percentage;
}

void loop() {
  float distance = measureDistanceCm();
  int fill = calculateFillPercentage(distance);
  int moisture = readMoisture();

  // 1. Display on LCD 16x2
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("BIN: ");
  lcd.print(DUSTBIN_ID);
  lcd.print(" ");
  lcd.print(fill);
  lcd.print("%");

  lcd.setCursor(0, 1);
  lcd.print("D:");
  lcd.print(distance, 1);
  lcd.print("cm M:");
  lcd.print(moisture);
  lcd.print("%");

  Serial.printf("[%s] Fill: %d%%, Dist: %.1f cm, Moisture: %d%%\n", DUSTBIN_ID, fill, distance, moisture);

  // 2. Transmit Telemetry over Wi-Fi
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    if (http.begin(client, serverUrl)) {
      http.addHeader("Content-Type", "application/json");

      String jsonPayload = "{\"dustbinId\":\"" + String(DUSTBIN_ID) +
                           "\",\"fillPercentage\":" + String(fill) +
                           ",\"distance\":" + String(distance, 1) +
                           ",\"moisture\":" + String(moisture) + "}";

      int httpCode = http.POST(jsonPayload);
      if (httpCode > 0) {
        Serial.printf("POST status: %d\n", httpCode);
      } else {
        Serial.printf("POST failed: %s\n", http.errorToString(httpCode).c_str());
      }
      http.end();
    }
  }

  // Sample every 2.5 seconds
  delay(2500);
}
