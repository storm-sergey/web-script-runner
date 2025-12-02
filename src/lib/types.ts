export interface ScriptDef {
  id: string;
  name: string;
  description: string;
  category: 'Jira' | 'Database' | 'Infrastructure' | 'User Management';
  icon: string;
  fields: ScriptField[];
  dangerLevel: 'low' | 'medium' | 'high';
  resolveScriptPath: (values: Record<string, any>) => string;
}

export interface ScriptField {
  key: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea';
  options?: string[];
  defaultValue?: string | boolean;
  helperText?: string;
  argFlag?: string; 
  required?: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
}

export enum ExecutionStatus {
  IDLE = 'IDLE',
  RUNNING_DRY = 'RUNNING_DRY',
  DRY_SUCCESS = 'DRY_SUCCESS',
  DRY_FAILED = 'DRY_FAILED',
  RUNNING_EXEC = 'RUNNING_EXEC',
  EXEC_SUCCESS = 'EXEC_SUCCESS',
  EXEC_FAILED = 'EXEC_FAILED',
}