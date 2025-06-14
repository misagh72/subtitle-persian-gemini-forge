
import React from 'react';

const MinimalHeader: React.FC = () => (
  <header className="border-b border-border/20 bg-background">
    <div className="container mx-auto py-8 px-4 text-center">
      <h1 className="text-3xl font-bold text-primary mb-1" style={{ letterSpacing: '-0.02em' }}>
        مترجم زیرنویس ASS
      </h1>
      <p className="text-base text-muted-foreground">
        ترجمه سریع و با کیفیت زیرنویس‌های شما به فارسی
      </p>
    </div>
  </header>
);

export default MinimalHeader;
