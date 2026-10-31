import { useState } from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import OverviewSection from './components/sections/OverviewSection';
import CodeEvidenceSection from './components/sections/CodeEvidenceSection';
import AdaptiveIntelligenceSection from './components/sections/AdaptiveIntelligenceSection';
import DecisionCenterSection from './components/sections/DecisionCenterSection';
import ImpactSimulatorSection from './components/sections/ImpactSimulatorSection';
import AnalysisHistorySection from './components/sections/AnalysisHistorySection';

export default function App() {
  const [activeSection, setActiveSection] = useState('overview');

  const handleResetDemo = () => {
    setActiveSection('overview');
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection onNavigate={setActiveSection} />;
      case 'code-evidence':
        return <CodeEvidenceSection onNavigate={setActiveSection} />;
      case 'adaptive-intelligence':
        return <AdaptiveIntelligenceSection onNavigate={setActiveSection} />;
      case 'decision-center':
        return <DecisionCenterSection onNavigate={setActiveSection} />;
      case 'impact-simulator':
        return <ImpactSimulatorSection onNavigate={setActiveSection} />;
      case 'analysis-history':
        return <AnalysisHistorySection onNavigate={setActiveSection} />;
      default:
        return <OverviewSection onNavigate={setActiveSection} />;
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
