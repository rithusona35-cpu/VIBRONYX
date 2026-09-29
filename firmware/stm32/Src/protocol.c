/**
 * @file protocol.c
 * @brief MineGuard AI — STM32 Part 10 Binary Communication Protocol Implementation
 * @project SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring
 */

#include "protocol.h"
#include <string.h>

static ParserState g_parser_state = PARSE_WAIT_PREAMBLE_1;
static ProtocolPacket g_current_pkt;
static uint8_t g_payload_index = 0;
static uint8_t g_crc_buffer[MAX_PAYLOAD_LEN + 3];

/**
 * @brief Computes standard CRC-8 using polynomial 0x07 (SMBus standard).
 * Strictly mirrors the Python compute_crc8 implementation.
 */
uint8_t Protocol_ComputeCRC8(const uint8_t *data, uint16_t length) {
    uint8_t crc = 0x00;
    for (uint16_t i = 0; i < length; i++) {
        crc ^= data[i];
        for (uint8_t b = 0; b < 8; b++) {
            if (crc & 0x80) {
                crc = (uint8_t)((crc << 1) ^ 0x07);
            } else {
                crc = (uint8_t)(crc << 1);
            }
        }
    }
    return crc;
}

void Protocol_Init(void) {
    g_parser_state = PARSE_WAIT_PREAMBLE_1;
    memset(&g_current_pkt, 0, sizeof(g_current_pkt));
    g_payload_index = 0;
}

/**
 * @brief State-machine stream parser for incoming UART bytes.
 * Validates preambles, lengths, CRC-8, and postambles.
 * @return true if a complete, valid packet has been decoded into out_pkt.
 */
bool Protocol_ParseByte(uint8_t byte, ProtocolPacket *out_pkt) {
    switch (g_parser_state) {
        case PARSE_WAIT_PREAMBLE_1:
            if (byte == PROTOCOL_PREAMBLE_1) {
                g_parser_state = PARSE_WAIT_PREAMBLE_2;
            }
            break;

        case PARSE_WAIT_PREAMBLE_2:
            if (byte == PROTOCOL_PREAMBLE_2) {
                g_parser_state = PARSE_WAIT_SEQ;
            } else if (byte == PROTOCOL_PREAMBLE_1) {
                g_parser_state = PARSE_WAIT_PREAMBLE_2; /* Re-trigger */
            } else {
                g_parser_state = PARSE_WAIT_PREAMBLE_1;
            }
            break;

        case PARSE_WAIT_SEQ:
            g_current_pkt.seq_id = byte;
            g_parser_state = PARSE_WAIT_TYPE;
            break;

        case PARSE_WAIT_TYPE:
            g_current_pkt.msg_type = byte;
            g_parser_state = PARSE_WAIT_LEN;
            break;

        case PARSE_WAIT_LEN:
            g_current_pkt.payload_len = byte;
            if (g_current_pkt.payload_len > MAX_PAYLOAD_LEN) {
                /* Exceeds buffer size - reject packet */
                g_parser_state = PARSE_WAIT_PREAMBLE_1;
            } else if (g_current_pkt.payload_len == 0) {
                g_parser_state = PARSE_WAIT_CRC;
            } else {
                g_payload_index = 0;
                g_parser_state = PARSE_WAIT_PAYLOAD;
            }
            break;

        case PARSE_WAIT_PAYLOAD:
            g_current_pkt.payload[g_payload_index++] = byte;
            if (g_payload_index >= g_current_pkt.payload_len) {
                g_parser_state = PARSE_WAIT_CRC;
            }
            break;

        case PARSE_WAIT_CRC:
            g_current_pkt.crc8 = byte;
            /* Verify CRC */
            g_crc_buffer[0] = g_current_pkt.seq_id;
            g_crc_buffer[1] = g_current_pkt.msg_type;
            g_crc_buffer[2] = g_current_pkt.payload_len;
            if (g_current_pkt.payload_len > 0) {
                memcpy(&g_crc_buffer[3], g_current_pkt.payload, g_current_pkt.payload_len);
            }
            uint8_t expected_crc = Protocol_ComputeCRC8(g_crc_buffer, 3 + g_current_pkt.payload_len);
            if (expected_crc == g_current_pkt.crc8) {
                g_parser_state = PARSE_WAIT_CR;
            } else {
                /* CRC mismatch: reject */
                g_parser_state = PARSE_WAIT_PREAMBLE_1;
            }
            break;

        case PARSE_WAIT_CR:
            if (byte == PROTOCOL_POSTAMBLE_1) {
                g_parser_state = PARSE_WAIT_LF;
            } else {
                g_parser_state = PARSE_WAIT_PREAMBLE_1;
            }
            break;

        case PARSE_WAIT_LF:
            g_parser_state = PARSE_WAIT_PREAMBLE_1;
            if (byte == PROTOCOL_POSTAMBLE_2) {
                g_current_pkt.is_valid = true;
                if (out_pkt) {
                    *out_pkt = g_current_pkt;
                }
                return true;
            }
            break;

        default:
            g_parser_state = PARSE_WAIT_PREAMBLE_1;
            break;
    }
    return false;
}

