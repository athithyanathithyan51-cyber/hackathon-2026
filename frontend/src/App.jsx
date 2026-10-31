import { useState } from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import OverviewSection from './components/sections/OverviewSection';
import CobolAnalysisSection from './components/sections/CobolAnalysisSection';
import BusinessLogicSection from './components/sections/BusinessLogicSection';
import DependenciesRisksSection from './components/sections/DependenciesRisksSection';
import ModernizationReportSection from './components/sections/ModernizationReportSection';

export default function App() {
  const [activeSection, setActiveSection] = useState('overview');
  const [isReassessed, setIsReassessed] = useState(false);

  const handleResetDemo = () => {
    setIsReassessed(false);
    setActiveSection('overview');
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection
            onNavigate={setActiveSection}
            isReassessed={isReassessed}
          />
        );

      case 'cobol-analysis':
      case 'code-evidence':
        return (
          <CobolAnalysisSection
            onNavigate={setActiveSection}
            isReassessed={isReassessed}
          />
        );

      case 'business-logic':
      case 'business-rules':
      case 'adaptive-intelligence':
        return (
          <BusinessLogicSection
            onNavigate={setActiveSection}
            isReassessed={isReassessed}
            setIsReassessed={setIsReassessed}
          />
        );

      case 'dependencies-risks':
      case 'impact-regression':
      case 'impact-simulator':
      case 'decision-center':
        return (
          <DependenciesRisksSection
            onNavigate={setActiveSection}
            isReassessed={isReassessed}
          />
        );

      case 'modernization-report':
      case 'modernization-roadmap':
      case 'analysis-history':
        return (
          <ModernizationReportSection
            onNavigate={setActiveSection}
            isReassessed={isReassessed}
          />
        );

      default:
        return (
          <OverviewSection
            onNavigate={setActiveSection}
            isReassessed={isReassessed}
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
