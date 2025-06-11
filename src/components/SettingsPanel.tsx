
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings, Zap, Balance, Sparkles2 } from 'lucide-react';
import { TRANSLATION_PRESETS } from '@/hooks/useTranslationState';

interface SettingsPanelProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  topP: number;
  setTopP: (topP: number) => void;
  topK: number;
  setTopK: (topK: number) => void;
  usePersonalApi: boolean;
  setUsePersonalApi: (use: boolean) => void;
  baseDelay: number;
  setBaseDelay: (delay: number) => void;
  quotaDelay: number;
  setQuotaDelay: (delay: number) => void;
  numberOfChunks: number;
  setNumberOfChunks: (chunks: number) => void;
  geminiModel: string;
  setGeminiModel: (model: string) => void;
  maxRetries?: number;
  setMaxRetries?: (retries: number) => void;
  onApplyPreset: (presetName: keyof typeof TRANSLATION_PRESETS) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  apiKey,
  setApiKey,
  temperature,
  setTemperature,
  topP,
  setTopP,
  topK,
  setTopK,
  usePersonalApi,
  setUsePersonalApi,
  baseDelay,
  setBaseDelay,
  quotaDelay,
  setQuotaDelay,
  numberOfChunks,
  setNumberOfChunks,
  geminiModel,
  setGeminiModel,
  maxRetries = 3,
  setMaxRetries,
  onApplyPreset,
}) => {
  const geminiModels = [
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2 Flash (پیشفرض)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
  ];

  const presetButtons = [
    { key: 'fast' as const, label: 'سریع', icon: Zap, color: 'text-yellow-500' },
    { key: 'balanced' as const, label: 'متعادل', icon: Balance, color: 'text-blue-500' },
    { key: 'quality' as const, label: 'با کیفیت', icon: Sparkles2, color: 'text-purple-500' },
  ];

  return (
    <Card className="glass-effect hover-glow animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Settings className="w-5 h-5 text-primary" />
          تنظیمات ترجمه
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Presets */}
        <div className="space-y-3">
          <Label className="text-foreground">تنظیمات پیش‌فرض</Label>
          <div className="grid grid-cols-3 gap-2">
            {presetButtons.map(({ key, label, icon: Icon, color }) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => onApplyPreset(key)}
                className="flex flex-col items-center gap-1 h-auto py-2 hover-glow"
              >
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* API Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="personal-api" className="text-foreground">
              استفاده از API شخصی
            </Label>
            <Switch
              id="personal-api"
              checked={usePersonalApi}
              onCheckedChange={setUsePersonalApi}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          
          {usePersonalApi && (
            <div className="space-y-2 animate-slide-up">
              <Label htmlFor="api-key" className="text-foreground">
                کلید API Gemini
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder="کلید API خود را وارد کنید"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-input border-border focus:border-primary transition-colors"
              />
            </div>
          )}
        </div>

        {/* Model and Core Settings */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">انتخاب مدل Gemini</Label>
            <Select value={geminiModel} onValueChange={setGeminiModel}>
              <SelectTrigger className="bg-input border-border focus:border-primary">
                <SelectValue placeholder="مدل Gemini را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {geminiModels.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Parameters */}
          <div className="space-y-2">
            <Label className="text-foreground flex justify-between">
              <span>Temperature</span>
              <span className="text-primary font-mono">{temperature}</span>
            </Label>
            <Slider
              value={[temperature]}
              onValueChange={(value) => setTemperature(value[0])}
              max={2}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex justify-between">
              <span>Top-P</span>
              <span className="text-primary font-mono">{topP}</span>
            </Label>
            <Slider
              value={[topP]}
              onValueChange={(value) => setTopP(value[0])}
              max={1}
              min={0}
              step={0.05}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex justify-between">
              <span>Top-K</span>
              <span className="text-primary font-mono">{topK}</span>
            </Label>
            <Slider
              value={[topK]}
              onValueChange={(value) => setTopK(value[0])}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          {/* Processing Settings */}
          <div className="space-y-2">
            <Label className="text-foreground flex justify-between">
              <span>Number of Chunks</span>
              <span className="text-primary font-mono">{numberOfChunks}</span>
            </Label>
            <Slider
              value={[numberOfChunks]}
              onValueChange={(value) => setNumberOfChunks(value[0])}
              max={20}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex justify-between">
              <span>Base Delay (ms)</span>
              <span className="text-primary font-mono">{baseDelay}</span>
            </Label>
            <Slider
              value={[baseDelay]}
              onValueChange={(value) => setBaseDelay(value[0])}
              max={5000}
              min={100}
              step={100}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex justify-between">
              <span>Quota Delay (ms)</span>
              <span className="text-primary font-mono">{quotaDelay}</span>
            </Label>
            <Slider
              value={[quotaDelay]}
              onValueChange={(value) => setQuotaDelay(value[0])}
              max={30000}
              min={1000}
              step={1000}
              className="w-full"
            />
          </div>

          {setMaxRetries && (
            <div className="space-y-2">
              <Label className="text-foreground flex justify-between">
                <span>Max Retries</span>
                <span className="text-primary font-mono">{maxRetries}</span>
              </Label>
              <Slider
                value={[maxRetries]}
                onValueChange={(value) => setMaxRetries(value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsPanel;
