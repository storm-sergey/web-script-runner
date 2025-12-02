import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalOutputProps {
  logs: LogEntry[];
  isLoading: boolean;
  title?: string;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({ logs, isLoading, title = "Script output" }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full rounded-none lg:rounded-lg overflow-hidden font-mono text-sm bg-white dark:bg-neutral-950 transition-colors duration-300 shadow-inner">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <span className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
          {title}
        </span>
        {/* Decorative dots removed as requested */}
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-white dark:bg-[#09090b]">
        {logs.length === 0 && !isLoading && (
          <div className="text-neutral-400 dark:text-neutral-600 italic select-none text-xs font-sans">
            Ready to execute. Waiting for input...
          </div>
        )}
        
        <div className="flex flex-col">
          {logs.map((log, idx) => {
            const isTracebackHeader = log.message.startsWith('Traceback');
            const isFileRef = log.message.trim().startsWith('File "');
            const isException = log.level === 'ERROR' && !isFileRef && !isTracebackHeader;
            
            // Text Color Logic (Neutral/Ruby/Gold)
            // Default text is neutral-700 / neutral-400
            let textColorClass = 'text-neutral-700 dark:text-neutral-400';
            
            // Errors are RUBY
            if (isTracebackHeader || isFileRef) textColorClass = 'text-ruby-600 dark:text-ruby-400';
            if (isException) textColorClass = 'text-ruby-700 dark:text-ruby-300 font-bold';
            
            // Success indicators - GOLD
            const isSuccessAction = log.message.toLowerCase().includes('success') || log.message.includes('Done') || log.message.startsWith('Closed') || log.message.startsWith('Set flag');
            if (isSuccessAction && log.level !== 'ERROR') textColorClass = 'text-gold-600 dark:text-gold-400 font-semibold';

            return (
              <div key={idx} className={`font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-all ${textColorClass}`}>
                 {log.message}
              </div>
            );
          })}
        </div>
        
        {isLoading && (
          <div className="flex items-center gap-2 text-gold-600 dark:text-gold-500 mt-2">
            <span className="animate-pulse">_</span>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};