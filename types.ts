export interface ScriptDef {
  id: string;
  name: string;
  description: string;
  category: 'Jira' | 'Database' | 'Infrastructure' | 'User Management';
  icon: string;
  fields: ScriptField[];
  dangerLevel: 'low' | 'medium' | 'high';
  /** 
   * Function to determine which python file to run based on form values.
   * Enables the "Switch selects corresponding script" logic.
   */
  resolveScriptPath: (values: Record<string, any>) => string;
}

export interface ScriptField {
  key: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea';
  options?: string[]; // For select type
  defaultValue?: string | boolean;
  helperText?: string;
  /** 
   * The CLI flag to use (e.g., "--jql"). 
   * If omitted, this field is considered internal/logic-only and not passed to the script.
   */
  argFlag?: string;
  /**
   * If true, the script cannot be executed unless this field has a value.
   */
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