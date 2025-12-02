import React, { useState, useEffect, useMemo } from 'react';
import { AVAILABLE_SCRIPTS } from './constants';
import { ExecutionStatus, LogEntry } from './types';
import { Icon } from './components/Icon';
import { TerminalOutput } from './components/TerminalOutput';
import { executeScript } from './services/geminiService';

const App: React.FC = () => {
  const [selectedScriptId, setSelectedScriptId] = useState<string>(AVAILABLE_SCRIPTS[0].id);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Theme state with lazy initialization
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const selectedScript = AVAILABLE_SCRIPTS.find(s => s.id === selectedScriptId);

  // Apply theme class to html element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const filteredScripts = useMemo(() => {
    return AVAILABLE_SCRIPTS.filter(script => 
      script.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      script.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  useEffect(() => {
    if (process.env.API_KEY) {
      setHasApiKey(true);
    }
  }, []);

  useEffect(() => {
    // Initialize defaults
    const defaults: Record<string, any> = {};
    if (selectedScript) {
      selectedScript.fields.forEach(f => {
        if (f.defaultValue !== undefined) {
          defaults[f.key] = f.defaultValue;
        }
      });
    }
    setFormValues(defaults);
    setStatus(ExecutionStatus.IDLE);
    setLogs([]);
  }, [selectedScriptId]);

  const handleInputChange = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const isFormValid = useMemo(() => {
    if (!selectedScript) return false;
    return selectedScript.fields.every(field => {
      if (field.required) {
        const value = formValues[field.key];
        return value !== undefined && value !== null && String(value).trim().length > 0;
      }
      return true;
    });
  }, [selectedScript, formValues]);

  const handleExecution = async (isDryRun: boolean) => {
    if (!selectedScript || !isFormValid) return;
    
    setLoading(true);
    setLogs([]); 
    
    if (isDryRun) {
      setStatus(ExecutionStatus.RUNNING_DRY);
    } else {
      setStatus(ExecutionStatus.RUNNING_EXEC);
    }

    await new Promise(r => setTimeout(r, 600));

    // Execute script via service (constructs command -> calls backend/simulates)
    const newLogs = await executeScript(selectedScript, formValues, isDryRun);
    
    // Simulate streaming output for realism
    for (let i = 0; i < newLogs.length; i++) {
        const delay = Math.random() * 40 + 5; 
        await new Promise(r => setTimeout(r, delay));
        setLogs(prev => [...prev, newLogs[i]]);
    }

    setLoading(false);
    const hasError = newLogs.some(l => l.level === 'ERROR');
    
    if (isDryRun) {
        setStatus(hasError ? ExecutionStatus.DRY_FAILED : ExecutionStatus.DRY_SUCCESS);
    } else {
        setStatus(hasError ? ExecutionStatus.EXEC_FAILED : ExecutionStatus.EXEC_SUCCESS);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-lg shadow-xl max-w-md w-full text-center border border-neutral-200 dark:border-neutral-800">
           <div className="mx-auto w-12 h-12 bg-ruby-100 dark:bg-ruby-900/30 text-ruby-600 dark:text-ruby-400 rounded-full flex items-center justify-center mb-4">
             <Icon name="AlertTriangle" size={24} />
           </div>
           <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Missing API Key</h2>
           <p className="text-neutral-600 dark:text-neutral-400 mb-4">
             Please configure the <code>API_KEY</code> environment variable.
           </p>
        </div>
      </div>
    );
  }

  const isHighRisk = selectedScript?.dangerLevel === 'high' || selectedScript?.dangerLevel === 'medium';
  const showRiskWarning = isHighRisk && (status === ExecutionStatus.IDLE || status === ExecutionStatus.DRY_FAILED);

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 font-sans overflow-hidden transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className="w-72 bg-neutral-100 dark:bg-neutral-900 flex flex-col shrink-0 border-r border-neutral-200 dark:border-neutral-800 z-10 transition-colors duration-300">
        <div className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-neutral-900 dark:text-white">
              <div className="w-8 h-8 bg-ruby-600 rounded-md flex items-center justify-center shadow-lg shadow-ruby-900/20">
                 <Icon name="Terminal" size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-neutral-800 dark:text-neutral-100">OpsRunner</span>
            </div>
            
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-neutral-500 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Icon name="Sun" size={18} /> : <Icon name="Moon" size={18} />}
            </button>
          </div>

          <div className="relative group">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search scripts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 text-sm rounded-md pl-9 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 focus:border-gold-500 dark:focus:border-gold-500 focus:ring-1 focus:ring-gold-500 dark:focus:ring-gold-500 outline-none placeholder-neutral-400 dark:placeholder-neutral-600 transition-all shadow-sm"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
          {filteredScripts.length === 0 && (
            <div className="px-4 py-8 text-center text-neutral-500 text-sm">
              No scripts found.
            </div>
          )}
          
          {filteredScripts.map(script => (
            <button
              key={script.id}
              onClick={() => setSelectedScriptId(script.id)}
              className={`w-full text-left px-3 py-3 flex items-start gap-3 rounded-md transition-all duration-200 group relative border
                ${selectedScriptId === script.id 
                  ? 'bg-white dark:bg-white/5 border-ruby-200 dark:border-ruby-900/30 shadow-sm' 
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200'}
              `}
            >
              {selectedScriptId === script.id && (
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-ruby-600 rounded-r-full shadow-[0_0_10px_rgba(225,29,72,0.4)]" />
              )}
              <Icon 
                name={script.icon} 
                size={20} 
                className={`mt-0.5 ml-1 ${selectedScriptId === script.id ? 'text-ruby-600 dark:text-ruby-500' : 'text-neutral-400 group-hover:text-neutral-500 dark:text-neutral-500 dark:group-hover:text-neutral-400'}`} 
              />
              <div>
                <div className={`text-sm font-medium leading-tight ${selectedScriptId === script.id ? 'text-ruby-900 dark:text-ruby-100' : ''}`}>{script.name}</div>
                <div className={`text-[11px] mt-1 line-clamp-1 ${selectedScriptId === script.id ? 'text-ruby-700/70 dark:text-ruby-300/70' : 'text-neutral-400 dark:text-neutral-600'}`}>
                  {script.category}
                </div>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-950 transition-colors duration-300">
        
        {/* Main Header */}
        <header className="px-8 py-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0 transition-colors duration-300">
          <div className="max-w-7xl mx-auto w-full">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
              {selectedScript?.name}
              {selectedScript?.dangerLevel === 'high' && (
                <span className="text-xs font-bold px-2.5 py-1 rounded border border-ruby-200 dark:border-ruby-900/50 bg-ruby-50 dark:bg-ruby-900/20 text-ruby-700 dark:text-ruby-400 uppercase tracking-wide">
                  High Risk
                </span>
              )}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-base leading-relaxed max-w-3xl">
              {selectedScript?.description}
            </p>
          </div>
        </header>

        {/* Content Split: Form & Console */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Config Area */}
          <div className="flex-1 overflow-y-auto p-8 lg:border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/30 transition-colors duration-300">
            <div className="max-w-2xl mx-auto space-y-8">
              
              {/* Dynamic Form */}
              <div className="space-y-6">
                {selectedScript?.fields.map(field => (
                  <div key={field.key}>
                    
                    {field.type === 'boolean' ? (
                       <div className="flex items-center justify-between py-3 px-1 border border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900/50 -mx-1 rounded-lg transition-colors">
                          <div className="flex flex-col px-1">
                             <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer" onClick={() => handleInputChange(field.key, !formValues[field.key])}>
                                {field.label}
                             </label>
                             {field.helperText && (
                               <span className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">{field.helperText}</span>
                             )}
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={formValues[field.key] || false}
                            onClick={() => handleInputChange(field.key, !formValues[field.key])}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${formValues[field.key] ? 'bg-ruby-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formValues[field.key] ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                          </button>
                       </div>
                    ) : field.type === 'textarea' ? (
                      <>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                          {field.label} {field.required && <span className="text-ruby-500">*</span>}
                        </label>
                        <textarea
                          className={`block w-full rounded-md border py-2.5 px-3 shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600 transition-colors font-mono min-h-[80px] max-h-[300px] resize-y
                            ${formValues[field.key] ? 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100' : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100'}`}
                          placeholder={field.placeholder}
                          value={formValues[field.key] || field.defaultValue || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          disabled={loading}
                          rows={3}
                          required={field.required}
                        />
                        {field.helperText && (
                          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-500">{field.helperText}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                          {field.label} {field.required && <span className="text-ruby-500">*</span>}
                        </label>
                        {field.type === 'select' ? (
                          <div className="relative">
                            <select
                              className="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-2.5 pl-3 pr-10 text-neutral-900 dark:text-neutral-100 shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm border transition-colors"
                              value={formValues[field.key] || field.defaultValue || ''}
                              onChange={(e) => handleInputChange(field.key, e.target.value)}
                              disabled={loading}
                            >
                              {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <input
                            type={field.type}
                            className={`block w-full rounded-md border py-2.5 px-3 shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600 transition-colors
                                ${formValues[field.key] ? 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100' : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100'}`}
                            placeholder={field.placeholder}
                            value={formValues[field.key] || field.defaultValue || ''}
                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                            disabled={loading}
                            required={field.required}
                          />
                        )}
                        {field.helperText && (
                          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-500">{field.helperText}</p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              <hr className="border-neutral-200 dark:border-neutral-800" />

              {/* Action Buttons */}
              <div className="space-y-4">
                
                {showRiskWarning && (
                  <div className="rounded-md bg-ruby-50 dark:bg-ruby-900/10 p-4 border border-ruby-200 dark:border-ruby-800/30">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Icon name="AlertTriangle" className="h-5 w-5 text-ruby-600 dark:text-ruby-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-ruby-800 dark:text-ruby-300">Dry Run Recommended</h3>
                        <div className="mt-1 text-sm text-ruby-700 dark:text-ruby-400/80">
                          <p>
                            This operation affects production data. Please verify the output with a Dry Run before executing.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => handleExecution(true)}
                    disabled={loading || !isFormValid}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border rounded-lg shadow-sm text-sm font-semibold transition-all
                      ${loading || !isFormValid 
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 border-neutral-200 dark:border-neutral-700 cursor-not-allowed opacity-70' 
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 hover:border-gold-500 dark:hover:border-gold-500 hover:text-gold-700 dark:hover:text-gold-400'}
                    `}
                    title={!isFormValid ? "Please fill in all required fields" : ""}
                  >
                    {loading && status === ExecutionStatus.RUNNING_DRY ? <Icon name="Loader2" className="animate-spin" /> : <Icon name="Search" size={18} />}
                    Dry Run
                  </button>
                  
                  <button
                    onClick={() => handleExecution(false)}
                    disabled={loading || !isFormValid}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white transition-all
                      ${loading || !isFormValid
                        ? 'bg-neutral-400 dark:bg-neutral-600 cursor-not-allowed opacity-70'
                        : 'bg-gradient-to-r from-ruby-600 to-ruby-700 hover:from-ruby-500 hover:to-ruby-600 shadow-ruby-900/30 focus:ring-ruby-500'}
                      focus:outline-none focus:ring-2 focus:ring-offset-2
                    `}
                    title={!isFormValid ? "Please fill in all required fields" : ""}
                  >
                    {loading && status === ExecutionStatus.RUNNING_EXEC ? <Icon name="Loader2" className="animate-spin" /> : <Icon name="Play" size={18} />}
                    Execute
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Console Output Column */}
          <div className="flex-1 lg:flex-[1.2] flex flex-col p-0 lg:p-6 bg-neutral-100 dark:bg-neutral-950/80 min-h-[400px]">
             <div className="flex-1 h-full min-h-0 relative rounded-none lg:rounded-lg overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800">
                <TerminalOutput 
                  logs={logs} 
                  isLoading={loading} 
                  title="Script output"
                />
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;