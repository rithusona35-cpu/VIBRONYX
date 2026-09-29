export type NavSection = 
  | 'OVERVIEW'
  | 'LIVE_MONITORING'
  | 'BELT_INSPECTION'
  | 'TRENDS'
  | 'ALARMS'
  | 'EVENTS'
  | 'SYSTEM'
  | 'REPORTS'
  | 'MODEL_VALIDATION'
  | 'SETTINGS';

export type MachineStatus = 
  | 'NORMAL'
  | 'RUNNING'
  | 'WARNING' 
  | 'CRITICAL'
  | 'OFFLINE' 
  | 'SENSOR FAULT'
  | 'STOP_LATCHED'
  | 'STARTING' 
  | 'PAUSED' 
  | 'MAINTENANCE';

export interface HealthBreakdown {
  temperature: number;
  vibration: number;
  motor: number;
  belt: number;
  aiInspection: number;
}

export interface TelemetryData {
  temperature: number | null;
  vibration: number | null;
  motor_current: number | null;
  load: number | null;
  belt_speed: number | null;
  belt_slip: number | null;
  belt_thickness: number | null;
  device_id?: string;
  distance1?: number | null;
  distance2?: number | null;
  rpm1?: number | null;
  rpm2?: number | null;
  belt_alignment: 'CENTERED' | 'MISALIGNED';
  surface_condition?: 'NORMAL' | 'SCRATCH' | 'DEEP_SCRATCH' | 'LONGITUDINAL_TEAR' | 'BELT_SPLICE';
  rpm: number | null;
  status: MachineStatus;
  lastUpdate: number;
  healthScore: number;
  healthBreakdown: HealthBreakdown;
  humanStory: string;
  operatorConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  operatorConfidenceReason: string;
  dataQuality: 'GOOD' | 'DEGRADED';
  maintenanceInsight: string;
}

export interface AppAlarm {
  id: string;
  time: string;
  source: string;
  condition: string;
  currentValue: string;
  threshold: string;
  category: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'NORMAL';
  action: string;
  acknowledged: boolean;
}

export interface AppEvent {
  id: string;
  time: string;
  message: string;
  category: 'TELEMETRY' | 'AI_INSPECTION' | 'SYSTEM' | 'OPERATOR' | 'ALARM';
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'INFO';
}

export interface DetectedBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  label: string;
  confidence: number; // percentage 0-100
  severity?: 'NORMAL' | 'WARNING' | 'CRITICAL';
  location?: string;
}

export interface QualityCheckResult {
  passed: boolean;
  width: number;
  height: number;
  brightness: number; // 0-255
  contrast: number;
  blurScore?: number;
  message: string;
}

export type ModelStatus = 
  | 'MODEL READY'
  | 'MODEL BUSY'
  | 'MODEL OFFLINE'
  | 'MODEL ERROR'
  | 'MODEL INFERENCE COMPLETE'
  | 'AI MODEL READY'
  | 'AI MODEL OFFLINE';

export type InspectionStatus = 
  | 'IMAGE_READY'
  | 'ANALYZING'
  | 'COMPLETED'
  | 'MODEL_OFFLINE'
  | 'QUALITY_REJECTED'
  | 'ERROR';

export type ConfidenceBand = 
  | 'HIGH CONFIDENCE'
  | 'MEDIUM CONFIDENCE'
  | 'LOW CONFIDENCE'
  | 'UNCERTAIN';

export interface InspectionRecord {
  id: string; // e.g. MG-2026-001241
  timestamp: string;
  imageSrc: string;
  imageHash: string;
  source: 'USER_UPLOAD' | 'CAMERA_CAPTURE' | 'SAMPLE_PRESET';
  sampleExpectedClass?: string;
  status: InspectionStatus;
  quality: QualityCheckResult;
  modelName: string;
  modelVersion: string;
  processingTimeMs?: number;
  // Results
  classification?: string;
  confidence?: number;
  confidenceBand?: ConfidenceBand;
  severity?: 'NORMAL' | 'WARNING' | 'CRITICAL';
  defectLocation?: string;
  detectionCount?: string;
  boxes?: DetectedBox[];
  recommendation?: string;
  whyExplanation?: string;
  operatorNotes?: string;
  isDemoMode?: boolean;
  rawResponse?: any;
}

export interface InspectionResult {
  classification: string;
  confidence: number;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
  condition: string;
  recommendation: string;
  source: 'Laptop Camera' | 'Image Upload' | 'Sample Image';
  explanation: string;
  inspectionId?: string;
  timestamp?: string;
  whyExplanation?: string;
  operatorNotes?: string;
  detectedBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    confidence: number;
  };
}

export type SimulationScenario = 
  | 'NORMAL' 
  | 'LOAD_INC' 
  | 'TEMP_RISE' 
  | 'VIBRATION_INC' 
  | 'BELT_SLIP'
  | 'SLIGHT_SCRATCH'
  | 'DEEP_SCRATCH'
  | 'LONGITUDINAL_TEAR'
  | 'BELT_SPLICE'
  | 'SENSOR_DISCONNECT'
  | 'ESTOP';

export interface ModelValidationSummary {
  model_id: string;
  name: string;
  version: string;
  architecture: string;
  parameters_m: number;
  accuracy_curated_pct: number;
  mAP50: number;
  mAP50_95: number;
  precision: number;
  recall: number;
  f1_score: number;
  longitudinal_tear_ap50: number;
  longitudinal_tear_test_result: string;
  longitudinal_tear_confidence: number;
  latency_ms: number;
  is_active_model: boolean;
}

export interface CuratedTestBenchItem {
  model_id: string;
  model_name: string;
  sample_id: string;
  image_name: string;
  ground_truth: string;
  predicted_class: string;
  confidence: number;
  inference_time_ms: number;
  pass_fail: 'PASS' | 'FAIL';
  is_critical_test?: boolean;
}

export interface ModelValidationData {
  metadata: {
    title: string;
    timestamp: string;
    models_tested_count: number;
    images_curated_count: number;
    test_split_count: number;
    classes_count: number;
  };
  active_model: {
    id: string;
    name: string;
    version: string;
    weights_path: string;
    status: string;
    validation_status: string;
  };
  best_supported_model: ModelValidationSummary;
  pipeline_audit: {
    status: string;
    active_model_path: string;
    input_resolution: string;
    color_space: string;
    confidence_threshold: number;
    iou_threshold: number;
    backend_endpoint: string;
    backend_response_field: string;
    frontend_mismatch_identified: boolean;
    root_cause_explanation: string;
  };
  dataset_health: {
    status: string;
    total_test_images: number;
    total_test_labels: number;
    corrupted_images: number;
    class_distribution: Record<string, number>;
    longitudinal_tear_samples: number;
    train_val_leakage: string;
    health_score_pct: number;
  };
  model_comparison: ModelValidationSummary[];
  curated_test_bench: CuratedTestBenchItem[];
  longitudinal_tear_investigation: {
    sample_id: string;
    ground_truth: string;
    agreement_status: string;
    active_model_prediction: string;
    active_model_confidence: number;
    active_model_result: string;
    root_cause: string;
    recommended_fix: string;
    cross_check: Array<{
      model_id: string;
      model_name: string;
      top_prediction: string;
      top_confidence: number;
    }>;
  };
}

