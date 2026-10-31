import { useState } from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import OverviewSection from './components/sections/OverviewSection';
import CodeEvidenceSection from './components/sections/CodeEvidenceSection';
import AdaptiveIntelligenceSection from './components/sections/AdaptiveIntelligenceSection';
import DecisionCenterSection from './components/sections/DecisionCenterSection';
import ImpactSimulatorSection from './components/sections/ImpactSimulatorSection';
import AnalysisHistorySection from './components/sections/AnalysisHistorySection';
import { DEMO_BANKING_FILES, DISCOVERED_FUNCTIONS } from './data/mockBankingData';

export default function App() {
  const [activeSection, setActiveSection] = useState('overview');
  const [files, setFiles] = useState(DEMO_BANKING_FILES);
  const [isAnalyzed, setIsAnalyzed] = useState(true); // Pre-analyzed banking app for smooth demo flow
  const [selectedFunctionId, setSelectedFunctionId] = useState(DISCOVERED_FUNCTIONS[0].id);
  const [stagedIncident, setStagedIncident] = useState(null);
  const [isReassessed, setIsReassessed] = useState(false);

  const handleLoadBankingDemo = () => {
    setFiles(DEMO_BANKING_FILES);
    setIsAnalyzed(true);
    setSelectedFunctionId(DISCOVERED_FUNCTIONS[0].id);
    setStagedIncident(null);
    setIsReassessed(false);
  };

  const handleResetDemo = () => {
    setFiles(DEMO_BANKING_FILES);
    setIsAnalyzed(true);
    setSelectedFunctionId(DISCOVERED_FUNCTIONS[0].id);
    setStagedIncident(null);
    setIsReassessed(false);
    setActiveSection('overview');
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection
            files={files}
            isAnalyzed={isAnalyzed}
            isReassessed={isReassessed}
            onNavigate={setActiveSection}
            onLoadBankingDemo={handleLoadBankingDemo}
          />
        );
      case 'code-evidence':
        return (
          <CodeEvidenceSection
            files={files}
            setFiles={setFiles}
            isAnalyzed={isAnalyzed}
            setIsAnalyzed={setIsAnalyzed}
            selectedFunctionId={selectedFunctionId}
            setSelectedFunctionId={setSelectedFunctionId}
            onLoadBankingDemo={handleLoadBankingDemo}
            isReassessed={isReassessed}
          />
        );
      case 'adaptive-intelligence':
        return (
          <AdaptiveIntelligenceSection
            isReassessed={isReassessed}
            setIsReassessed={setIsReassessed}
            stagedIncident={stagedIncident}
            setStagedIncident={setStagedIncident}
            onNavigate={setActiveSection}
          />
        );
      case 'decision-center':
        return <DecisionCenterSection onNavigate={setActiveSection} />;
      case 'impact-simulator':
        return <ImpactSimulatorSection onNavigate={setActiveSection} />;
      case 'analysis-history':
        return (
          <AnalysisHistorySection
            isReassessed={isReassessed}
            onNavigate={setActiveSection}
          />
        );
      default:
        return (
          <OverviewSection
            files={files}
            isAnalyzed={isAnalyzed}
            isReassessed={isReassessed}
            onNavigate={setActiveSection}
            onLoadBankingDemo={handleLoadBankingDemo}
          />
        );
    }
  };

  return (
    <DashboardLayout
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      onResetDemo={handleResetDemo}
    >
      {renderActiveSection()}
    </DashboardLayout>
  );
}
