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
  const { resetProject, navigateTo } = useProject();

  const handleResetDemo = () => {
    resetProject();
    setActiveSection('overview');
  };

  const handleNavigate = (target, options = {}) => {
    if (typeof target === 'object' && target !== null) {
      navigateTo(target.section, target);
      setActiveSection(target.section);
    } else {
      navigateTo(target, options);
      setActiveSection(target);
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection onNavigate={handleNavigate} />;

      case 'cobol-analysis':
      case 'code-evidence':
        return <CobolAnalysisSection onNavigate={handleNavigate} />;

      case 'business-logic':
      case 'business-rules':
      case 'adaptive-intelligence':
        return <BusinessLogicSection onNavigate={handleNavigate} />;

      case 'dependencies-risks':
      case 'impact-regression':
      case 'impact-simulator':
      case 'decision-center':
        return <DependenciesRisksSection onNavigate={handleNavigate} />;

      case 'modernization-report':
      case 'modernization-roadmap':
      case 'analysis-history':
        return <ModernizationReportSection onNavigate={handleNavigate} />;

      default:
        return <OverviewSection onNavigate={handleNavigate} />;
    }
  };

  return (
    <DashboardLayout
      activeSection={activeSection}
      onSelectSection={handleNavigate}
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
