# MineGuard AI — STM32 Embedded Controller Firmware

**Project**: SIH 26008 — AI-Based Industrial Conveyor Belt Defect Detection and Monitoring System  
**Target Board**: STM32F401RE (Nucleo-64) or STM32F411CE (Black Pill)  
**IDE/Toolchain**: STM32CubeIDE / GCC ARM Embedded / PlatformIO  

---

## 1. Pin Mapping & Peripheral Connections

| Peripheral | STM32 Pin | Signal | Target Hardware / Interface |
|---|---|---|---|
| **USART2 TX** | `PA2` | Serial TX | Connects to Laptop / Jetson RX (115200 bps, 8N1) |
| **USART2 RX** | `PA3` | Serial RX | Connects to Laptop / Jetson TX (115200 bps, 8N1) |
| **TIM1_CH1** | `PA8` | Motor PWM | BTS7960 RPWM (Forward Speed Control) |
| **GPIO OUT** | `PA9` | Motor DIR | BTS7960 LPWM (Direction / Ground) |
| **GPIO OUT** | `PA10`| Motor EN | BTS7960 R_EN & L_EN (Driver Enable) |
| **GPIO OUT** | `PB0` | Safety Relay | Optoisolated Relay Module (HIGH = Closed, LOW = Drop) |
| **GPIO OUT** | `PB1` | Alarm/Buzzer | Active Buzzer / Safety Strobe LED |
| **GPIO IN** | `PB2` | Mushroom E-Stop | Normally Closed (NC) physical push button (Pull-Up) |
| **ADC1_IN1** | `PA1` | Current Signal | ACS712-05B Analog Output pin |
| **TIM2_CH1** | `PA15`| Encoder Phase A | Optical/Magnetic Rotary Encoder (TI1) |
| **TIM2_CH2** | `PB3` | Encoder Phase B | Optical/Magnetic Rotary Encoder (TI2) |
| **I2C1_SCL** | `PB8` | MPU6050 SCL | Accelerometer I2C Clock (4.7k pull-up to 3.3V) |
| **I2C1_SDA** | `PB9` | MPU6050 SDA | Accelerometer I2C Data (4.7k pull-up to 3.3V) |
| **GPIO OD** | `PB5` | DS18B20 1-Wire | Waterproof Temp Probe Data (4.7k pull-up to 3.3V) |
| **GPIO IN** | `PB4` | TCRT5000 IR | Belt Presence / Edge Optical Sensor |

---

## 2. Part 10 Binary Protocol Frame
```
[0xAA] [0x55] [SEQ_ID] [MSG_TYPE] [PAYLOAD_LEN] [PAYLOAD...] [CRC-8] [0x0D] [0x0A]
```
- **CRC-8 Algorithm**: Polynomial `0x07` (SMBus standard) calculated over `[SEQ_ID, MSG_TYPE, PAYLOAD_LEN, ...PAYLOAD]`.
- **Telemetry Frame (`0x10`)**: 18-byte packed sensor payload transmitted every 100 ms.
- **Fail-Safe Watchdog**: Requires host `HEARTBEAT_PING` (`0xFF`) or command frame at least once every 2000 ms. If lost, relay drops and motor halts.

---

## 3. Flashing & Build Instructions

### Option A: STM32CubeIDE
1. Open STM32CubeIDE.
2. Create New STM32 Project selecting `STM32F401RETx` or `STM32F411CEUx`.
3. Copy `Inc/*` into `Core/Inc/` and `Src/*` into `Core/Src/`.
4. Build Release (`Ctrl+B`) and Click Run (`F11`) to flash via onboard ST-Link.

### Option B: PlatformIO
```ini
; platformio.ini
[env:nucleo_f401re]
platform = ststm32
board = nucleo_f401re
framework = stm32cube
build_flags = -IInc
```
Run `pio run -t upload`.
