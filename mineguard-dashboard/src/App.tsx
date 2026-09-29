import { useState } from 'react';
import Header from './components/Header';
import NavigationRail from './components/NavigationRail';
import PrimaryKPIStrip from './components/PrimaryKPIStrip';
import MachineStory from './components/MachineStory';
import ConveyorDigitalTwin from './components/ConveyorDigitalTwin';
import ConveyorHealthMap from './components/ConveyorHealthMap';
import EquipmentHealth from './components/EquipmentHealth';
import LiveTelemetryChart from './components/LiveTelemetryChart';
import BeltCondition from './components/BeltCondition';
import AIInspection from './components/AIInspection';
import MultiSensorAssessment from './components/MultiSensorAssessment';
import PredictiveMaintenance from './components/PredictiveMaintenance';
import AlarmCenter from './components/AlarmCenter';
import SensorHealth from './components/SensorHealth';
import SafetyControl from './components/SafetyControl';
import EventTimeline from './components/EventTimeline';
import SystemNotes from './components/SystemNotes';
import ReportsView from './components/ReportsView';
import InspectionReportModal from './components/InspectionReportModal';
import ModelValidationView from './components/ModelValidationView';
import { useTelemetry } from './hooks/useTelemetry';
import type { NavSection, InspectionResult } from './utils/types';

