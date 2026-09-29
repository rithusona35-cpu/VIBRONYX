// ==============================================================================
// MINEGUARD AI — CENTRALIZED TELEMETRY & SYSTEM CONFIGURATION
// SIH Problem Statement 26008: Real-Time Conveyor Monitoring & Safety
// ==============================================================================

window.MINEGUARD_CONFIG = {
  // Supabase Project Configuration
  supabase: {
    url: "https://tffhdzctkfdmzamwqxal.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZmhkemN0a2ZkbXphbXdxeGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTM4MTEsImV4cCI6MjEwNDE4OTgxMX0.rDc7I_VHd4Egypi311fXVvsvrpRqbgbYinOV32irioo",
    telemetryTable: "conveyor_telemetry",
    pollIntervalMs: 2500,
    staleTimeoutSec: 15
  },

  // Station Information
  station: {
    id: "C-01",
    name: "Conveyor C-01",
    zone: "Critical Conveyor Zone",
    location: "Uthupalayam / Tamil Nadu"
  },

  // Authoritative Database Column Mapping
  // Only maps columns confirmed to exist in Supabase conveyor_telemetry table
  columns: {
    id: "id",
    createdAt: "created_at",
    conveyorId: "conveyor_id",
    temperature: "temperature",          // DS18B20 Contact Temp (°C)
    temperatureFallback: "avg_temperature",
    vibration: "vibration",              // MPU6050 Accelerometer / Velocity
    vibrationFallback: "vibration_velocity",
    load: "load",                        // HX711 Load Cell (kg)
    loadFallback: "belt_load_kg",
    motorCurrent: "motor_current",        // ACS712 Current (A)
    rpm1: "rpm1",                        // Drive Roller Encoder (RPM)
    rpm2: "rpm2",                        // Driven Roller Encoder (RPM)
    beltSpeedFallback: "belt_speed",
    beltSlip: "belt_slip",               // Differential Pulse Slip (%)
    distance1: "distance1",              // Ultrasonic Sensor 1 (cm)
    distance2: "distance2",              // Ultrasonic Sensor 2 (cm)
    beltThickness: "belt_thickness",     // Residual Belt Thickness (mm)
    status: "status",                    // System Status Flag
    statusFallback: "conveyor_status"
  },

  // Operational Engineering Thresholds
  // Normal < Warning < Critical
  thresholds: {
    temperature: {
      warn: 50.0,    // °C
      crit: 65.0,
      unit: "°C",
      baseline: 25.5
    },
    vibration: {
      warn: 115.0,   // m/s² (MPU6050 raw resting baseline ~102.2 m/s²)
      crit: 140.0,
      velocityWarn: 4.5, // mm/s
      velocityCrit: 7.0,
      unit: "m/s²",
      baseline: 102.2
    },
    motorCurrent: {
      warn: 4.0,     // A
      crit: 8.0,
      unit: "A",
      baseline: 0.0
    },
    load: {
      warn: 250.0,   // kg
      crit: 350.0,
      unit: "kg",
      baseline: 0.0
    },
    beltSlip: {
      warn: 5.0,     // %
      crit: 10.0,
      unit: "%",
      baseline: 0.0
    }
  },

  // 5 AI Inspection Classes Supported by Trained Model
  aiClasses: [
    {
      id: "normal_belt",
      name: "Normal Belt Surface",
      severity: "NORMAL",
      badgeClass: "bg-[#EAF3EE] text-[#1E6B50] border-[#CDE2D6]",
      description: "Nominal rubber surface, zero tears or abrasions",
      sampleUrl: "/static/samples/normal_belt.jpg"
    },
    {
      id: "slight_scratch",
      name: "Slight Scratch",
      severity: "WARNING",
      badgeClass: "bg-[#FDF6E8] text-[#D98A16] border-[#F6E1B6]",
      description: "Surface-level cosmetic abrasion on top cover",
      sampleUrl: "/static/samples/slight_scratch.jpg"
    },
    {
      id: "deep_scratch",
      name: "Deep Scratch",
      severity: "WARNING",
      badgeClass: "bg-[#FDF6E8] text-[#D98A16] border-[#F6E1B6]",
      description: "Moderate gouge penetrating near carcass layer",
      sampleUrl: "/static/samples/deep_scratch.jpg"
    },
    {
      id: "longitudinal_tear",
      name: "Longitudinal Tear",
      severity: "CRITICAL",
      badgeClass: "bg-[#FDF0EE] text-[#C94A45] border-[#F7CBC6]",
      description: "Severe longitudinal slit requiring immediate repair",
      sampleUrl: "/static/samples/longitudinal_tear.jpg"
    },
    {
      id: "belt_splice",
      name: "Belt Splice Transition",
      severity: "CRITICAL",
      badgeClass: "bg-[#FDF0EE] text-[#C94A45] border-[#F7CBC6]",
      description: "Mechanical fastener joint / vulcanized splice seam",
      sampleUrl: "/static/samples/belt_splice.jpg"
    }
  ]
};
