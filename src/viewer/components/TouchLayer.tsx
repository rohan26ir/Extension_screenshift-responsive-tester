import React from 'react';

interface TouchLayerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Touch simulation is handled directly inside the frame by touchSimulator.ts.
 * We return null here to avoid duplicate visual touch cursor bubbles.
 */
export const TouchLayer: React.FC<TouchLayerProps> = () => {
  return null;
};
