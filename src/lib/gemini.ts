import { GoogleGenAI } from "@google/genai";
import type { LogEntry, ScriptDef } from "./types";

// Ensure process.env.API_KEY is defined in vite config or .env
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const constructCommand = (scriptDef: ScriptDef, args: Record<string, any>, isDryRun: boolean): string => {
  const pythonPath = "/opt/ops-scripts/venv/bin/python3";
  const scriptPath = scriptDef.resolveScriptPath(args);
  
  let commandParts = [pythonPath, scriptPath];

  scriptDef.fields.forEach(field => {
    if (field.argFlag && args[field.key]) {
      let val = String(args[field.key]);
      if (val.includes(' ')) {
        val = `"${val}"`;
      }
      commandParts.push(`${field.argFlag} ${val}`);
    }
  });

  if (isDryRun) {
    commandParts.push('--dry-run');
  }

  return commandParts.join(' ');
};

export const executeScript = async (
  scriptDef: ScriptDef,
  formValues: Record<string, any>,
  isDryRun: boolean
): Promise<LogEntry[]> => {
  
  const fullCommand = constructCommand(scriptDef, formValues, isDryRun);
  const initialLog: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: `[System] Executing: ${fullCommand}`
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); 

    const response = await fetch('http://localhost:8000/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: fullCommand }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
        const data = await response.json();
        return [initialLog, ...data.logs];
    }
    throw new Error("Backend unavailable");

  } catch (backendError) {
    console.warn("Backend unavailable, using AI simulation.");
    const simulatedLogs = await simulateOutput(fullCommand, scriptDef, isDryRun);
    return [initialLog, ...simulatedLogs];
  }
};

const simulateOutput = async (command: string, scriptDef: ScriptDef, isDryRun: boolean): Promise<LogEntry[]> => {
  const model = "gemini-2.5-flash";
  const shouldFail = Math.random() < 0.2; 
  const mode = isDryRun ? "DRY_RUN" : "LIVE_EXECUTION";

  const prompt = `
    You are a Python script execution engine acting as the STDOUT/STDERR pipe.
    
    COMMAND EXECUTED: 
    ${command}

    CONTEXT:
    Script Description: ${scriptDef.description}
    Mode: ${mode}
    Simulate Failure: ${shouldFail}

    INSTRUCTIONS:
    1. Generate realistic terminal output for this specific command.
    2. If the command includes --jql, invent 3-5 Jira tickets (e.g., OPS-101, OPS-205).
    3. If the command includes --issue-key, handle that specific key.
    4. IF script name includes "triggers", explicitly mention Zabbix Trigger IDs in the logs.
    5. IF script name DOES NOT include "triggers", do not mention Zabbix.
    6. IF --dry-run is present:
       - Prefix actions with [DRY-RUN] or [CHECK].
       - DO NOT simulate "Doing" the action, only "Would do".
    7. Failure Simulation:
       - If Simulate Failure is true, output a Python Traceback compatible with the script logic.
    
    GENERATE RAW TEXT OUTPUT NOW.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const text = response.text || '';
    const lines = text.split('\n');
    
    return lines.map((line) => {
      const isTracebackHeader = line.trim().startsWith('Traceback (most recent call last):');
      const isFileError = line.trim().startsWith('File "');
      const isException = /^[A-Za-z0-9_]+Error:/.test(line);
      
      let level: LogEntry['level'] = 'INFO';
      if (isTracebackHeader || isFileError || isException) {
        level = 'ERROR';
      }

      return {
        timestamp: '',
        level: level,
        message: line
      };
    });
  } catch (error) {
    return [
       { timestamp: '', level: 'ERROR', message: 'Simulation Error: Failed to generate output via Gemini API.' }
    ];
  }
}