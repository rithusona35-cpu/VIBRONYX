/**
 * @file sensors.h
 * @brief MineGuard AI — STM32 Physical Sensor Drivers and Signal Processing
 * @project SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring
 * 
 * Sensor Suite:
 *   1. MPU6050: 6-DOF IMU (I2C1) - Roller Bearing Vibration RMS
 *   2. ACS712: Hall-Effect Current (ADC1) - Motor Load & Stall Detection
 *   3. Rotary Encoder: Quadrature (TIM2) - True Belt Linear Speed & RPM
 *   4. DS18B20: 1-Wire Digital Probe - Roller Bearing Temperature
 *   5. TCRT5000: Optical Reflective IR - Belt Presence & Edge Tracking
 */

#ifndef __MINEGUARD_SENSORS_H
#define __MINEGUARD_SENSORS_H

#include <stdint.h>
#include <stdbool.h>
#include "protocol.h"

/* Calibration Parameters */
#define ACS712_SENSITIVITY_MV_PER_A 185.0f   /* 5A model: 185 mV / A */
#define ACS712_ZERO_CURRENT_RAW     2048     /* 12-bit ADC midpoint (1.65V on 3.3V ref) */
#define ENCODER_PULSES_PER_REV      400      /* Optical encoder counts */
#define MPU6050_I2C_ADDR            0x68

typedef struct {
    uint16_t motor_current_mA;
    uint16_t belt_speed_rpm;
    int16_t  bearing_temp_c_x10;
    uint16_t vib_rms_x_mg;
    uint16_t vib_rms_y_mg;
    uint16_t vib_rms_z_mg;
    bool     belt_present;
    bool     mpu_healthy;
    bool     ds18b20_healthy;
    bool     acs712_healthy;
} SensorData;

/* Public API */
void Sensors_Init(void);
void Sensors_Update(uint16_t delta_ms);
void Sensors_PopulateTelemetry(TelemetryPayload *out_payload);
const SensorData* Sensors_GetData(void);

#endif /* __MINEGUARD_SENSORS_H */
