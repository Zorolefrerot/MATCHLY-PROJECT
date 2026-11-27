import React from 'react';

/**
 * FC 27 Title Screen — official user artwork (941×1672).
 * The whole screen is clickable; the PRESS TO START button blinks
 * (pulsing neon outline) until the player taps it.
 */
export const TitleScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="screen-stage title-stage">
      <button
        type="button"
        className="screen-frame title-frame"
        style={{
          aspectRatio: '941 / 1672',
          width: 'min(100vw, calc(100dvh * 941 / 1672))',
        }}
        onClick={onStart}
        aria-label="Press to start — appuyer pour commencer"
      >
        <img src="/brand/title-screen.jpg" alt="Matchly FC 27 — Press to start" draggable={false} />
        {/* Blinking outline over the baked-in PRESS TO START button */}
        <span
          className="press-start-chip"
          style={{ left: '23%', top: '84.6%', width: '53.5%', height: '3.9%' }}
          aria-hidden="true"
        />
      </button>
    </div>
  );
};
