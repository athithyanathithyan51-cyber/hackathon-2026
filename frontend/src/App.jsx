import { useState } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import DashboardLayout from './components/layout/DashboardLayout';
import OverviewSection from './components/sections/OverviewSection';
import CobolAnalysisSection from './components/sections/CobolAnalysisSection';
import BusinessLogicSection from './components/sections/BusinessLogicSection';
import DependenciesRisksSection from './components/sections/DependenciesRisksSection';
import ModernizationReportSection from './components/sections/ModernizationReportSection';

function AppContent() {
  const [activeSection, setActiveSection] = useState('overview');
  const { resetProject } = useProject();

  const handleResetDemo = () => {
    resetProject();
    setActiveSection('overview');
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection onNavigate={setActiveSection} />;

      case 'cobol-analysis':
      case 'code-evidence':
        return <CobolAnalysisSection onNavigate={setActiveSection} />;

      case 'business-logic':
      case 'business-rules':
      case 'adaptive-intelligence':
        return <BusinessLogicSection onNavigate={setActiveSection} />;

      case 'dependencies-risks':
      case 'impact-regression':
      case 'impact-simulator':
      case 'decision-center':
        return <DependenciesRisksSection onNavigate={setActiveSection} />;

      case 'modernization-report':
      case 'modernization-roadmap':
      case 'analysis-history':
        return <ModernizationReportSection onNavigate={setActiveSection} />;

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

export default function App() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}
