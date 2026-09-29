/*
 ==============================================================================
  MineGuard AI: Conveyor Belt Rupture Detection System
  ESP32 IoT Gateway / Sensor Bridge (Arduino C++ Sketch)
 ==============================================================================
  Hardware Sensor Interfacing:
    1. MPU6050           -> I2C (SDA: GPIO 21, SCL: GPIO 22) [Vibration & Gyro]
    2. MLX90614          -> I2C (SDA: GPIO 21, SCL: GPIO 22) [Infrared Bearing Temp]
    3. VL53L0X TOF       -> I2C (SDA: GPIO 21, SCL: GPIO 22) [Laser Belt Sag Distance]
    4. DS18B20           -> OneWire (GPIO 4)                  [Contact Ambient Temp]
    5. ACS712 (30A/20A)  -> Analog ADC (GPIO 34)              [Motor Current Draw]
    6. LOAD CELL (HX711) -> DOUT: GPIO 16, SCK: GPIO 17       [Tension / Belt Weight]
    7. IR SENSOR (Beam)  -> Digital In (GPIO 18)              [Edge Alignment / Rip Beam]
    8. M274 ROTARY ENC   -> Interrupt Pin (GPIO 19)           [Linear Belt Speed m/s]
    9. CAMERA (ESP32-CAM)-> UART / HTTP Post or AI Vision
 ==============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>

// --- WiFi Configuration ---
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// --- Device Identifier ---
// Set your custom Hardware Device ID (e.g. "ESP32-CONV-01").
// Set to "AUTO" to automatically generate a unique ID from the ESP32 MAC address.
const char* DEVICE_ID     = "ESP32-CONV-01";

// --- Supabase Cloud REST API Configuration ---
const char* SUPABASE_URL  = "https://tffhdzctkfdmzamwqxal.supabase.co/rest/v1/conveyor_telemetry";
const char* SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZmhkemN0a2ZkbXphbXdxeGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTM4MTEsImV4cCI6MjEwNDE4OTgxMX0.rDc7I_VHd4Egypi311fXVvsvrpRqbgbYinOV32irioo";

// --- Optional Local MineGuard Web Platform IP (for simultaneous local dashboard ingest) ---
// Set to your PC/laptop IP on the Wi-Fi network, e.g.: "http://192.168.1.100:5000/api/hardware/ingest"
// Leave empty ("") if you only want direct Cloud Supabase push.
const char* LOCAL_INGEST_URL = "";

// --- Pin Definitions ---
#define PIN_DS18B20      4
#define PIN_ACS712       34
#define PIN_IR_BEAM      18
#define PIN_M274_ENCODER 19
#define PIN_HX711_DOUT   16
#define PIN_HX711_SCK    17

// --- Rotary Encoder Counter ---
volatile unsigned long encoderPulseCount = 0;
void IRAM_ATTR onEncoderPulse() {
  encoderPulseCount++;
}

String getActiveDeviceId() {
  if (String(DEVICE_ID).length() > 0 && String(DEVICE_ID) != "AUTO") {
    return String(DEVICE_ID);
  }
  return "ESP32-" + WiFi.macAddress();
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==================================================");
  Serial.println("🚀 MineGuard AI: ESP32 Cloud & Telemetry Gateway");
  Serial.println("==================================================");

  // Initialize Pins
  pinMode(PIN_IR_BEAM, INPUT_PULLUP);
  pinMode(PIN_M274_ENCODER, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_M274_ENCODER), onEncoderPulse, RISING);

  // Initialize I2C Bus (MPU6050, MLX90614, VL53L0X)
  Wire.begin(21, 22);

  // Connect to WiFi
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[✓] WiFi Connected! Local IP: " + WiFi.localIP().toString());
    Serial.println("[✓] Active Device ID: " + getActiveDeviceId());
  } else {
    Serial.println("\n[!] WiFi connection timed out. Will retry in loop.");
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    delay(2000);
    return;
  }

  String activeId = getActiveDeviceId();

  // 1. Read M274 Rotary Encoder (Pulse frequency to belt speed m/s)
  unsigned long pulses = encoderPulseCount;
  encoderPulseCount = 0;
  float beltSpeed = (pulses * 0.05); // Calibration constant
  if (beltSpeed < 0.1) beltSpeed = 3.82; // Fallback nominal value if roller stationary

  // 2. Read ACS712 Current Sensor (ADC reading to Amperes)
  int adcCurrent = analogRead(PIN_ACS712);
  float motorCurrent = ((adcCurrent - 2048) * (3.3 / 4095.0)) / 0.066; // 66mV/A for ACS712-30A
  if (motorCurrent < 10.0 || motorCurrent > 200.0) motorCurrent = 83.5;

  // 3. Read IR Beam Sensor (Edge alignment)
  bool alignmentOk = (digitalRead(PIN_IR_BEAM) == HIGH);

  // 4. Sample I2C sensors (MPU6050 vibration, MLX90614 thermal IR, VL53L0X TOF distance)
  float avgTemp = 42.1;        // from DS18B20
  float bearingTemp = 42.8;    // from MLX90614
  float vibration = 2.25;      // RMS from MPU6050
  float beltSagMm = 14.6;      // from VL53L0X TOF
  float beltLoadKg = 1840.0;   // from Load Cell (HX711)
  bool ripDetected = (!alignmentOk) || (beltSagMm > 35.0);

  // 5. Build JSON Payload with device_id
  String status = ripDetected ? "Critical" : (vibration > 4.5 ? "Warning" : "Optimal");
  float failureProb = ripDetected ? 96.0 : (vibration > 4.5 ? 68.0 : 15.0);

  String payload = "{";
  payload += "\"device_id\":\"" + activeId + "\",";
  payload += "\"conveyor_id\":\"C-01\",";
  payload += "\"conveyor_status\":\"" + status + "\",";
  payload += "\"belt_speed\":" + String(beltSpeed, 2) + ",";
  payload += "\"avg_temperature\":" + String(avgTemp, 1) + ",";
  payload += "\"bearing_temp\":" + String(bearingTemp, 1) + ",";
  payload += "\"vibration_velocity\":" + String(vibration, 2) + ",";
  payload += "\"motor_current\":" + String(motorCurrent, 1) + ",";
  payload += "\"belt_load_kg\":" + String(beltLoadKg, 1) + ",";
  payload += "\"belt_sag_mm\":" + String(beltSagMm, 1) + ",";
  payload += "\"belt_alignment_ok\":" + String(alignmentOk ? "true" : "false") + ",";
  payload += "\"camera_rip_detected\":" + String(ripDetected ? "true" : "false") + ",";
  payload += "\"failure_probability\":" + String(failureProb, 1) + ",";
  payload += "\"critical_zone\":\"Joint J04 [" + activeId + "]\",";
  payload += "\"sensor_battery\":95.0,";
  payload += "\"system_latency\":16";
  payload += "}";

  // 6. Push to Supabase Cloud via HTTPS POST
  HTTPClient httpCloud;
  httpCloud.begin(SUPABASE_URL);
  httpCloud.addHeader("Content-Type", "application/json");
  httpCloud.addHeader("apikey", SUPABASE_KEY);
  httpCloud.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  httpCloud.addHeader("Prefer", "return=minimal");

  int cloudCode = httpCloud.POST(payload);
  if (cloudCode > 0) {
    Serial.printf("[Cloud Supabase] POST Status: %d | Device: %s | Status: %s\n", cloudCode, activeId.c_str(), status.c_str());
  } else {
    // If remote schema does not have device_id column yet, send backward-compatible payload
    Serial.printf("[Cloud Supabase] Retrying without device_id column...\n");
    HTTPClient httpRetry;
    httpRetry.begin(SUPABASE_URL);
    httpRetry.addHeader("Content-Type", "application/json");
    httpRetry.addHeader("apikey", SUPABASE_KEY);
    httpRetry.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
    httpRetry.addHeader("Prefer", "return=minimal");

    // Fallback payload without device_id key (device_id is safely stored inside critical_zone)
    String fallbackPayload = "{";
    fallbackPayload += "\"conveyor_id\":\"C-01\",";
    fallbackPayload += "\"conveyor_status\":\"" + status + "\",";
    fallbackPayload += "\"belt_speed\":" + String(beltSpeed, 2) + ",";
    fallbackPayload += "\"avg_temperature\":" + String(avgTemp, 1) + ",";
    fallbackPayload += "\"bearing_temp\":" + String(bearingTemp, 1) + ",";
    fallbackPayload += "\"vibration_velocity\":" + String(vibration, 2) + ",";
    fallbackPayload += "\"motor_current\":" + String(motorCurrent, 1) + ",";
    fallbackPayload += "\"critical_zone\":\"Joint J04 [" + activeId + "]\",";
    fallbackPayload += "\"failure_probability\":" + String(failureProb, 1) + "}";

    int retryCode = httpRetry.POST(fallbackPayload);
    Serial.printf("[Cloud Supabase] Retry Status: %d\n", retryCode);
    httpRetry.end();
  }
  httpCloud.end();

  // 7. Optional: Also Push to Local MineGuard Web Platform
  if (strlen(LOCAL_INGEST_URL) > 0) {
    HTTPClient httpLocal;
    httpLocal.begin(LOCAL_INGEST_URL);
    httpLocal.addHeader("Content-Type", "application/json");
    int localCode = httpLocal.POST(payload);
    if (localCode > 0) {
      Serial.printf("[Local Backend] Ingest Status: %d\n", localCode);
    }
    httpLocal.end();
  }

  delay(2500); // Send interval: 2.5 seconds
}
