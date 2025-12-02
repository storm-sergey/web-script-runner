<script lang="ts">
  import type { LogEntry } from '../types';
  import { afterUpdate } from 'svelte';

  export let logs: LogEntry[] = [];
  export let isLoading: boolean = false;
  export let title: string = "Script output";

  let endRef: HTMLDivElement;

  // Auto-scroll to bottom when logs update
  afterUpdate(() => {
    if (endRef) {
      endRef.scrollIntoView({ behavior: 'smooth' });
    }
  });

  function getTextColor(log: LogEntry): string {
    const isTracebackHeader = log.message.startsWith('Traceback');
    const isFileRef = log.message.trim().startsWith('File "');
    const isException = log.level === 'ERROR' && !isFileRef && !isTracebackHeader;
    
    // Default text
    let textColorClass = 'text-neutral-700 dark:text-neutral-400';
    
    // Errors are RUBY
    if (isTracebackHeader || isFileRef) textColorClass = 'text-ruby-600 dark:text-ruby-400';
    if (isException) textColorClass = 'text-ruby-700 dark:text-ruby-300 font-bold';
    
    // Success indicators - Gold or Bright White
    const isSuccessAction = log.message.toLowerCase().includes('success') || log.message.startsWith('Closed') || log.message.startsWith('Set flag');
    if (isSuccessAction && log.level !== 'ERROR') textColorClass = 'text-gold-600 dark:text-gold-400 font-semibold';

    return textColorClass;
  }
</script>

<div class="flex flex-col h-full rounded-none lg:rounded-lg overflow-hidden font-mono text-sm bg-white dark:bg-neutral-950 transition-colors duration-300 shadow-inner">
  <div class="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
    <span class="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
      {title}
    </span>
    <div class="flex gap-1.5">
      <div class="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700"></div>
      <div class="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700"></div>
      <div class="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700"></div>
    </div>
  </div>
  
  <div class="flex-1 p-4 overflow-y-auto custom-scrollbar bg-white dark:bg-[#09090b]">
    {#if logs.length === 0 && !isLoading}
      <div class="text-neutral-400 dark:text-neutral-600 italic select-none text-xs font-sans">
        Ready to execute. Waiting for input...
      </div>
    {/if}
    
    <div class="flex flex-col">
      {#each logs as log}
        <div class={`font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-all ${getTextColor(log)}`}>
           {log.message}
        </div>
      {/each}
    </div>
    
    {#if isLoading}
      <div class="flex items-center gap-2 text-gold-600 dark:text-gold-500 mt-2">
        <span class="animate-pulse">_</span>
      </div>
    {/if}
    <div bind:this={endRef} />
  </div>
</div>