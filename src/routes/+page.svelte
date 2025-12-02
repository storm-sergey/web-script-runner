<script lang="ts">
  import { onMount } from 'svelte';
  import { AVAILABLE_SCRIPTS } from '$lib/constants';
  import { ExecutionStatus, type LogEntry, type ScriptDef } from '$lib/types';
  import Icon from '$lib/components/Icon.svelte';
  import TerminalOutput from '$lib/components/TerminalOutput.svelte';
  import { executeScript } from '$lib/gemini';

  // State
  let selectedScriptId = AVAILABLE_SCRIPTS[0].id;
  let formValues: Record<string, any> = {};
  let status = ExecutionStatus.IDLE;
  let logs: LogEntry[] = [];
  let loading = false;
  let hasApiKey = false;
  let searchQuery = '';
  let theme: 'light' | 'dark' = 'dark';

  // Reactive Values
  $: selectedScript = AVAILABLE_SCRIPTS.find(s => s.id === selectedScriptId) as ScriptDef;
  
  $: filteredScripts = AVAILABLE_SCRIPTS.filter(script => 
    script.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    script.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  $: isHighRisk = selectedScript?.dangerLevel === 'high' || selectedScript?.dangerLevel === 'medium';
  $: showRiskWarning = isHighRisk && (status === ExecutionStatus.IDLE || status === ExecutionStatus.DRY_FAILED);

  // Form Validation Logic
  $: isFormValid = (() => {
    if (!selectedScript) return false;
    return selectedScript.fields.every(field => {
      if (field.required) {
        const value = formValues[field.key];
        return value !== undefined && value !== null && String(value).trim().length > 0;
      }
      return true;
    });
  })();

  onMount(() => {
    // Check for API Key
    if (process.env.API_KEY) {
      hasApiKey = true;
    }

    // Theme initialization
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      theme = saved;
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    }
    updateThemeClass();
  });

  $: if (selectedScript) {
    const defaults: Record<string, any> = {};
    selectedScript.fields.forEach(f => {
      if (f.defaultValue !== undefined) {
        defaults[f.key] = f.defaultValue;
      }
    });
    formValues = defaults;
    status = ExecutionStatus.IDLE;
    logs = [];
  }

  function updateThemeClass() {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    updateThemeClass();
  }

  function handleInputChange(key: string, value: any) {
    formValues = { ...formValues, [key]: value };
  }

  async function handleExecution(isDryRun: boolean) {
    if (!selectedScript || !isFormValid) return;
    
    loading = true;
    logs = []; 
    status = isDryRun ? ExecutionStatus.RUNNING_DRY : ExecutionStatus.RUNNING_EXEC;

    await new Promise(r => setTimeout(r, 600));

    const newLogs = await executeScript(selectedScript, formValues, isDryRun);
    
    for (let i = 0; i < newLogs.length; i++) {
        const delay = Math.random() * 40 + 5; 
        await new Promise(r => setTimeout(r, delay));
        logs = [...logs, newLogs[i]];
    }

    loading = false;
    const hasError = newLogs.some(l => l.level === 'ERROR');
    
    if (isDryRun) {
        status = hasError ? ExecutionStatus.DRY_FAILED : ExecutionStatus.DRY_SUCCESS;
    } else {
        status = hasError ? ExecutionStatus.EXEC_FAILED : ExecutionStatus.EXEC_SUCCESS;
    }
  }
</script>

