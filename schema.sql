-- ==============================================================================
-- MineGuard AI: Conveyor Belt Rupture Detection System
-- Supabase PostgreSQL Schema & Realtime Setup
-- ==============================================================================

-- 1. Create the primary conveyor_telemetry table
CREATE TABLE IF NOT EXISTS public.conveyor_telemetry (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    conveyor_id TEXT NOT NULL DEFAULT 'C-01',
    conveyor_status TEXT NOT NULL DEFAULT 'Optimal', -- 'Optimal', 'Warning', 'Critical'
    anomaly_deviation NUMERIC NOT NULL DEFAULT 0.0,
    
    -- Sensor Readings: M274 Rotary Encoder
    belt_speed NUMERIC NOT NULL DEFAULT 3.8,         -- m/s
    target_speed NUMERIC NOT NULL DEFAULT 4.0,       -- m/s
    
    -- Sensor Readings: DS18B20 Contact Temperature Probe
    avg_temperature NUMERIC NOT NULL DEFAULT 42.5,   -- °C
    temp_variance NUMERIC NOT NULL DEFAULT 1.2,      -- % from baseline
    
    -- Sensor Readings: MLX90614 Contactless IR Thermometer
    bearing_temp NUMERIC NOT NULL DEFAULT 42.5,      -- °C (Bearing Housing #4)
    drive_motor_temp NUMERIC NOT NULL DEFAULT 41.2,  -- °C
    
    -- Sensor Readings: MPU6050 6-Axis Accelerometer & Gyro
    vibration_velocity NUMERIC NOT NULL DEFAULT 2.3, -- mm/s
    vibration_freq_spike TEXT NOT NULL DEFAULT '120Hz Spike',
    vibration_variance NUMERIC NOT NULL DEFAULT -0.4,
    joint_vibration NUMERIC NOT NULL DEFAULT 4.8,    -- mm/s (Joint J04)
    belt_tilt_deg NUMERIC NOT NULL DEFAULT 0.8,      -- degrees roll/pitch
    
    -- Sensor Readings: ACS712 Motor Current Sensor
    motor_current NUMERIC NOT NULL DEFAULT 84.0,     -- Amperes (Three-phase load)
    motor_load_pct NUMERIC NOT NULL DEFAULT 78.0,    -- % load
    motor_torque NUMERIC NOT NULL DEFAULT 1420.0,    -- Nm
    
    -- Sensor Readings: LOAD CELL (HX711)
    belt_load_kg NUMERIC NOT NULL DEFAULT 1850.0,    -- Material load tonnage/kg
    
    -- Sensor Readings: VL53L0X TOF Laser Distance Sensor
    belt_sag_mm NUMERIC NOT NULL DEFAULT 14.5,       -- Distance underside / sag in mm
    
    -- Sensor Readings: IR Sensor
    belt_alignment_ok BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE = aligned, FALSE = edge slip / rip
    
    -- Vision AI: CAMERA Optical Surface Tear Classification
    camera_rip_detected BOOLEAN NOT NULL DEFAULT FALSE,
    camera_confidence NUMERIC NOT NULL DEFAULT 98.4,
    
    -- Hardware & System Telemetry
    sensor_battery NUMERIC NOT NULL DEFAULT 94.0,    -- %
    system_latency INTEGER NOT NULL DEFAULT 14,      -- ms (Subterranean Mesh)
    
    -- Subterranean Atmospheric Safety
    methane_level NUMERIC NOT NULL DEFAULT 0.01,     -- %
    ventilation_flow INTEGER NOT NULL DEFAULT 12450, -- m³/h
    ambient_humidity NUMERIC NOT NULL DEFAULT 78.4,  -- % RH
    
    -- AI Predictive Analytics & SHAPley Attributions
    failure_probability NUMERIC NOT NULL DEFAULT 87.0, -- % Critical Risk
    fatigue_hours_left NUMERIC NOT NULL DEFAULT 42.0,  -- hours until rupture
    critical_zone TEXT NOT NULL DEFAULT 'Joint J04',
    shap_vibration NUMERIC NOT NULL DEFAULT 41.2,      -- +41.2%
    shap_thermal NUMERIC NOT NULL DEFAULT 28.5,        -- +28.5%
    shap_load NUMERIC NOT NULL DEFAULT 17.3,           -- +17.3%
    
    -- Zone Health Summary (JSONB)
    zones_data JSONB DEFAULT '[
        {"zone": "ZONE 01-03", "title": "Drive & Tensioner", "temp": 38.0, "status": "Normal"},
        {"zone": "ZONE 04-07", "title": "Main Gallery Span", "temp": 42.0, "status": "Stable"},
        {"zone": "ZONE 08-09", "title": "Joint J04 Junction", "temp": 49.5, "status": "Action Required"},
        {"zone": "ZONE 10-12", "title": "Discharge Terminal", "temp": 40.0, "status": "Normal"}
    ]'::jsonb
);

