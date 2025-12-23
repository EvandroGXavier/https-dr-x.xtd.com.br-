import React, { useState } from 'react';
import { useDebugSystem, DebugLog } from '@/hooks/useDebugSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bug, 
  Download, 
  Trash2, 
  Search, 
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';

const DebugPanel: React.FC = () => {
  const { 
    isEnabled, 
    logs, 
    clearLogs, 
    exportLogs, 
    getFilteredLogs 
  } = useDebugSystem();
  
  const [isVisible, setIsVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<DebugLog['level'] | 'all'>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  if (!isEnabled) return null;

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    
    return matchesSearch && matchesLevel;
  });

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getLevelIcon = (level: DebugLog['level']) => {
    switch (level) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getLevelBadgeVariant = (level: DebugLog['level']) => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warn':
        return 'secondary';
      case 'success':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug ({logs.length})
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh]">
      <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Debug System ({logs.length} logs)
            </CardTitle>
            <div className="flex gap-1">
              <Button
                onClick={exportLogs}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                onClick={clearLogs}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Buscar por componente ou ação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="px-2 py-1 text-xs border rounded"
            >
              <option value="all">Todos</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
            </select>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <div className="space-y-1 p-3">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogs.has(log.id);
                
                return (
                  <div key={log.id} className="text-xs">
                    <div
                      className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleLogExpansion(log.id)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {isExpanded ? 
                          <ChevronDown className="h-3 w-3" /> : 
                          <ChevronRight className="h-3 w-3" />
                        }
                      </div>
                      
                      <div className="flex-shrink-0 mt-0.5">
                        {getLevelIcon(log.level)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={getLevelBadgeVariant(log.level)}
                            className="h-4 text-xs px-1"
                          >
                            {log.level.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{log.component}</span>
                          <span className="text-muted-foreground">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="text-muted-foreground truncate">
                          {log.action}
                        </div>
                        
                        {log.error && (
                          <div className="text-red-500 truncate mt-1">
                            {log.error.message}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="ml-7 mt-2 p-2 bg-muted/30 rounded text-xs">
                        {log.data && (
                          <div className="mb-2">
                            <strong>Data:</strong>
                            <pre className="mt-1 whitespace-pre-wrap break-all">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {log.error && (
                          <div className="mb-2">
                            <strong>Error Details:</strong>
                            <pre className="mt-1 whitespace-pre-wrap break-all text-red-500">
                              {JSON.stringify(log.error, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {log.stack && (
                          <div>
                            <strong>Stack Trace:</strong>
                            <pre className="mt-1 whitespace-pre-wrap break-all text-xs opacity-70">
                              {log.stack}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {filteredLogs.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum log encontrado
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugPanel;