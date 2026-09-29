/**
 * @file safety_fsm.h
 * @brief MineGuard AI — STM32 Safety State Machine and Actuator Controller
 * @project SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring
 */

#ifndef __MINEGUARD_SAFETY_FSM_H
#define __MINEGUARD_SAFETY_FSM_H

#include <stdint.h>
#include <stdbool.h>
#include "protocol.h"

#define WATCHDOG_TIMEOUT_MS  2000
#define MOTOR_DEFAULT_SPEED_PWM 1500  /* Standard 75% duty cycle */

typedef enum {
    STATE_FSM_INIT,
    STATE_FSM_READY,
    STATE_FSM_RUNNING,
    STATE_FSM_ALERT,
    STATE_FSM_STOP_LATCHED,
    STATE_FSM_ESTOP_TRIPPED,
    STATE_FSM_WATCHDOG_FAULT
} SafetyFSMState;

typedef struct {
    SafetyFSMState current_state;
    bool critical_stop_latched;
    bool physical_estop_tripped;
    bool motor_fault;
    uint16_t current_pwm;
    uint16_t target_pwm;
    uint16_t watchdog_timer_ms;
    uint32_t last_heartbeat_tick;
    uint32_t last_state_change_tick;
} SafetyContext;

/* Public API */
void SafetyFSM_Init(void);
void SafetyFSM_Tick(uint16_t delta_ms);
void SafetyFSM_ProcessCommand(const ProtocolPacket *pkt);
void SafetyFSM_TriggerEStop(void);
void SafetyFSM_ClearEStop(void);
bool SafetyFSM_OperatorReset(void);
SafetyFSMState SafetyFSM_GetState(void);
uint16_t SafetyFSM_GetWatchdogRemaining(void);
void SafetyFSM_SetMotorPWM(uint16_t pwm);
void SafetyFSM_DropSafetyRelay(void);
void SafetyFSM_EnergizeSafetyRelay(void);

#endif /* __MINEGUARD_SAFETY_FSM_H */