{#if !hasApiKey}
  <div class="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
    <div class="bg-white dark:bg-neutral-900 p-8 rounded-lg shadow-xl max-w-md w-full text-center border border-neutral-200 dark:border-neutral-800">
        <div class="mx-auto w-12 h-12 bg-ruby-100 dark:bg-ruby-900/30 text-ruby-600 dark:text-ruby-400 rounded-full flex items-center justify-center mb-4">
          <Icon name="AlertTriangle" size={24} />
        </div>
        <h2 class="text-xl font-bold text-neutral-900 dark:text-white mb-2">Missing API Key</h2>
        <p class="text-neutral-600 dark:text-neutral-400 mb-4">
          Please configure the <code>API_KEY</code> environment variable.
        </p>
    </div>
  </div>
{:else}
  <div class="flex h-screen bg-neutral-50 dark:bg-neutral-950 font-sans overflow-hidden transition-colors duration-300">
    
    <!-- Sidebar -->
    <aside class="w-72 bg-neutral-100 dark:bg-neutral-900 flex flex-col shrink-0 border-r border-neutral-200 dark:border-neutral-800 z-10 transition-colors duration-300">
      <div class="p-5">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3 text-neutral-900 dark:text-white">
            <div class="w-8 h-8 bg-ruby-600 rounded-md flex items-center justify-center shadow-lg shadow-ruby-900/20">
                <Icon name="Terminal" size={18} className="text-white" />
            </div>
            <span class="font-bold text-lg tracking-tight text-neutral-800 dark:text-neutral-100">OpsRunner</span>
          </div>
          
          <button 
            on:click={toggleTheme}
            class="p-2 rounded-full text-neutral-500 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
            title="Toggle Theme"
          >
            {#if theme === 'dark'}
              <Icon name="Sun" size={18} />
            {:else}
              <Icon name="Moon" size={18} />
            {/if}
          </button>
        </div>

        <div class="relative group">
          <div class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none">
             <Icon name="Search" size={16} />
          </div>
          <input 
            type="text" 
            placeholder="Search scripts..." 
            bind:value={searchQuery}
            class="w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 text-sm rounded-md pl-9 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 focus:border-gold-500 dark:focus:border-gold-500 focus:ring-1 focus:ring-gold-500 dark:focus:ring-gold-500 outline-none placeholder-neutral-400 dark:placeholder-neutral-600 transition-all shadow-sm"
          />
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
        {#if filteredScripts.length === 0}
          <div class="px-4 py-8 text-center text-neutral-500 text-sm">
            No scripts found.
          </div>
        {/if}
        
        {#each filteredScripts as script (script.id)}
          <button
            on:click={() => selectedScriptId = script.id}
            class={`w-full text-left px-3 py-3 flex items-start gap-3 rounded-md transition-all duration-200 group relative border
              ${selectedScriptId === script.id 
                ? 'bg-white dark:bg-white/5 border-ruby-200 dark:border-ruby-900/30 shadow-sm' 
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200'}
            `}
          >
            {#if selectedScriptId === script.id}
              <!-- Active Indicator -->
              <div class="absolute left-0 top-3 bottom-3 w-1 bg-ruby-600 rounded-r-full shadow-[0_0_10px_rgba(225,29,72,0.4)]" />
            {/if}
            
            <div class={`mt-0.5 ml-1 ${selectedScriptId === script.id ? 'text-ruby-600 dark:text-ruby-500' : 'text-neutral-400 group-hover:text-neutral-500 dark:text-neutral-500 dark:group-hover:text-neutral-400'}`}>
                <Icon name={script.icon} size={20} />
            </div>

            <div>
              <div class={`text-sm font-medium leading-tight ${selectedScriptId === script.id ? 'text-ruby-900 dark:text-ruby-100' : ''}`}>{script.name}</div>
              <div class={`text-[11px] mt-1 line-clamp-1 ${selectedScriptId === script.id ? 'text-ruby-700/70 dark:text-ruby-300/70' : 'text-neutral-400 dark:text-neutral-600'}`}>
                {script.category}
              </div>
            </div>
          </button>
        {/each}
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-950 transition-colors duration-300">
      
      <!-- Main Header -->
      <header class="px-8 py-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0 transition-colors duration-300">
        <div class="max-w-7xl mx-auto w-full">
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
            {selectedScript?.name}
            {#if selectedScript?.dangerLevel === 'high'}
              <span class="text-xs font-bold px-2.5 py-1 rounded border border-ruby-200 dark:border-ruby-900/50 bg-ruby-50 dark:bg-ruby-900/20 text-ruby-700 dark:text-ruby-400 uppercase tracking-wide">
                High Risk
              </span>
            {/if}
          </h1>
          <p class="text-neutral-500 dark:text-neutral-400 mt-2 text-base leading-relaxed max-w-3xl">
            {selectedScript?.description}
          </p>
        </div>
      </header>

      <!-- Content Split: Form & Console -->
      <div class="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        <!-- Config Area -->
        <div class="flex-1 overflow-y-auto p-8 lg:border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/30 transition-colors duration-300">
          <div class="max-w-2xl mx-auto space-y-8">
            
            <!-- Dynamic Form -->
            <div class="space-y-6">
              {#each selectedScript?.fields || [] as field}
                <div>
                  {#if field.type === 'boolean'}
                    <div class="flex items-center justify-between py-3 px-1 border border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900/50 -mx-1 rounded-lg transition-colors">
                      <div class="flex flex-col px-1">
                          <label for={field.key} class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                            {field.label}
                          </label>
                          {#if field.helperText}
                            <span class="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">{field.helperText}</span>
                          {/if}
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={formValues[field.key] || false}
                        on:click={() => handleInputChange(field.key, !formValues[field.key])}
                        class={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${formValues[field.key] ? 'bg-ruby-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                      >
                        <span
                          aria-hidden="true"
                          class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formValues[field.key] ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>

                  {:else if field.type === 'textarea'}
                    <label for={field.key} class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      {field.label} {#if field.required}<span class="text-ruby-500">*</span>{/if}
                    </label>
                    <textarea
                      id={field.key}
                      class="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-2.5 px-3 text-neutral-900 dark:text-neutral-100 shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm border placeholder:text-neutral-400 dark:placeholder:text-neutral-600 transition-colors font-mono min-h-[80px] max-h-[300px] resize-y"
                      placeholder={field.placeholder}
                      value={formValues[field.key] || field.defaultValue || ''}
                      on:input={(e) => handleInputChange(field.key, e.currentTarget.value)}
                      disabled={loading}
                      rows={3}
                    />
                    {#if field.helperText}
                      <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-500">{field.helperText}</p>
                    {/if}

                  {:else}
                    <label for={field.key} class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      {field.label} {#if field.required}<span class="text-ruby-500">*</span>{/if}
                    </label>
                    
                    {#if field.type === 'select'}
                      <div class="relative">
                        <select
                          id={field.key}
                          class="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-2.5 pl-3 pr-10 text-neutral-900 dark:text-neutral-100 shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm border transition-colors"
                          value={formValues[field.key] || field.defaultValue || ''}
                          on:change={(e) => handleInputChange(field.key, e.currentTarget.value)}
                          disabled={loading}
                        >
                          {#each field.options || [] as opt}
                            <option value={opt}>{opt}</option>
                          {/each}
                        </select>
                      </div>
                    {:else}
                      <input
                        id={field.key}
                        type={field.type}
                        class="block w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-2.5 px-3 text-neutral-900 dark:text-neutral-100 shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm border placeholder:text-neutral-400 dark:placeholder:text-neutral-600 transition-colors"
                        placeholder={field.placeholder}
                        value={formValues[field.key] || field.defaultValue || ''}
                        on:input={(e) => handleInputChange(field.key, e.currentTarget.value)}
                        disabled={loading}
                      />
                    {/if}
                    
                    {#if field.helperText}
                      <p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-500">{field.helperText}</p>
                    {/if}
                  {/if}
                </div>
              {/each}
            </div>

            <hr class="border-neutral-200 dark:border-neutral-800" />

            <!-- Action Buttons -->
            <div class="space-y-4">
              
              {#if showRiskWarning}
                <div class="rounded-md bg-ruby-50 dark:bg-ruby-900/10 p-4 border border-ruby-200 dark:border-ruby-800/30">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <div class="text-ruby-600 dark:text-ruby-400">
                         <Icon name="AlertTriangle" size={20} />
                      </div>
                    </div>
                    <div class="ml-3">
                      <h3 class="text-sm font-medium text-ruby-800 dark:text-ruby-300">Dry Run Recommended</h3>
                      <div class="mt-1 text-sm text-ruby-700 dark:text-ruby-400/80">
                        <p>
                          This operation affects production data. Please verify the output with a Dry Run before executing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              {/if}

              <div class="flex gap-4 pt-2">
                <!-- Dry Run Button: Neutral with Gold Hover (Secondary) -->
                <button
                  on:click={() => handleExecution(true)}
                  disabled={loading || !isFormValid}
                  class={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border rounded-lg shadow-sm text-sm font-semibold transition-all
                    ${loading || !isFormValid
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 border-neutral-200 dark:border-neutral-700 cursor-not-allowed opacity-70' 
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 hover:border-gold-500 dark:hover:border-gold-500 hover:text-gold-700 dark:hover:text-gold-400'}
                  `}
                  title={!isFormValid ? "Please fill in all required fields" : ""}
                >
                  {#if loading && status === ExecutionStatus.RUNNING_DRY}
                    <div class="animate-spin"><Icon name="Loader2" size={18}/></div>
                  {:else}
                    <Icon name="Search" size={18} />
                  {/if}
                  Dry Run
                </button>
                
                <!-- Execute Button: Ruby (Primary) -->
                <button
                  on:click={() => handleExecution(false)}
                  disabled={loading || !isFormValid}
                  class={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white transition-all
                    ${loading || !isFormValid
                      ? 'bg-neutral-400 dark:bg-neutral-600 cursor-not-allowed opacity-70'
                      : 'bg-gradient-to-r from-ruby-600 to-ruby-700 hover:from-ruby-500 hover:to-ruby-600 shadow-ruby-900/30 focus:ring-ruby-500'}
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                  `}
                  title={!isFormValid ? "Please fill in all required fields" : ""}
                >
                  {#if loading && status === ExecutionStatus.RUNNING_EXEC}
                     <div class="animate-spin"><Icon name="Loader2" size={18}/></div>
                  {:else}
                     <Icon name="Play" size={18} />
                  {/if}
                  Execute
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Console Output Column -->
        <div class="flex-1 lg:flex-[1.2] flex flex-col p-0 lg:p-6 bg-neutral-100 dark:bg-neutral-950/80 min-h-[400px]">
           <div class="flex-1 h-full min-h-0 relative rounded-none lg:rounded-lg overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800">
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
{/if}