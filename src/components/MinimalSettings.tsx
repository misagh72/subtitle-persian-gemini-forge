
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import SettingsPanel from '@/components/SettingsPanel';
import QualitySettingsPanel from '@/components/QualitySettingsPanel';
import QualityReport from '@/components/QualityReport';
import MemoryManagement from '@/components/MemoryManagement';

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
}) => (
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
        />
      </CardContent>
    </Card>
    <QualityReport scores={qualityScores} isVisible={showQualityReport} />
    <MemoryManagement isVisible={showMemoryManagement} />
  </div>
);

export default MinimalSettings;