/**
 * @brief Constructs a binary packet into the destination buffer.
 * @return Total packet length in bytes.
 */
uint16_t Protocol_BuildPacket(uint8_t seq_id, uint8_t msg_type, const uint8_t *payload, uint8_t payload_len, uint8_t *tx_buf) {
    if (!tx_buf || payload_len > MAX_PAYLOAD_LEN) return 0;

    tx_buf[0] = PROTOCOL_PREAMBLE_1;
    tx_buf[1] = PROTOCOL_PREAMBLE_2;
    tx_buf[2] = seq_id;
    tx_buf[3] = msg_type;
    tx_buf[4] = payload_len;

    if (payload && payload_len > 0) {
        memcpy(&tx_buf[5], payload, payload_len);
    }

    uint8_t crc = Protocol_ComputeCRC8(&tx_buf[2], 3 + payload_len);
    uint16_t idx = 5 + payload_len;
    tx_buf[idx++] = crc;
    tx_buf[idx++] = PROTOCOL_POSTAMBLE_1;
    tx_buf[idx++] = PROTOCOL_POSTAMBLE_2;

    return idx;
}

/**
 * @brief Constructs a TELEMETRY_PACKET (0x10) frame with network byte order.
 * @return Total packet length (26 bytes).
 */
uint16_t Protocol_BuildTelemetryPacket(uint8_t seq_id, const TelemetryPayload *telemetry, uint8_t *tx_buf) {
    if (!telemetry || !tx_buf) return 0;

    uint8_t payload[TELEMETRY_PAYLOAD_LEN];
    /* Pack with big-endian network byte order */
    payload[0]  = (uint8_t)((telemetry->motor_current_mA >> 8) & 0xFF);
    payload[1]  = (uint8_t)(telemetry->motor_current_mA & 0xFF);
    payload[2]  = (uint8_t)((telemetry->belt_speed_rpm >> 8) & 0xFF);
    payload[3]  = (uint8_t)(telemetry->belt_speed_rpm & 0xFF);
    payload[4]  = (uint8_t)((telemetry->bearing_temp_c_x10 >> 8) & 0xFF);
    payload[5]  = (uint8_t)(telemetry->bearing_temp_c_x10 & 0xFF);
    payload[6]  = (uint8_t)((telemetry->vib_rms_x_mg >> 8) & 0xFF);
    payload[7]  = (uint8_t)(telemetry->vib_rms_x_mg & 0xFF);
    payload[8]  = (uint8_t)((telemetry->vib_rms_y_mg >> 8) & 0xFF);
    payload[9]  = (uint8_t)(telemetry->vib_rms_y_mg & 0xFF);
    payload[10] = (uint8_t)((telemetry->vib_rms_z_mg >> 8) & 0xFF);
    payload[11] = (uint8_t)(telemetry->vib_rms_z_mg & 0xFF);
    payload[12] = telemetry->ir_belt_presence;
    payload[13] = telemetry->motor_state;
    payload[14] = telemetry->safety_latch;
    payload[15] = telemetry->estop_state;
    payload[16] = (uint8_t)((telemetry->watchdog_remaining_ms >> 8) & 0xFF);
    payload[17] = (uint8_t)(telemetry->watchdog_remaining_ms & 0xFF);

    return Protocol_BuildPacket(seq_id, MSG_TELEMETRY_PACKET, payload, TELEMETRY_PAYLOAD_LEN, tx_buf);
}
