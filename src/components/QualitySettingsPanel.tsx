
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, FileCheck, Shield } from 'lucide-react';
import { TranslationQualitySettings } from '@/utils/translationQuality';
import ContextStatsPanel from './ContextStatsPanel';

interface QualitySettingsPanelProps {
  qualitySettings: TranslationQualitySettings;
  onUpdateQualitySettings: (settings: Partial<TranslationQualitySettings>) => void;
  showContextStats?: boolean;
}

const QualitySettingsPanel: React.FC<QualitySettingsPanelProps> = ({
  qualitySettings,
  onUpdateQualitySettings,
  showContextStats = false,
}) => {
  const genreOptions = [
    { value: 'movie', label: 'فیلم سینمایی' },
    { value: 'series', label: 'سریال' },
    { value: 'documentary', label: 'مستند' },
    { value: 'animation', label: 'انیمیشن' },
    { value: 'comedy', label: 'کمدی' },
    { value: 'drama', label: 'درام' },
    { value: 'action', label: 'اکشن' },
  ];

  const formalityOptions = [
    { value: 'formal', label: 'رسمی' },
    { value: 'neutral', label: 'خنثی' },
    { value: 'informal', label: 'غیررسمی' },
  ];

  return (
    <>
    <Card className="glass-effect hover-glow animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Sparkles className="w-5 h-5 text-primary" />
          تنظیمات کیفیت ترجمه
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Genre Selection */}
        <div className="space-y-2">
          <Label className="text-foreground">نوع محتوا</Label>
          <Select 
            value={qualitySettings.genre} 
            onValueChange={(value) => onUpdateQualitySettings({ genre: value as any })}
          >
            <SelectTrigger className="bg-input border-border focus:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {genreOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Formality Level */}
        <div className="space-y-2">
          <Label className="text-foreground">سطح رسمیت</Label>
          <Select 
            value={qualitySettings.formalityLevel} 
            onValueChange={(value) => onUpdateQualitySettings({ formalityLevel: value as any })}
          >
            <SelectTrigger className="bg-input border-border focus:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formalityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quality Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <Label htmlFor="preserve-names" className="text-foreground">
                حفظ نام‌ها
              </Label>
            </div>
            <Switch
              id="preserve-names"
              checked={qualitySettings.preserveNames}
              onCheckedChange={(checked) => onUpdateQualitySettings({ preserveNames: checked })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            نام اشخاص، مکان‌ها و برندها را بدون تغییر حفظ کند
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <Label htmlFor="contextual" className="text-foreground">
                ترجمه زمینه‌ای
              </Label>
            </div>
            <Switch
              id="contextual"
              checked={qualitySettings.contextualTranslation}
              onCheckedChange={(checked) => onUpdateQualitySettings({ contextualTranslation: checked })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            در نظر گیری زمینه و ژانر برای ترجمه بهتر
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-primary" />
              <Label htmlFor="quality-check" className="text-foreground">
                کنترل کیفیت
              </Label>
            </div>
            <Switch
              id="quality-check"
              checked={qualitySettings.qualityCheck}
              onCheckedChange={(checked) => onUpdateQualitySettings({ qualityCheck: checked })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            بررسی خودکار کیفیت و گزارش مسائل احتمالی
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <Label htmlFor="translation-context" className="text-foreground">
                استفاده از context قبلی
              </Label>
            </div>
            <Switch
              id="translation-context"
              checked={qualitySettings.useTranslationContext}
              onCheckedChange={(checked) => onUpdateQualitySettings({ useTranslationContext: checked })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            از ترجمه‌های قبلی برای بهبود کیفیت و consistency استفاده کند
          </p>
        </div>

        {qualitySettings.useTranslationContext && (
          <div className="space-y-3 pl-6 border-l-2 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <Label htmlFor="full-context" className="text-foreground">
                  Full Context Mode
                </Label>
              </div>
              <Switch
                id="full-context"
                checked={qualitySettings.fullContextMode || false}
                onCheckedChange={(checked) => onUpdateQualitySettings({ fullContextMode: checked })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {qualitySettings.fullContextMode 
                ? "🔥 استفاده از همه context (token usage بالا، مدل‌های 128k+ فقط)" 
                : "⚡ استفاده از محدود context (سریع‌تر، token usage کم)"}
            </p>
            
            {qualitySettings.fullContextMode && (
              <div className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/20 p-2 rounded">
                ⚠️ برای مدل‌های با context window بزرگ (128k+ tokens) مناسب است
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    
    {/* Context Statistics Panel */}
    <ContextStatsPanel 
      isVisible={showContextStats && qualitySettings.useTranslationContext}
      fullContextMode={qualitySettings.fullContextMode || false}
      maxContextTokens={qualitySettings.maxContextTokens || 8000}
    />
    </>
  );
};

export default QualitySettingsPanel;
