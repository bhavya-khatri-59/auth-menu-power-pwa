
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

interface ReportIconProps {
  iconName: string;
  className?: string;
}

const iconMap = {
  BarChart3,
  DollarSign,
  Users,
  Monitor,
  Shield,
  TrendingUp,
  Database,
  LineChart,
};

const ReportIcon: React.FC<ReportIconProps> = ({ iconName, className = "department-icon text-primary" }) => {
  const IconComponent = iconMap[iconName as keyof typeof iconMap];
  
  if (!IconComponent) {
    return <BarChart3 className={className} />;
  }
  
  return <IconComponent className={className} />;
};

export default ReportIcon;
