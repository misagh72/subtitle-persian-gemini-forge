
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';

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
}) => {
  return (
    <Card className="glass-effect hover-glow animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Settings className="w-5 h-5 text-primary" />
          تنظیمات ترجمه
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <div className="space-y-4">
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
            <p className="text-xs text-muted-foreground">
              میزان خلاقیت در ترجمه (0 = محافظه‌کار، 2 = خلاق)
            </p>
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
            <p className="text-xs text-muted-foreground">
              احتمال انتخاب کلمات (0.1 = محدود، 1 = متنوع)
            </p>
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
            <p className="text-xs text-muted-foreground">
              تعداد گزینه‌های کلمات (1 = یکسان، 100 = متنوع)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsPanel;
