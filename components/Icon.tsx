import React from 'react';
import { 
  Ticket, 
  Database, 
  Server, 
  MessageSquare, 
  Play, 
  ShieldAlert, 
  Terminal, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Moon,
  Sun
} from 'lucide-react';

const icons: Record<string, React.ElementType> = {
  Ticket,
  Database,
  Server,
  MessageSquare,
  Play,
  ShieldAlert,
  Terminal,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Moon,
  Sun
};

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export const Icon: React.FC<IconProps> = ({ name, className, size = 20 }) => {
  const IconComponent = icons[name] || Terminal;
  return <IconComponent className={className} size={size} />;
};