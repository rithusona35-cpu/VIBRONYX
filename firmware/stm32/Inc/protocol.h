/**
 * @file protocol.h
 * @brief MineGuard AI — STM32 Part 10 Binary Communication Protocol Header
 * @project SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring
 * 
 * Frame Format:
 * [0xAA] [0x55] [SEQ_ID] [MSG_TYPE] [PAYLOAD_LEN] [PAYLOAD...] [CRC-8] [0x0D] [0x0A]
 */

#ifndef __MINEGUARD_PROTOCOL_H
#define __MINEGUARD_PROTOCOL_H

#include <stdint.h>
#include <stdbool.h>

#define PROTOCOL_PREAMBLE_1   0xAA
#define PROTOCOL_PREAMBLE_2   0x55
#define PROTOCOL_POSTAMBLE_1  0x0D
#define PROTOCOL_POSTAMBLE_2  0x0A

#define MAX_PAYLOAD_LEN       32
#define TELEMETRY_PAYLOAD_LEN 18

/* Message Types */
typedef enum {
    MSG_CMD_RUN          = 0x01,
    MSG_CMD_STOP         = 0x02,
    MSG_CMD_ESTOP        = 0x03,
    MSG_CMD_RESET        = 0x04,
    MSG_TELEMETRY_PACKET = 0x10,
    MSG_HEARTBEAT_PING   = 0xFF
} ProtocolMessageType;

/* Parser State Machine */
typedef enum {
    PARSE_WAIT_PREAMBLE_1,
    PARSE_WAIT_PREAMBLE_2,
    PARSE_WAIT_SEQ,
    PARSE_WAIT_TYPE,
    PARSE_WAIT_LEN,
    PARSE_WAIT_PAYLOAD,
    PARSE_WAIT_CRC,
    PARSE_WAIT_CR,
    PARSE_WAIT_LF
} ParserState;

/* Parsed Packet Structure */
typedef struct {
    uint8_t seq_id;
    uint8_t msg_type;
    uint8_t payload_len;
    uint8_t payload[MAX_PAYLOAD_LEN];
    uint8_t crc8;
    bool is_valid;
} ProtocolPacket;

/* 18-Byte Industrial Telemetry Structure matching Part 10 Spec */
typedef struct __attribute__((packed)) {
    uint16_t motor_current_mA;       /* ACS712 motor current */
    uint16_t belt_speed_rpm;         /* Rotary encoder speed */
    int16_t  bearing_temp_c_x10;     /* DS18B20 bearing temp (0.1 deg C) */
    uint16_t vib_rms_x_mg;           /* MPU6050 vibration X */
    uint16_t vib_rms_y_mg;           /* MPU6050 vibration Y */
    uint16_t vib_rms_z_mg;           /* MPU6050 vibration Z */
    uint8_t  ir_belt_presence;       /* TCRT5000: 1 = Present, 0 = Missing */
    uint8_t  motor_state;            /* 0 = Halted, 1 = Running, 2 = Fault */
    uint8_t  safety_latch;           /* 0 = Normal, 1 = Latched */
    uint8_t  estop_state;            /* 0 = Tripped, 1 = Normal */
    uint16_t watchdog_remaining_ms;  /* Milliseconds before timeout */
} TelemetryPayload;

/* Function Prototypes */
uint8_t Protocol_ComputeCRC8(const uint8_t *data, uint16_t length);
void Protocol_Init(void);
bool Protocol_ParseByte(uint8_t byte, ProtocolPacket *out_pkt);
uint16_t Protocol_BuildPacket(uint8_t seq_id, uint8_t msg_type, const uint8_t *payload, uint8_t payload_len, uint8_t *tx_buf);
uint16_t Protocol_BuildTelemetryPacket(uint8_t seq_id, const TelemetryPayload *telemetry, uint8_t *tx_buf);

#endif /* __MINEGUARD_PROTOCOL_H */
