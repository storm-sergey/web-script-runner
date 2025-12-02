import type { ScriptDef } from './types';

const SCRIPT_ROOT = '/opt/ops-scripts/venv/scripts';

export const AVAILABLE_SCRIPTS: ScriptDef[] = [
  {
    id: 'jira-set-flag-single',
    name: 'Set Closable Flag (Single)',
    description: 'Sets the "Ready to Close" flag on a specific Jira issue by Key.',
    category: 'Jira',
    icon: 'Ticket',
    dangerLevel: 'low',
    resolveScriptPath: (values) => {
      return values.disable_zabbix 
        ? `${SCRIPT_ROOT}/jira_set_flag_with_triggers.py`
        : `${SCRIPT_ROOT}/jira_set_flag_simple.py`;
    },
    fields: [
      {
        key: 'issue_key',
        label: 'Issue Key',
        placeholder: 'OPS-1234',
        type: 'text',
        helperText: 'The unique key of the Jira issue.',
        argFlag: '--issue-key',
        required: true
      },
      {
        key: 'disable_zabbix',
        label: 'Disable Zabbix Triggers',
        type: 'boolean',
        defaultValue: false,
        helperText: 'Selects the specialized script that interacts with Zabbix API.',
      }
    ]
  },
  {
    id: 'jira-set-flag-bulk',
    name: 'Set Closable Flag (Bulk)',
    description: 'Sets the "Ready to Close" flag on all issues matching the JQL query.',
    category: 'Jira',
    icon: 'Ticket',
    dangerLevel: 'medium',
    resolveScriptPath: (values) => {
       return values.disable_zabbix 
        ? `${SCRIPT_ROOT}/jira_bulk_flag_triggers.py`
        : `${SCRIPT_ROOT}/jira_bulk_flag.py`;
    },
    fields: [
      {
        key: 'jql',
        label: 'JQL Query',
        placeholder: 'project = OPS AND status = "In Progress"',
        type: 'textarea',
        helperText: 'Query to select target issues.',
        argFlag: '--jql',
        required: true
      },
      {
        key: 'disable_zabbix',
        label: 'Disable Zabbix Triggers',
        type: 'boolean',
        defaultValue: false,
        helperText: 'Uses the Zabbix-aware script variant.',
      }
    ]
  },
  {
    id: 'jira-close-bulk',
    name: 'Close Issues (Bulk)',
    description: 'Transitions all issues matching the JQL query to CLOSED status.',
    category: 'Jira',
    icon: 'CheckCircle',
    dangerLevel: 'high',
    resolveScriptPath: (values) => {
       return values.disable_zabbix 
        ? `${SCRIPT_ROOT}/jira_close_triggers.py`
        : `${SCRIPT_ROOT}/jira_close_simple.py`;
    },
    fields: [
      {
        key: 'jql',
        label: 'JQL Query',
        placeholder: 'project = OPS AND status = "Ready to Close"',
        type: 'textarea',
        helperText: 'Issues found will be permanently closed.',
        argFlag: '--jql',
        required: true
      },
      {
        key: 'disable_zabbix',
        label: 'Disable Zabbix Triggers',
        type: 'boolean',
        defaultValue: true,
        helperText: 'Recommended: Uses the script that creates maintenance windows.',
      }
    ]
  }
];