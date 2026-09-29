/**
 * @file main.c
 * @brief MineGuard AI — STM32 Master Application and Peripheral Control Loop
 * @project SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring
 * Target: STM32F401RE / STM32F411CE
 */

#include "main.h"
#include "protocol.h"
#include "safety_fsm.h"
#include "sensors.h"
#include <string.h>

/* Global State Variables */
static uint8_t g_telemetry_seq = 0;
static uint32_t g_system_ticks = 0;
static uint8_t g_tx_buffer[64];

/* Hardware abstraction implementations */
void HW_SetRelay(bool state) {
    /* Set PB0: 1 = Energized (Closed), 0 = De-energized (Safe Open) */
    (void)state;
}

void HW_SetMotorPWM(uint16_t pwm) {
    /* Set TIM1_CH1 Compare Register (PA8) */
    (void)pwm;
}

void HW_SetBuzzer(bool state) {
    /* Set PB1: 1 = Active, 0 = Inactive */
    (void)state;
}

bool HW_ReadPhysicalEStop(void) {
    /* Read PB2 (NC Mushroom E-Stop). High = Normal, Low = Pressed/Broken */
    return true;
}

/**
 * @brief Transmits a byte buffer to the Host PC via USART2.
 */
static void UART_Transmit(const uint8_t *data, uint16_t length) {
    /* Call HAL_UART_Transmit(&huart2, (uint8_t*)data, length, 100); */
    (void)data;
    (void)length;
}

/**
 * @brief Main firmware entry point.
 */
int main(void) {
    /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
    /* HAL_Init(); */
    /* SystemClock_Config(); */

    /* Initialize Subsystems */
    Protocol_Init();
    SafetyFSM_Init();
    Sensors_Init();

    uint32_t last_tick_10ms = 0;
    uint32_t last_tick_100ms = 0;

    /* Main Super-Loop */
    while (1) {
        g_system_ticks++;

        /* 1. Process Incoming Host UART Commands */
        uint8_t rx_byte = 0;
        /* Simulated / polled UART byte read:
         * if (HAL_UART_Receive(&huart2, &rx_byte, 1, 0) == HAL_OK) {
         *     ProtocolPacket pkt;
         *     if (Protocol_ParseByte(rx_byte, &pkt)) {
         *         SafetyFSM_ProcessCommand(&pkt);
         *     }
         * }
         */
        ProtocolPacket pkt;
        if (Protocol_ParseByte(rx_byte, &pkt)) {
            SafetyFSM_ProcessCommand(&pkt);
        }

        /* 2. 10 ms Periodic Tasks: Safety FSM & Watchdog Tick */
        if (g_system_ticks - last_tick_10ms >= 10) {
            last_tick_10ms = g_system_ticks;
            SafetyFSM_Tick(10);
        }

        /* 3. 100 ms Periodic Tasks: Sensor Acquisition & Telemetry Transmission */
        if (g_system_ticks - last_tick_100ms >= 100) {
            last_tick_100ms = g_system_ticks;

            /* Sample physical sensors */
            Sensors_Update(100);

            /* Assemble Telemetry Frame (0x10) */
            TelemetryPayload tel;
            memset(&tel, 0, sizeof(tel));
            Sensors_PopulateTelemetry(&tel);

            /* Fill Safety Controller State */
            SafetyFSMState fsm_state = SafetyFSM_GetState();
            tel.motor_state = (fsm_state == STATE_FSM_RUNNING || fsm_state == STATE_FSM_ALERT) ? 1 : 
                              (fsm_state == STATE_FSM_WATCHDOG_FAULT ? 2 : 0);
            tel.safety_latch = (fsm_state == STATE_FSM_STOP_LATCHED || 
                                fsm_state == STATE_FSM_WATCHDOG_FAULT || 
                                fsm_state == STATE_FSM_ESTOP_TRIPPED) ? 1 : 0;
            tel.estop_state = (fsm_state == STATE_FSM_ESTOP_TRIPPED) ? 0 : 1;
            tel.watchdog_remaining_ms = SafetyFSM_GetWatchdogRemaining();

            /* Encode and dispatch telemetry packet */
            g_telemetry_seq++;
            uint16_t len = Protocol_BuildTelemetryPacket(g_telemetry_seq, &tel, g_tx_buffer);
            if (len > 0) {
                UART_Transmit(g_tx_buffer, len);
            }
        }
    }
}

void Error_Handler(void) {
    SafetyFSM_DropSafetyRelay();
    HW_SetMotorPWM(0);
    while (1) {}
}
