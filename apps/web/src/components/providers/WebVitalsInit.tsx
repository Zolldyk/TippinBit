'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/monitoring/web-vitals';

export function WebVitalsInit() {
  useEffect(() => {
    initWebVitals();
  }, []);

  return null;
}
