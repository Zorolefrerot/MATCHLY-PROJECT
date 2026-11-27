import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sfx } from '../engine/audio';

interface IntroCinematicProps { onFinish: () => void; }

/**
 * Opening video only: a real <video> of Matchly gameplay actions with an Afro stadium track.
 * The only visible controls are Skip and Sound, as requested.
 */
export const IntroCinematic: React.FC<IntroCinematicProps> = ({ onFinish }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const finishedRef = useRef(false);
  const [muted, setMuted] = useState(true);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    videoRef.current?.pause();
    sfx.stopIntroScoreAndStartMenu();
    onFinish();
  };

  useEffect(() => {
    sfx.stopAllAudio();
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play().catch(() => {});
    }
    return () => { videoRef.current?.pause(); };
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    setMuted(next);
    video.muted = next;
    if (!next) {
      video.volume = 1;
      video.play().catch(() => {});
    }
  };

  return (
    <div className="cine-root video-cine-root">
      <video
        ref={videoRef}
        className="cine-video"
        src="/video/matchly-fc27-opening.mp4"
        poster="/brand/matchly-fc27-logo-512.png"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
      />
      <div className="cine-video-controls">
        <button type="button" className="cine-icon-btn" onClick={toggleSound} aria-label={muted ? 'Activer le son' : 'Couper le son'} title={muted ? 'Activer le son' : 'Couper le son'}>
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button type="button" className="cine-skip-btn" onClick={finish}>Passer</button>
      </div>
    </div>
  );
};
