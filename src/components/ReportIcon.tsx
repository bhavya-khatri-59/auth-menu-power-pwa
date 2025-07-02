
import React from 'react';
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  Monitor, 
  Shield, 
  TrendingUp,
  Database,
  LineChart
} from 'lucide-react';

// Props interface for the ReportIcon component
interface ReportIconProps {
  iconName: string;        // Name of the icon to display
  className?: string;      // Optional CSS classes for styling
}

/**
 * Icon mapping object - Maps string names to Lucide React icon components
 * This centralized mapping allows for easy icon management and ensures
 * consistent icon usage across the application
 */
const iconMap = {
  BarChart3,    // Bar chart icon for general analytics
  DollarSign,   // Dollar sign for financial reports
  Users,        // Users icon for HR/personnel reports
  Monitor,      // Monitor icon for IT/system reports
  Shield,       // Shield icon for security/compliance reports
  TrendingUp,   // Trending up for performance/growth reports
  Database,     // Database icon for data-related reports
  LineChart,    // Line chart for trend analysis reports
};

/**
 * ReportIcon Component - Renders icons for reports based on string identifiers
 * 
 * This component provides a centralized way to manage and display icons
 * for different types of reports throughout the application. It maps
 * string identifiers to actual Lucide React icon components.
 * 
 * Key Features:
 * - Dynamic icon rendering based on string identifiers
 * - Fallback to default icon for unknown icon names
 * - Customizable styling through className prop
 * - Type-safe icon mapping with TypeScript
 * - Consistent icon usage across the application
 * 
 * @param iconName - String identifier for the desired icon
 * @param className - Optional CSS classes for custom styling
 * @returns JSX element containing the appropriate icon component
 */
const ReportIcon: React.FC<ReportIconProps> = ({ 
  iconName, 
  className = "department-icon text-primary" 
}) => {
  // Get the icon component from the mapping, with type safety
  const IconComponent = iconMap[iconName as keyof typeof iconMap];
  
  // Fallback to BarChart3 if the requested icon is not found
  if (!IconComponent) {
    return <BarChart3 className={className} />;
  }
  
  // Render the selected icon component with provided styling
  return <IconComponent className={className} />;
};

export default ReportIcon;
