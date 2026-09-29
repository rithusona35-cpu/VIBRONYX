/**
 * @file safety_fsm.c
 * @brief MineGuard AI — STM32 Safety State Machine and Actuator Controller Implementation
 * @project SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring
 */

#include "safety_fsm.h"
#include <string.h>

static SafetyContext g_fsm;

/* Weak hardware abstraction hooks (overridden by HAL driver in main.c) */
__attribute__((weak)) void HW_SetRelay(bool state) {}
__attribute__((weak)) void HW_SetMotorPWM(uint16_t pwm) {}
__attribute__((weak)) void HW_SetBuzzer(bool state) {}
__attribute__((weak)) bool HW_ReadPhysicalEStop(void) { return true; /* NC: True = Closed/OK */ }

void SafetyFSM_Init(void) {
    memset(&g_fsm, 0, sizeof(g_fsm));
    g_fsm.current_state = STATE_FSM_READY;
    g_fsm.critical_stop_latched = false;
    g_fsm.physical_estop_tripped = false;
    g_fsm.motor_fault = false;
    g_fsm.current_pwm = 0;
    g_fsm.target_pwm = 0;
    g_fsm.watchdog_timer_ms = WATCHDOG_TIMEOUT_MS;

    SafetyFSM_DropSafetyRelay();
    HW_SetMotorPWM(0);
    HW_SetBuzzer(false);
}

void SafetyFSM_DropSafetyRelay(void) {
    HW_SetRelay(false);
}

void SafetyFSM_EnergizeSafetyRelay(void) {
    HW_SetRelay(true);
}

void SafetyFSM_SetMotorPWM(uint16_t pwm) {
    g_fsm.target_pwm = pwm;
    if (g_fsm.current_state == STATE_FSM_RUNNING || g_fsm.current_state == STATE_FSM_ALERT) {
        g_fsm.current_pwm = pwm;
        HW_SetMotorPWM(pwm);
    } else {
        g_fsm.current_pwm = 0;
        HW_SetMotorPWM(0);
    }
}

void SafetyFSM_TriggerEStop(void) {
    g_fsm.physical_estop_tripped = true;
    g_fsm.critical_stop_latched = true;
    g_fsm.current_state = STATE_FSM_ESTOP_TRIPPED;
    g_fsm.current_pwm = 0;

    SafetyFSM_DropSafetyRelay();
    HW_SetMotorPWM(0);
    HW_SetBuzzer(true);
}

void SafetyFSM_ClearEStop(void) {
    if (HW_ReadPhysicalEStop()) {
        g_fsm.physical_estop_tripped = false;
    }
}

bool SafetyFSM_OperatorReset(void) {
    /* Cannot reset if physical E-Stop button is still depressed */
    if (!HW_ReadPhysicalEStop()) {
        return false;
    }

    g_fsm.critical_stop_latched = false;
    g_fsm.physical_estop_tripped = false;
    g_fsm.motor_fault = false;
    g_fsm.watchdog_timer_ms = WATCHDOG_TIMEOUT_MS;
    g_fsm.current_state = STATE_FSM_READY;
    g_fsm.current_pwm = 0;

    SafetyFSM_EnergizeSafetyRelay();
    HW_SetMotorPWM(0);
    HW_SetBuzzer(false);
    return true;
}

SafetyFSMState SafetyFSM_GetState(void) {
    return g_fsm.current_state;
}

uint16_t SafetyFSM_GetWatchdogRemaining(void) {
    return g_fsm.watchdog_timer_ms;
}

void SafetyFSM_Tick(uint16_t delta_ms) {
    /* Check physical Mushroom E-Stop input (Normally Closed contact) */
    if (!HW_ReadPhysicalEStop()) {
        if (!g_fsm.physical_estop_tripped) {
            SafetyFSM_TriggerEStop();
        }
        return;
    }

    /* Decrement communication watchdog */
    if (g_fsm.watchdog_timer_ms > delta_ms) {
        g_fsm.watchdog_timer_ms -= delta_ms;
    } else {
        g_fsm.watchdog_timer_ms = 0;
        /* Watchdog expired: trip fail-safe */
        if (g_fsm.current_state != STATE_FSM_WATCHDOG_FAULT &&
            g_fsm.current_state != STATE_FSM_ESTOP_TRIPPED) {
            g_fsm.current_state = STATE_FSM_WATCHDOG_FAULT;
            g_fsm.critical_stop_latched = true;
            g_fsm.current_pwm = 0;
            SafetyFSM_DropSafetyRelay();
            HW_SetMotorPWM(0);
            HW_SetBuzzer(true);
        }
    }
}

void SafetyFSM_ProcessCommand(const ProtocolPacket *pkt) {
    if (!pkt || !pkt->is_valid) return;

    /* Any valid incoming frame refreshes the watchdog */
    g_fsm.watchdog_timer_ms = WATCHDOG_TIMEOUT_MS;

    switch (pkt->msg_type) {
        case MSG_HEARTBEAT_PING:
            /* Heartbeat refreshed watchdog - no state change */
            break;

        case MSG_CMD_RUN:
            /* Cannot run if latched, in estop, or in fault */
            if (!g_fsm.critical_stop_latched &&
                !g_fsm.physical_estop_tripped &&
                g_fsm.current_state != STATE_FSM_WATCHDOG_FAULT) {
                g_fsm.current_state = STATE_FSM_RUNNING;
                SafetyFSM_EnergizeSafetyRelay();
                uint16_t speed = MOTOR_DEFAULT_SPEED_PWM;
                if (pkt->payload_len >= 2) {
                    speed = (uint16_t)((pkt->payload[0] << 8) | pkt->payload[1]);
                }
                SafetyFSM_SetMotorPWM(speed);
                HW_SetBuzzer(false);
            }
            break;

        case MSG_CMD_STOP:
            /* Controlled stop without latching */
            if (g_fsm.current_state == STATE_FSM_RUNNING || g_fsm.current_state == STATE_FSM_ALERT) {
                g_fsm.current_state = STATE_FSM_READY;
                SafetyFSM_SetMotorPWM(0);
                HW_SetBuzzer(false);
            }
            break;

        case MSG_CMD_ESTOP:
            /* Critical defect or host E-stop -> immediate stop and latch */
            g_fsm.critical_stop_latched = true;
            g_fsm.current_state = STATE_FSM_STOP_LATCHED;
            g_fsm.current_pwm = 0;
            SafetyFSM_DropSafetyRelay();
            HW_SetMotorPWM(0);
            HW_SetBuzzer(true);
            break;

        case MSG_CMD_RESET:
            SafetyFSM_OperatorReset();
            break;

        default:
            break;
    }
}
