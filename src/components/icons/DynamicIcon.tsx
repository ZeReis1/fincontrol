'use client';

import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function DynamicIcon({ name, className = 'w-4 h-4', size }: DynamicIconProps) {
  // @ts-expect-error - Lucide icons map
  const IconComponent = Icons[name] || Icons.HelpCircle;
  return <IconComponent className={className} size={size} />;
}
