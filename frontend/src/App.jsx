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
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [selectedFunctionId, setSelectedFunctionId] = useState(DISCOVERED_FUNCTIONS[0].id);

  const handleLoadBankingDemo = () => {
    setFiles(DEMO_BANKING_FILES);
    setIsAnalyzed(false);
    setSelectedFunctionId(DISCOVERED_FUNCTIONS[0].id);
  };

  const handleResetDemo = () => {
    setFiles(DEMO_BANKING_FILES);
    setIsAnalyzed(false);
    setSelectedFunctionId(DISCOVERED_FUNCTIONS[0].id);
    setActiveSection('overview');
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection
            files={files}
            isAnalyzed={isAnalyzed}
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
          />
        );
      case 'adaptive-intelligence':
        return <AdaptiveIntelligenceSection onNavigate={setActiveSection} />;
      case 'decision-center':
        return <DecisionCenterSection onNavigate={setActiveSection} />;
      case 'impact-simulator':
        return <ImpactSimulatorSection onNavigate={setActiveSection} />;
      case 'analysis-history':
        return <AnalysisHistorySection onNavigate={setActiveSection} />;
      default:
        return (
          <OverviewSection
            files={files}
            isAnalyzed={isAnalyzed}
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