function App() {
  const {
    telemetry,
    history,
    isDemoMode,
    setDemoMode,
    isMonitoring,
    setIsMonitoring,
    scenario,
    setScenario,
    alarms,
    acknowledgeAlarm,
    events,
    connectionStatus
  } = useTelemetry();

  const [currentSection, setCurrentSection] = useState<NavSection>('OVERVIEW');
  const [selectedMetric, setSelectedMetric] = useState<string>('temperature');

  // Inspection Report Export state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportResult, setReportResult] = useState<InspectionResult>({
    classification: 'NORMAL BELT',
    confidence: 98.2,
    severity: 'NORMAL',
    condition: 'Normal belt surface with uniform rubber cover',
    recommendation: 'CONTINUE NORMAL OPERATION',
    source: 'Sample Image',
    explanation: 'AI detected a continuous belt surface pattern with no visible tear or splice abnormality.',
    inspectionId: 'MG-2026-8412',
    timestamp: '16:20:15',
    whyExplanation: 'Nominal rubber surface texture without transverse cord discontinuity.',
    operatorNotes: 'Routine optical belt inspection executed under operating shift. Surface condition documented.'
  });
  const [reportImage, setReportImage] = useState<string>('/static/samples/normal_belt.jpg');

  const handleExportReport = (res?: InspectionResult, img?: string) => {
    if (res) setReportResult(res);
    if (img) setReportImage(img);
    setIsReportOpen(true);
  };

  const unreadAlarms = alarms.filter(a => !a.acknowledged).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8F5] text-[#111827]">
      
      {/* 1. GLOBAL HEADER (Section 3) */}
      <Header
        connectionStatus={connectionStatus}
        lastUpdate={telemetry.lastUpdate}
        isDemoMode={isDemoMode}
        setDemoMode={setDemoMode}
        isMonitoring={isMonitoring}
        setIsMonitoring={setIsMonitoring}
        scenario={scenario}
        setScenario={setScenario}
        onNavigate={setCurrentSection}
        onExportReport={() => handleExportReport()}
        operatorConfidence={telemetry.operatorConfidence}
        operatorConfidenceReason={telemetry.operatorConfidenceReason}
      />

      {/* 2. APP SHELL: Left Vertical Navigation Rail + Main Viewport (Section 3) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Navigation Sidebar (Section 3) */}
        <div className="no-print">
          <NavigationRail
            currentSection={currentSection}
            onSelectSection={setCurrentSection}
            unreadAlarmsCount={unreadAlarms}
          />
        </div>

        {/* Dynamic Main Page Viewport */}
        <main className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-4">
          
          {/* ============================================================== */}
          {/* SECTION 27: MASTER WORKSTATION ARCHITECTURE                    */}
          {/* ============================================================== */}
          {currentSection === 'OVERVIEW' && (
            <>
              {/* ROW 1: TOP TELEMETRY STRIP (Section 5) */}
              <PrimaryKPIStrip telemetry={telemetry} />

              {/* ROW 2: CURRENT MACHINE STORY WITH SCENARIO CONTROLS (Section 6) */}
              <MachineStory
                telemetry={telemetry}
                connectionStatus={connectionStatus}
                isDemoMode={isDemoMode}
                setDemoMode={setDemoMode}
                scenario={scenario}
                setScenario={setScenario}
              />

              {/* ROW 3: DIGITAL TWIN & HEALTH MAP (7 cols) | BELT CONDITION & PROFILE (5 cols) (Sections 7, 8, 9, 10, 30) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-7 space-y-4">
                  <ConveyorDigitalTwin telemetry={telemetry} />
                  <ConveyorHealthMap telemetry={telemetry} />
                </div>
                <div className="lg:col-span-5">
                  <BeltCondition telemetry={telemetry} />
                </div>
              </div>

              {/* ROW 4: LIVE TREND AREA (8 cols) | SYSTEM HEALTH & SENSOR MATRIX (4 cols) (Sections 16, 18, 19) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-8">
                  <LiveTelemetryChart
                    history={history}
                    isDemoMode={isDemoMode}
                    connectionStatus={connectionStatus}
                    selectedMetric={selectedMetric}
                    onSelectMetric={(m) => setSelectedMetric(m)}
                  />
                </div>
                <div className="lg:col-span-4">
                  <SensorHealth
                    telemetry={telemetry}
                    connectionStatus={connectionStatus}
                    isMonitoring={isMonitoring}
                  />
                </div>
              </div>

              {/* ROW 5: AI BELT INSPECTION (YOLO11s Deep Learning Workstation) (Sections 11-14) */}
              <AIInspection onExportReport={handleExportReport} />

              {/* ROW 6: MULTI-SENSOR CONDITION ASSESSMENT (Sensor Corroboration) (Section 15, 42) */}
              <MultiSensorAssessment telemetry={telemetry} />

              {/* ROW 7: PREDICTIVE MAINTENANCE (6 cols) | ALARM CENTER (6 cols) (Sections 17, 20) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-6">
                  <PredictiveMaintenance telemetry={telemetry} />
                </div>
                <div className="lg:col-span-6">
                  <AlarmCenter
                    alarms={alarms}
                    onAcknowledge={acknowledgeAlarm}
                    compact={true}
                  />
                </div>
              </div>

              {/* ROW 8: EVENT TIMELINE (Section 21) */}
              <EventTimeline events={events} />

              {/* ROW 9: SAFETY / OPERATOR CONTROL (Sections 22, 23) */}
              <SafetyControl
                telemetry={telemetry}
                isDemoMode={isDemoMode}
                setDemoMode={setDemoMode}
                scenario={scenario}
                setScenario={setScenario}
              />

              {/* SYSTEM NOTES & REGULATORY DISCLAIMER (Sections 39, 40) */}
              <SystemNotes />
            </>
          )}

          {/* VIEW: BELT INSPECTION FOCUS */}
          {currentSection === 'BELT_INSPECTION' && (
            <div className="space-y-4">
              <PrimaryKPIStrip telemetry={telemetry} />
              <AIInspection onExportReport={handleExportReport} />
              <BeltCondition telemetry={telemetry} />
              <ConveyorDigitalTwin telemetry={telemetry} />
            </div>
          )}

          {/* VIEW: TRENDS & TELEMETRY */}
          {currentSection === 'TRENDS' && (
            <div className="space-y-4">
              <PrimaryKPIStrip telemetry={telemetry} />
              <LiveTelemetryChart
                history={history}
                isDemoMode={isDemoMode}
                connectionStatus={connectionStatus}
                selectedMetric={selectedMetric}
                onSelectMetric={(m) => setSelectedMetric(m)}
              />
              <PredictiveMaintenance telemetry={telemetry} />
            </div>
          )}

          {/* VIEW: ALARMS */}
          {currentSection === 'ALARMS' && (
            <div className="space-y-4">
              <PrimaryKPIStrip telemetry={telemetry} />
              <AlarmCenter
                alarms={alarms}
                onAcknowledge={acknowledgeAlarm}
                compact={false}
              />
              <SafetyControl
                telemetry={telemetry}
                isDemoMode={isDemoMode}
                setDemoMode={setDemoMode}
                scenario={scenario}
                setScenario={setScenario}
              />
            </div>
          )}

          {/* VIEW: EVENTS TIMELINE */}
          {currentSection === 'EVENTS' && (
            <div className="space-y-4">
              <PrimaryKPIStrip telemetry={telemetry} />
              <EventTimeline events={events} />
            </div>
          )}

          {/* VIEW: SYSTEM & SENSOR HEALTH */}
          {currentSection === 'SYSTEM' && (
            <div className="space-y-4">
              <PrimaryKPIStrip telemetry={telemetry} />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-6">
                  <SensorHealth
                    telemetry={telemetry}
                    connectionStatus={connectionStatus}
                    isMonitoring={isMonitoring}
                  />
                </div>
                <div className="lg:col-span-6">
                  <EquipmentHealth telemetry={telemetry} />
                </div>
              </div>
              <SystemNotes />
            </div>
          )}

          {/* VIEW: DIGITAL INSPECTION REPORT */}
          {currentSection === 'REPORTS' && (
            <div className="space-y-4">
              <ReportsView
                telemetry={telemetry}
                latestInspection={reportResult}
                latestImageSrc={reportImage}
                events={events}
              />
            </div>
          )}

          {/* VIEW: AI MODEL VALIDATION & COMPARISON ENGINE (Section 13) */}
          {currentSection === 'MODEL_VALIDATION' && (
            <div className="space-y-4">
              <PrimaryKPIStrip telemetry={telemetry} />
              <ModelValidationView activeModelName="MineGuard YOLO11s" />
              <AIInspection onExportReport={handleExportReport} />
            </div>
          )}

        </main>
      </div>

      {/* 3. INDUSTRIAL HMI FOOTER (Section 34) */}
      <footer className="w-full bg-[#FFFFFF] border-t border-[#E5E7EB] px-4 py-2.5 flex flex-wrap items-center justify-between text-xs tech-mono text-[#6B7280] z-30 no-print shadow-xs">
        <div className="flex items-center gap-3">
          <span className="font-black text-[#111827]">MINEGUARD AI</span>
          <span className="text-[#D1D5DB]">|</span>
          <span className="font-bold text-[#087F5B]">SIH 26008</span>
          <span className="text-[#D1D5DB]">|</span>
          <span>Station C-01 Tabletop Conveyor Monitoring</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563] text-[10px] font-bold">
            PROTOTYPE DEMONSTRATION
          </span>
          <span className="text-[#D1D5DB]">•</span>
          <span>Safety architecture informed by ISO 12100 & ISO 13850 principles</span>
        </div>
      </footer>

      {/* 4. INSPECTION REPORT MODAL */}
      <InspectionReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        result={reportResult}
        imageSrc={reportImage}
      />

    </div>
  );
}

export default App;
