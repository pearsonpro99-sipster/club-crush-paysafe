'use client';

import { useEffect } from 'react';
import { registerSW } from '@/lib/notifications';

export default function ServiceWorkerInit() {
  useEffect(() => { registerSW(); }, []);
  return null;
}