-- 2. Create the conveyor_alerts table for ticket dispatching
CREATE TABLE IF NOT EXISTS public.conveyor_alerts (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    conveyor_id TEXT NOT NULL DEFAULT 'C-01',
    severity TEXT NOT NULL DEFAULT 'Critical', -- 'Info', 'Warning', 'Critical'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    zone TEXT NOT NULL DEFAULT 'Joint J04',
    status TEXT NOT NULL DEFAULT 'Open',       -- 'Open', 'In Progress', 'Resolved'
    resolved_at TIMESTAMPTZ
);

-- 3. Create index on created_at for fast descending telemetry queries
CREATE INDEX IF NOT EXISTS idx_conveyor_telemetry_created_at 
ON public.conveyor_telemetry (created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.conveyor_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conveyor_alerts ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies to allow anonymous read and write access for hackathon / development
DROP POLICY IF EXISTS "Allow anon read conveyor_telemetry" ON public.conveyor_telemetry;
CREATE POLICY "Allow anon read conveyor_telemetry"
ON public.conveyor_telemetry FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon insert conveyor_telemetry" ON public.conveyor_telemetry;
CREATE POLICY "Allow anon insert conveyor_telemetry"
ON public.conveyor_telemetry FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update conveyor_telemetry" ON public.conveyor_telemetry;
CREATE POLICY "Allow anon update conveyor_telemetry"
ON public.conveyor_telemetry FOR UPDATE
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon read conveyor_alerts" ON public.conveyor_alerts;
CREATE POLICY "Allow anon read conveyor_alerts"
ON public.conveyor_alerts FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon insert conveyor_alerts" ON public.conveyor_alerts;
CREATE POLICY "Allow anon insert conveyor_alerts"
ON public.conveyor_alerts FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 6. Enable Realtime Replication on conveyor_telemetry
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'conveyor_telemetry'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conveyor_telemetry;
  END IF;
END $$;

-- 7. Insert Initial Baseline Row
INSERT INTO public.conveyor_telemetry (
    conveyor_id, conveyor_status, anomaly_deviation,
    belt_speed, target_speed, avg_temperature, temp_variance,
    bearing_temp, drive_motor_temp, vibration_velocity, vibration_freq_spike,
    vibration_variance, joint_vibration, belt_tilt_deg,
    motor_current, motor_load_pct, motor_torque, belt_load_kg,
    belt_sag_mm, belt_alignment_ok, camera_rip_detected,
    sensor_battery, system_latency, methane_level, ventilation_flow,
    ambient_humidity, failure_probability, fatigue_hours_left,
    critical_zone, shap_vibration, shap_thermal, shap_load
) VALUES (
    'C-01', 'Optimal', 0.0,
    3.8, 4.0, 42.5, 1.2,
    42.5, 41.2, 2.3, '120Hz Spike',
    -0.4, 4.8, 0.8,
    84.0, 78.0, 1420.0, 1850.0,
    14.5, true, false,
    94.0, 14, 0.01, 12450,
    78.4, 87.0, 42.0,
    'Joint J04', 41.2, 28.5, 17.3
);
