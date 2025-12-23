import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface DebugLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  component: string;
  action: string;
  data?: any;
  error?: any;
  stack?: string;
}

interface DebugSystemState {
  isEnabled: boolean;
  logs: DebugLog[];
  maxLogs: number;
}

const DEBUG_ENABLED = true; // Alterar para false quando não precisar mais
const MAX_LOGS = 1000;

let globalLogs: DebugLog[] = [];
let logListeners: Array<(logs: DebugLog[]) => void> = [];

const addGlobalLog = (log: DebugLog) => {
  if (!DEBUG_ENABLED) return;
  
  globalLogs.unshift(log);
  if (globalLogs.length > MAX_LOGS) {
    globalLogs = globalLogs.slice(0, MAX_LOGS);
  }
  
  // Notificar todos os listeners
  logListeners.forEach(listener => listener([...globalLogs]));
  
  // Log no console também
  const style = {
    info: 'color: #3b82f6',
    warn: 'color: #f59e0b',
    error: 'color: #ef4444',
    success: 'color: #10b981'
  };
  
  console.log(
    `%c[DEBUG ${log.level.toUpperCase()}] ${log.component} -> ${log.action}`,
    style[log.level],
    log.data,
    log.error
  );
};

export const useDebugSystem = () => {
  const [state, setState] = useState<DebugSystemState>({
    isEnabled: DEBUG_ENABLED,
    logs: [...globalLogs],
    maxLogs: MAX_LOGS
  });
  const { toast } = useToast();
  const logIdCounter = useRef(0);

  useEffect(() => {
    const listener = (logs: DebugLog[]) => {
      setState(prev => ({ ...prev, logs }));
    };
    
    logListeners.push(listener);
    
    return () => {
      logListeners = logListeners.filter(l => l !== listener);
    };
  }, []);

  const log = useCallback((
    level: DebugLog['level'],
    component: string,
    action: string,
    data?: any,
    error?: any
  ) => {
    if (!DEBUG_ENABLED) return;

    const logEntry: DebugLog = {
      id: `${Date.now()}-${logIdCounter.current++}`,
      timestamp: new Date(),
      level,
      component,
      action,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      } : undefined,
      stack: new Error().stack
    };

    addGlobalLog(logEntry);

    // Toast para erros críticos
    if (level === 'error') {
      toast({
        title: `[DEBUG] ${component}`,
        description: `${action}: ${error?.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const logInfo = useCallback((component: string, action: string, data?: any) => {
    log('info', component, action, data);
  }, [log]);

  const logWarn = useCallback((component: string, action: string, data?: any) => {
    log('warn', component, action, data);
  }, [log]);

  const logError = useCallback((component: string, action: string, error?: any, data?: any) => {
    log('error', component, action, data, error);
  }, [log]);

  const logSuccess = useCallback((component: string, action: string, data?: any) => {
    log('success', component, action, data);
  }, [log]);

  const clearLogs = useCallback(() => {
    globalLogs = [];
    setState(prev => ({ ...prev, logs: [] }));
  }, []);

  const exportLogs = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      logs: globalLogs,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const getFilteredLogs = useCallback((
    component?: string,
    level?: DebugLog['level'],
    limit?: number
  ) => {
    let filtered = [...globalLogs];
    
    if (component) {
      filtered = filtered.filter(log => 
        log.component.toLowerCase().includes(component.toLowerCase())
      );
    }
    
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    
    if (limit) {
      filtered = filtered.slice(0, limit);
    }
    
    return filtered;
  }, []);

  return {
    ...state,
    logInfo,
    logWarn,
    logError,
    logSuccess,
    clearLogs,
    exportLogs,
    getFilteredLogs
  };
};

// Hook para componentes que só precisam logar
export const useDebugLogger = (componentName: string) => {
  const { logInfo, logWarn, logError, logSuccess } = useDebugSystem();

  return {
    logInfo: useCallback((action: string, data?: any) => 
      logInfo(componentName, action, data), [logInfo, componentName]),
    
    logWarn: useCallback((action: string, data?: any) => 
      logWarn(componentName, action, data), [logWarn, componentName]),
    
    logError: useCallback((action: string, error?: any, data?: any) => 
      logError(componentName, action, error, data), [logError, componentName]),
    
    logSuccess: useCallback((action: string, data?: any) => 
      logSuccess(componentName, action, data), [logSuccess, componentName])
  };
};