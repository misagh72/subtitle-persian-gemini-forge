
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { QualityScore } from '@/utils/translationMemory';
import { BarChart3, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface QualityReportProps {
  scores: QualityScore[];
  isVisible: boolean;
}

const QualityReport: React.FC<QualityReportProps> = ({ scores, isVisible }) => {
  if (!isVisible || scores.length === 0) return null;

  const avgScore = scores.reduce((sum, score) => sum + score.overall, 0) / scores.length;
  const avgFluency = scores.reduce((sum, score) => sum + score.fluency, 0) / scores.length;
  const avgAccuracy = scores.reduce((sum, score) => sum + score.accuracy, 0) / scores.length;
  const avgConsistency = scores.reduce((sum, score) => sum + score.consistency, 0) / scores.length;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, label: 'عالی' };
    if (score >= 75) return { variant: 'secondary' as const, label: 'خوب' };
    return { variant: 'destructive' as const, label: 'نیاز به بهبود' };
  };

  const allSuggestions = scores.flatMap(score => score.suggestions);
  const uniqueSuggestions = [...new Set(allSuggestions)];

  return (
    <Card className="glass-effect hover-glow animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <BarChart3 className="w-5 h-5 text-primary" />
          گزارش کیفیت ترجمه
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>
            {Math.round(avgScore)}/100
          </div>
          <Badge {...getScoreBadge(avgScore)} className="mt-2">
            {getScoreBadge(avgScore).label}
          </Badge>
        </div>

        {/* Detailed Scores */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">روانی ترجمه</span>
              <span className={`text-sm font-medium ${getScoreColor(avgFluency)}`}>
                {Math.round(avgFluency)}%
              </span>
            </div>
            <Progress value={avgFluency} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">دقت ترجمه</span>
              <span className={`text-sm font-medium ${getScoreColor(avgAccuracy)}`}>
                {Math.round(avgAccuracy)}%
              </span>
            </div>
            <Progress value={avgAccuracy} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">انسجام</span>
              <span className={`text-sm font-medium ${getScoreColor(avgConsistency)}`}>
                {Math.round(avgConsistency)}%
              </span>
            </div>
            <Progress value={avgConsistency} className="h-2" />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-muted/20 rounded-lg">
            <div className="text-lg font-semibold text-foreground">{scores.length}</div>
            <div className="text-xs text-muted-foreground">تعداد ترجمه</div>
          </div>
          <div className="p-3 bg-muted/20 rounded-lg">
            <div className="text-lg font-semibold text-foreground">
              {scores.filter(s => s.overall >= 90).length}
            </div>
            <div className="text-xs text-muted-foreground">ترجمه عالی</div>
          </div>
        </div>

        {/* Suggestions */}
        {uniqueSuggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Info className="w-4 h-4" />
              پیشنهادات بهبود
            </h4>
            <div className="space-y-1">
              {uniqueSuggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="w-3 h-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QualityReport;
