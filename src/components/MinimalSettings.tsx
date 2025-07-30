
import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import SettingsPanel from '@/components/SettingsPanel';
import QualitySettingsPanel from '@/components/QualitySettingsPanel';
import QualityReport from '@/components/QualityReport';
import MemoryManagement from '@/components/MemoryManagement';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Add hooks to fetch memory count and clear memory
import { useTranslationState } from '@/hooks/useTranslationState';

interface MinimalSettingsProps {
  settings: any;
  qualitySettings: any;
  updateSettings: (settings: Partial<any>) => void;
  updateQualitySettings: (settings: Partial<any>) => void;
  applyPreset: (preset: any) => void;
  qualityScores: any[];
  showQualityReport: boolean;
  showMemoryManagement: boolean;
}

const MinimalSettings: React.FC<MinimalSettingsProps> = ({
  settings,
  qualitySettings,
  updateSettings,
  updateQualitySettings,
  applyPreset,
  qualityScores,
  showQualityReport,
  showMemoryManagement,
}) => {
  // Use translation state only for clearing memory and showing memory count
  const { clearTranslationMemory, getMemoryCount } = useTranslationState();
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [memoryCount, setMemoryCount] = useState(getMemoryCount());
  const { toast } = useToast();

  // Watch memory count and update on demand (refresh on clear)
  const handleClearMemory = () => {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3500); // auto reset confirmation
      return;
    }
    setPending(true);
    clearTranslationMemory();
    setPending(false);
    setConfirm(false);
    setMemoryCount(getMemoryCount());
    toast({
      title: "حافظه ترجمه پاک شد",
      description: "تمام داده‌های حافظه ترجمه حذف شد",
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border bg-card rounded-lg shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">تنظیمات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <SettingsPanel
            apiKey={settings.apiKey}
            setApiKey={key => updateSettings({ apiKey: key })}
            temperature={settings.temperature}
            setTemperature={temp => updateSettings({ temperature: temp })}
            topP={settings.topP}
            setTopP={topP => updateSettings({ topP })}
            topK={settings.topK}
            setTopK={topK => updateSettings({ topK })}
            usePersonalApi={settings.usePersonalApi}
            setUsePersonalApi={use => updateSettings({ usePersonalApi: use })}
            baseDelay={settings.baseDelay}
            setBaseDelay={delay => updateSettings({ baseDelay: delay })}
            quotaDelay={settings.quotaDelay}
            setQuotaDelay={delay => updateSettings({ quotaDelay: delay })}
            numberOfChunks={settings.numberOfChunks}
            setNumberOfChunks={chunks => updateSettings({ numberOfChunks: chunks })}
            geminiModel={settings.geminiModel}
            setGeminiModel={model => updateSettings({ geminiModel: model })}
            maxRetries={settings.maxRetries}
            setMaxRetries={retries => updateSettings({ maxRetries: retries })}
            enableThinking={settings.enableThinking}
            setEnableThinking={enable => updateSettings({ enableThinking: enable })}
            onApplyPreset={applyPreset}
          />
        </CardContent>
      </Card>
      <Card className="border bg-card rounded-lg shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">تنظیمات کیفیت</CardTitle>
        </CardHeader>
        <CardContent>
          <QualitySettingsPanel
            qualitySettings={qualitySettings}
            onUpdateQualitySettings={updateQualitySettings}
            showContextStats={true}
          />
        </CardContent>
      </Card>
      {/* New section: Translation memory controls */}
      <Card className="border bg-card rounded-lg shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            مدیریت حافظه ترجمه
            <span className="ml-2 text-xs text-muted-foreground">({memoryCount} ترجمه ذخیره شده)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Button
              variant="destructive"
              onClick={handleClearMemory}
              disabled={pending}
              className={`gap-2 ${pending ? "opacity-50 pointer-events-none" : ""}`}
            >
              <Trash2 className="w-4 h-4" />
              {confirm ? 'برای تایید مجدداً کلیک کنید' : 'پاک کردن حافظه ترجمه'}
            </Button>
            <div className="text-xs text-muted-foreground pr-1">
              این دکمه تمام ترجمه‌های ذخیره‌شده را پاک می‌کند. (قابل بازگشت نیست!)
            </div>
          </div>
        </CardContent>
      </Card>
      <QualityReport scores={qualityScores} isVisible={showQualityReport} />
      <MemoryManagement isVisible={showMemoryManagement} />
    </div>
  );
};

export default MinimalSettings;
