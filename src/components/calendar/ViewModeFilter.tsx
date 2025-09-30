import React from 'react';
import { ViewMode } from '@/types/presence';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ViewModeFilterProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewModeFilter({ value, onChange }: ViewModeFilterProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ViewMode)} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="terceirizados">Terceirizados</TabsTrigger>
        <TabsTrigger value="coordenadores">Coordenadores</TabsTrigger>
        <TabsTrigger value="plantao">Plantão</TabsTrigger>
        <TabsTrigger value="empresa">Empresa</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
