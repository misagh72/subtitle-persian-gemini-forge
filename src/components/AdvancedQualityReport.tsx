import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, TrendingUp, Brain, Heart, Target, Repeat } from 'lucide-react';
import type { AdvancedQualityReport as AdvancedQualityReportType } from '@/utils/enhancedTranslatorV2';

interface AdvancedQualityReportProps {
  report: AdvancedQualityReportType | null;
  isVisible: boolean;
  onClose: () => void;
}

const AdvancedQualityReport: React.FC<AdvancedQualityReportProps> = ({
  report,
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isVisible || !report) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="glass-effect hover-glow animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            گزارش کیفیت پیشرفته
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getScoreBadgeVariant(report.overallScore)} className="text-sm">
              {Math.round(report.overallScore)}/100
            </Badge>
            <Button variant="outline" size="sm" onClick={onClose}>
              بستن
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">خلاصه</TabsTrigger>
            <TabsTrigger value="patterns">الگوها</TabsTrigger>
            <TabsTrigger value="grammar">گرامر</TabsTrigger>
            <TabsTrigger value="coherence">انسجام</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span className="text-sm">انسجام احساسی</span>
                  </div>
                  <span className={`text-sm font-medium ${getScoreColor(report.sentimentConsistency)}`}>
                    {Math.round(report.sentimentConsistency)}%
                  </span>
                </div>
                <Progress value={report.sentimentConsistency} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">انسجام کلی</span>
                  </div>
                  <span className={`text-sm font-medium ${getScoreColor(report.coherenceCheck.consistency)}`}>
                    {Math.round(report.coherenceCheck.consistency)}%
                  </span>
                </div>
                <Progress value={report.coherenceCheck.consistency} className="h-2" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <Repeat className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold text-foreground">{report.patterns.length}</div>
                <div className="text-xs text-muted-foreground">الگوی مکرر</div>
              </div>

              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold text-foreground">{report.grammarIssues.length}</div>
                <div className="text-xs text-muted-foreground">مسئله گرامری</div>
              </div>

              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-foreground">
                  {report.coherenceCheck.suggestions.length}
                </div>
                <div className="text-xs text-muted-foreground">پیشنهاد بهبود</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                خلاصه گزارش
              </h4>
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                {report.detailedReport}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Repeat className="w-4 h-4 text-purple-500" />
              <span className="font-medium">الگوهای مکرر شناسایی شده</span>
            </div>
            
            {report.patterns.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                هیچ الگوی مکرری شناسایی نشد
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {report.patterns.map((pattern, index) => (
                  <div key={index} className="p-3 bg-muted/20 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">"{pattern.pattern}"</span>
                      <Badge variant="outline" className="text-xs">
                        {pattern.frequency} بار
                      </Badge>
                    </div>
                    {pattern.translations.size > 0 && (
                      <div className="text-xs text-muted-foreground">
                        ترجمه‌ها: {Array.from(pattern.translations.keys()).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="grammar" className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="font-medium">مسائل گرامری</span>
            </div>
            
            {report.grammarIssues.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                هیچ مسئله گرامری شناسایی نشد
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {report.grammarIssues.map((issue, index) => (
                  <div key={index} className="p-3 bg-muted/20 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <Badge 
                        variant={issue.severity === 'high' ? 'destructive' : 
                               issue.severity === 'medium' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {issue.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {issue.severity === 'high' ? 'بالا' : 
                         issue.severity === 'medium' ? 'متوسط' : 'پایین'}
                      </Badge>
                    </div>
                    <div className="text-sm text-foreground">
                      {issue.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="coherence" className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="font-medium">تحلیل انسجام</span>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">امتیاز انسجام کلی</span>
                  <span className={`text-lg font-bold ${getScoreColor(report.coherenceCheck.consistency)}`}>
                    {Math.round(report.coherenceCheck.consistency)}%
                  </span>
                </div>
                <Progress value={report.coherenceCheck.consistency} className="h-2" />
              </div>

              {report.coherenceCheck.terminologyIssues.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-orange-600">مسائل اصطلاحات</h4>
                  <div className="space-y-2">
                    {report.coherenceCheck.terminologyIssues.slice(0, 3).map((issue, index) => (
                      <div key={index} className="text-sm p-2 bg-orange-50/50 rounded text-orange-800">
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.coherenceCheck.styleIssues.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-blue-600">مسائل سبک</h4>
                  <div className="space-y-2">
                    {report.coherenceCheck.styleIssues.slice(0, 3).map((issue, index) => (
                      <div key={index} className="text-sm p-2 bg-blue-50/50 rounded text-blue-800">
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.coherenceCheck.suggestions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-green-600">پیشنهادات بهبود</h4>
                  <div className="space-y-2">
                    {report.coherenceCheck.suggestions.slice(0, 5).map((suggestion, index) => (
                      <div key={index} className="text-sm p-2 bg-green-50/50 rounded text-green-800 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdvancedQualityReport;
