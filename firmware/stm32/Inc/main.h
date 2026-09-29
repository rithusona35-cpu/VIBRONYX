/**
 * @file main.h
 * @brief MineGuard AI — STM32 Master Application and Pin Mapping Header
 * @project SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring
 * Target Microcontroller: STM32F401RE (Nucleo-64) / STM32F411CE (Black Pill)
 */

#ifndef __MAIN_H
#define __MAIN_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>

/* Pin Definitions */
#define MOTOR_PWM_PIN       (1 << 8)    /* PA8: TIM1_CH1 (PWM to BTS7960 RPWM) */
#define MOTOR_DIR_PIN       (1 << 9)    /* PA9: GPIO Output (Direction to BTS7960 LPWM) */
#define MOTOR_EN_PIN        (1 << 10)   /* PA10: GPIO Output (Enable to BTS7960 R_EN / L_EN) */
#define RELAY_CTRL_PIN      (1 << 0)    /* PB0: GPIO Output (Safety Opto-Relay, HIGH = Closed) */
#define BUZZER_CTRL_PIN     (1 << 1)    /* PB1: GPIO Output (Alarm Buzzer / Strobe) */
#define ESTOP_IN_PIN        (1 << 2)    /* PB2: GPIO Input Pull-up (Mushroom E-Stop, NC) */
#define IR_IN_PIN           (1 << 4)    /* PB4: GPIO Input (TCRT5000 IR Sensor) */
#define ONEWIRE_PIN         (1 << 5)    /* PB5: GPIO Open-Drain (DS18B20 1-Wire Data) */
#define ACS712_ADC_PIN      (1 << 1)    /* PA1: ADC1_IN1 (Current Analog In) */
#define ENCODER_A_PIN       (1 << 15)   /* PA15: TIM2_CH1 (Rotary Encoder Channel A) */
#define ENCODER_B_PIN       (1 << 3)    /* PB3: TIM2_CH2 (Rotary Encoder Channel B) */
#define USART2_TX_PIN       (1 << 2)    /* PA2: USART2 TX (Host Communication) */
#define USART2_RX_PIN       (1 << 3)    /* PA3: USART2 RX (Host Communication) */

/* Function Prototypes */
void SystemClock_Config(void);
void Error_Handler(void);

#ifdef __cplusplus
}
#endif

#endif /* __MAIN_H */
