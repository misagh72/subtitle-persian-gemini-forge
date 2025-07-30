import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Database, Trash2, BarChart3 } from 'lucide-react';
import { TranslationContext } from '@/utils/translationContext';
import { TranslationMemory } from '@/utils/translationMemory';

interface ContextStatsPanelProps {
  isVisible: boolean;
  fullContextMode: boolean;
  maxContextTokens: number;
  onClearHistory?: () => void;
}

const ContextStatsPanel: React.FC<ContextStatsPanelProps> = ({
  isVisible,
  fullContextMode,
  maxContextTokens,
  onClearHistory
}) => {
  const [stats, setStats] = useState({
    totalEntries: 0,
    chunks: 0,
    avgEntriesPerChunk: 0,
    memoryEntries: 0
  });

  const [estimatedTokens, setEstimatedTokens] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const historyStats = TranslationContext.getHistoryStats();
      setStats(historyStats);

      // Estimate token usage for current mode
      const sampleTexts = ['Sample text for estimation'];
      const contextOptions = {
        mode: fullContextMode ? 'full' as const : 'limited' as const,
        maxTokens: maxContextTokens,
        maxExamples: 15,
        similarityThreshold: 0.3
      };
      
      const sampleContext = TranslationContext.buildContext(sampleTexts, contextOptions);
      const tokens = TranslationContext.estimateTokens(sampleContext);
      setEstimatedTokens(tokens);
    }
  }, [isVisible, fullContextMode, maxContextTokens]);

  const handleClearHistory = () => {
    TranslationContext.clearHistory();
    TranslationMemory.clearMemory();
    setStats({ totalEntries: 0, chunks: 0, avgEntriesPerChunk: 0, memoryEntries: 0 });
    setEstimatedTokens(0);
    onClearHistory?.();
  };

  if (!isVisible) return null;

  const getTokenUsageColor = (tokens: number) => {
    if (tokens < 2000) return 'text-green-600 dark:text-green-400';
    if (tokens < 5000) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTokenUsageIcon = (tokens: number) => {
    if (tokens < 2000) return '🟢';
    if (tokens < 5000) return '🟡';
    return '🔴';
  };

  return (
    <Card className="glass-effect hover-glow animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <BarChart3 className="w-5 h-5 text-primary" />
          آمار Context و Token
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Context Mode Status */}
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">حالت Context</span>
          </div>
          <Badge variant={fullContextMode ? "destructive" : "secondary"}>
            {fullContextMode ? '🔥 Full Context' : '⚡ Limited Context'}
          </Badge>
        </div>

        {/* Token Usage Estimate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">تخمین Token Usage</span>
            <span className={`text-sm font-bold ${getTokenUsageColor(estimatedTokens)}`}>
              {getTokenUsageIcon(estimatedTokens)} {estimatedTokens.toLocaleString()} tokens
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                estimatedTokens < 2000 ? 'bg-green-500' :
                estimatedTokens < 5000 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min((estimatedTokens / maxContextTokens) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            حداکثر: {maxContextTokens.toLocaleString()} tokens
          </p>
        </div>

        {/* History Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.totalEntries}</div>
            <div className="text-xs text-muted-foreground">Chunk History</div>
          </div>
          <div className="p-3 bg-accent/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.memoryEntries}</div>
            <div className="text-xs text-muted-foreground">Translation Memory</div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Chunks پردازش شده:</span>
            <span className="text-foreground font-medium">{stats.chunks}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">میانگین ترجمه/Chunk:</span>
            <span className="text-foreground font-medium">{stats.avgEntriesPerChunk}</span>
          </div>
        </div>

        {/* Context Mode Explanation */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-xs">
          {fullContextMode ? (
            <div>
              <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                🔥 Full Context Mode
              </div>
              <div className="text-blue-600 dark:text-blue-400">
                • استفاده از همه chunks قبلی<br/>
                • Translation memory کامل<br/>
                • کیفیت بالا، consistency عالی<br/>
                • Token usage بالا - مدل‌های 128k+ فقط
              </div>
            </div>
          ) : (
            <div>
              <div className="font-medium text-green-700 dark:text-green-300 mb-1">
                ⚡ Limited Context Mode
              </div>
              <div className="text-green-600 dark:text-green-400">
                • فقط آخرین chunk + memory محدود<br/>
                • Token usage کم<br/>
                • سرعت بالا<br/>
                • مناسب همه مدل‌ها
              </div>
            </div>
          )}
        </div>

        {/* Clear History Button */}
        {(stats.totalEntries > 0 || stats.memoryEntries > 0) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearHistory}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            پاک کردن تاریخچه
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ContextStatsPanel;