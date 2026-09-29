/**
 * @file sensors.c
 * @brief MineGuard AI — STM32 Physical Sensor Drivers and Signal Processing Implementation
 * @project SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring
 */

#include "sensors.h"
#include <string.h>
#include <math.h>

static SensorData g_sensor_data;

/* Weak HAL hardware hooks (overridden by actual HAL peripheral calls in main.c) */
__attribute__((weak)) uint16_t HW_ADC_ReadACS712(void) { return ACS712_ZERO_CURRENT_RAW + 50; /* ~270 mA baseline */ }
__attribute__((weak)) uint32_t HW_Encoder_GetCount(void) { static uint32_t cnt = 0; cnt += 20; return cnt; }
__attribute__((weak)) int16_t  HW_1Wire_ReadTemp(void) { return 285; /* 28.5 deg C */ }
__attribute__((weak)) bool     HW_I2C_ReadMPU6050(int16_t *accel_xyz) {
    if (accel_xyz) {
        accel_xyz[0] = 120;  /* X mg */
        accel_xyz[1] = 150;  /* Y mg */
        accel_xyz[2] = 1010; /* Z ~1g */
        return true;
    }
    return false;
}
__attribute__((weak)) bool     HW_GPIO_ReadIR(void) { return true; /* Belt present */ }

/* Moving average filter buffers */
#define CURRENT_FILTER_LEN 16
static uint16_t s_current_history[CURRENT_FILTER_LEN];
static uint8_t  s_current_idx = 0;
static uint32_t s_last_encoder_count = 0;

void Sensors_Init(void) {
    memset(&g_sensor_data, 0, sizeof(g_sensor_data));
    memset(s_current_history, 0, sizeof(s_current_history));
    s_current_idx = 0;
    s_last_encoder_count = HW_Encoder_GetCount();

    g_sensor_data.bearing_temp_c_x10 = 250; /* 25.0 C default */
    g_sensor_data.belt_present = true;
    g_sensor_data.mpu_healthy = true;
    g_sensor_data.ds18b20_healthy = true;
    g_sensor_data.acs712_healthy = true;
}

void Sensors_Update(uint16_t delta_ms) {
    /* 1. ACS712 Current Sensor Processing */
    uint16_t raw_adc = HW_ADC_ReadACS712();
    s_current_history[s_current_idx] = raw_adc;
    s_current_idx = (s_current_idx + 1) % CURRENT_FILTER_LEN;

    uint32_t adc_sum = 0;
    for (int i = 0; i < CURRENT_FILTER_LEN; i++) {
        adc_sum += s_current_history[i];
    }
    uint16_t filtered_adc = (uint16_t)(adc_sum / CURRENT_FILTER_LEN);

    int32_t delta_raw = (int32_t)filtered_adc - ACS712_ZERO_CURRENT_RAW;
    if (delta_raw < 0) delta_raw = -delta_raw; /* Unidirectional magnitude */

    /* Voltage in mV: (delta_raw / 4095.0) * 3300 mV */
    float delta_mv = (delta_raw * 3300.0f) / 4095.0f;
    /* Current in mA: (delta_mv / ACS712_SENSITIVITY_MV_PER_A) * 1000 */
    g_sensor_data.motor_current_mA = (uint16_t)((delta_mv / ACS712_SENSITIVITY_MV_PER_A) * 1000.0f);

    /* 2. Rotary Encoder Speed Calculation */
    uint32_t current_count = HW_Encoder_GetCount();
    uint32_t diff_counts = (current_count >= s_last_encoder_count) ?
                           (current_count - s_last_encoder_count) :
                           (current_count + (0xFFFFFFFF - s_last_encoder_count));
    s_last_encoder_count = current_count;

    if (delta_ms > 0) {
        /* RPM = (diff_counts / ENCODER_PULSES_PER_REV) * (60000 / delta_ms) */
        float revs = (float)diff_counts / (float)ENCODER_PULSES_PER_REV;
        g_sensor_data.belt_speed_rpm = (uint16_t)(revs * (60000.0f / (float)delta_ms));
    }

    /* 3. MPU6050 Vibration Acquisition */
    int16_t accel_raw[3] = {0};
    if (HW_I2C_ReadMPU6050(accel_raw)) {
        /* Convert raw 16-bit to mg (+/- 2g range: 16384 LSB/g) */
        g_sensor_data.vib_rms_x_mg = (uint16_t)(abs(accel_raw[0]) * 1000 / 16384);
        g_sensor_data.vib_rms_y_mg = (uint16_t)(abs(accel_raw[1]) * 1000 / 16384);
        g_sensor_data.vib_rms_z_mg = (uint16_t)(abs(accel_raw[2]) * 1000 / 16384);
        g_sensor_data.mpu_healthy = true;
    } else {
        g_sensor_data.mpu_healthy = false;
    }

    /* 4. DS18B20 Temperature Reading */
    int16_t temp_val = HW_1Wire_ReadTemp();
    if (temp_val > -500 && temp_val < 1500) {
        g_sensor_data.bearing_temp_c_x10 = temp_val;
        g_sensor_data.ds18b20_healthy = true;
    } else {
        g_sensor_data.ds18b20_healthy = false;
    }

    /* 5. TCRT5000 IR Belt Presence */
    g_sensor_data.belt_present = HW_GPIO_ReadIR();
}

void Sensors_PopulateTelemetry(TelemetryPayload *out_payload) {
    if (!out_payload) return;

    out_payload->motor_current_mA = g_sensor_data.motor_current_mA;
    out_payload->belt_speed_rpm   = g_sensor_data.belt_speed_rpm;
    out_payload->bearing_temp_c_x10 = g_sensor_data.bearing_temp_c_x10;
    out_payload->vib_rms_x_mg     = g_sensor_data.vib_rms_x_mg;
    out_payload->vib_rms_y_mg     = g_sensor_data.vib_rms_y_mg;
    out_payload->vib_rms_z_mg     = g_sensor_data.vib_rms_z_mg;
    out_payload->ir_belt_presence = g_sensor_data.belt_present ? 1 : 0;
}

const SensorData* Sensors_GetData(void) {
    return &g_sensor_data;
}
