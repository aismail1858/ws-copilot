// Hook for managing source panel state

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Source } from '@/types';
import { resolveSourceHref } from '@/api/client';
import { clampSourcePanelWidth } from '../utils/chatHelpers';
import { DEFAULT_SOURCE_PANEL_WIDTH } from '../utils/chatConstants';

export function useSourcePanel() {
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [sourcePanelWidth, setSourcePanelWidth] = useState(DEFAULT_SOURCE_PANEL_WIDTH);
  const [isResizingSourcePanel, setIsResizingSourcePanel] = useState(false);

  const handleOpenSource = useCallback((source: Source) => {
    if (source.documentId) {
      setSourcePanelWidth((prev) => clampSourcePanelWidth(prev));
      setActiveSource(source);
      return;
    }

    const href = resolveSourceHref(source.url, source);
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const handleCloseSourcePanel = useCallback(() => {
    setActiveSource(null);
  }, []);

  return {
    activeSource,
    setActiveSource,
    sourcePanelWidth,
    setSourcePanelWidth,
    isResizingSourcePanel,
    setIsResizingSourcePanel,
    handleOpenSource,
    handleCloseSourcePanel,
  };
}

export function useSourcePanelResize(
  isResizingSourcePanel: boolean,
  setIsResizingSourcePanel: (value: boolean) => void,
  sourcePanelWidth: number,
  setSourcePanelWidth: (value: number | ((prev: number) => number)) => void
) {
  const sourcePanelResizeStartXRef = useRef(0);
  const sourcePanelResizeStartWidthRef = useRef(DEFAULT_SOURCE_PANEL_WIDTH);

  // Separate effect just for body styles - ensures styles are always cleaned up
  useEffect(() => {
    if (isResizingSourcePanel) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    }
  }, [isResizingSourcePanel]);

  useEffect(() => {
    if (!isResizingSourcePanel) return;

    const handlePointerMove = (event: MouseEvent) => {
      const delta = sourcePanelResizeStartXRef.current - event.clientX;
      setSourcePanelWidth(
        clampSourcePanelWidth(sourcePanelResizeStartWidthRef.current + delta)
      );
    };

    const stopResize = () => {
      setIsResizingSourcePanel(false);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', stopResize);
    window.addEventListener('blur', stopResize);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', stopResize);
      window.removeEventListener('blur', stopResize);
    };
  }, [isResizingSourcePanel, setIsResizingSourcePanel, setSourcePanelWidth]);

  useEffect(() => {
    const handleWindowResize = () => {
      setSourcePanelWidth((prev) => clampSourcePanelWidth(prev));
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [clampSourcePanelWidth, setSourcePanelWidth]);

  const handleStartSourcePanelResize = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      sourcePanelResizeStartXRef.current = event.clientX;
      sourcePanelResizeStartWidthRef.current = sourcePanelWidth;
      setIsResizingSourcePanel(true);
    },
    [sourcePanelWidth, setIsResizingSourcePanel]
  );

  return { handleStartSourcePanelResize };
}
