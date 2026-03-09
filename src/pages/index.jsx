import { useState, useCallback, useRef, useEffect } from 'react';
import HandTrackingService from '../components/HandTrackingService';

const defaultSettings = {
  enabled: true,
  showPreview: true,
  cameraOrientation: 'landscape',
  cameraPosition: 'top',
  smoothing: 0.3,
  sensitivity: 1,
  preprocessingQuality: 'medium',
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  pinchSensitivity: 0.2,
};


const ACTIVE_COLOR  = '59,130,246';
const ACTIVE_DOT    = '147,197,253';
const GRAY_COLOR    = '120,120,120';
const GRAY_DOT      = '180,180,180';

function LiveCursor({ handIndex }) {
  const cursorRef = useRef(null);
  const dotRef    = useRef(null);
  const ringRef   = useRef(null);
  const isCircle  = handIndex === 0;

  useEffect(() => {
    if (!window.__updateHandCursor) window.__updateHandCursor = {};

    window.__updateHandCursor[handIndex] = (pos) => {
      const el   = cursorRef.current;
      const dot  = dotRef.current;
      const ring = ringRef.current;
      if (!el) return;

      if (!pos.detected) {
        el.style.opacity = '0';
        return;
      }

      el.style.opacity  = '1';
      el.style.transform = `translate(${pos.x - 20}px, ${pos.y - 20}px)`;

      const palmOk     = pos.palmVisible !== false;
      const rc         = palmOk ? ACTIVE_COLOR : GRAY_COLOR;
      const dc         = palmOk ? ACTIVE_DOT   : GRAY_DOT;
      const s          = palmOk ? (pos.pinchStrength || 0) : 0;
      const isPinching = palmOk && (pos.isPinching || false);

      const size = 40 - s * 10;
      ring.style.width       = `${size}px`;
      ring.style.height      = `${size}px`;
      ring.style.borderColor = `rgba(${rc},${isPinching ? 0.8 + s * 0.2 : 0.75})`;
      ring.style.boxShadow   = palmOk
        ? `0 0 ${20 + s * 20}px rgba(${rc},${0.6 + s * 0.3}), 0 0 ${40 + s * 40}px rgba(${rc},${0.3 + s * 0.2})`
        : 'none';
      ring.style.borderWidth = `${isPinching ? 3 + s * 2 : 3}px`;
      ring.style.background  = `rgba(${rc},${palmOk ? 0.12 : 0.06})`;

      const dotSize      = palmOk ? 4 + s * 4 : 3;
      dot.style.width    = `${dotSize}px`;
      dot.style.height   = `${dotSize}px`;
      dot.style.background   = `rgba(${dc},1)`;
      dot.style.boxShadow    = palmOk ? `0 0 8px rgba(${dc},1)` : 'none';
    };

    return () => {
      if (window.__updateHandCursor) delete window.__updateHandCursor[handIndex];
    };
  }, [handIndex]);

  const borderRadius = isCircle ? '50%' : '6px';

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: 40, height: 40,
        pointerEvents: 'none',
        zIndex: 999999,
        opacity: 0,
        willChange: 'transform, opacity',
      }}
    >
      <div
        ref={ringRef}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 40, height: 40,
          borderRadius,
          border: `3px solid rgba(${ACTIVE_COLOR},0.75)`,
          background: `rgba(${ACTIVE_COLOR},0.12)`,
          boxShadow: `0 0 20px rgba(${ACTIVE_COLOR},0.6), 0 0 40px rgba(${ACTIVE_COLOR},0.3)`,
          transition: 'width 0.06s, height 0.06s, box-shadow 0.06s, border-color 0.06s, background 0.12s',
        }}
      />
      <div
        ref={dotRef}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 4, height: 4,
          borderRadius: '50%',
          background: `rgba(${ACTIVE_DOT},1)`,
          boxShadow: `0 0 8px rgba(${ACTIVE_DOT},1)`,
          transition: 'width 0.06s, height 0.06s, background 0.12s',
        }}
      />
    </div>
  );
}

export default function IndexPage() {
  const [statuses, setStatuses] = useState([
    { detected: false, isPinching: false, palmVisible: false },
    { detected: false, isPinching: false, palmVisible: false },
  ]);

  const handleHandPosition = useCallback((pos) => {
    const idx = pos.handIndex ?? 0;
    window.__updateHandCursor?.[idx]?.(pos);
    setStatuses(prev => {
      const next = [...prev];
      next[idx] = {
        detected:     pos.detected,
        isPinching:   pos.isPinching   || false,
        palmVisible:  pos.palmVisible  ?? true,
      };
      return next;
    });
  }, []);

  return (
    <div
      style={{
        width: '100vw', height: '100vh',
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Courier New', monospace",
        overflow: 'hidden', position: 'relative',
        cursor: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute', top: 24, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 999, padding: '6px 20px',
          zIndex: 50,
        }}
      >
        {statuses.map((s, i) => {
          let dotColor, glowColor, label;
          if (!s.detected) {
            dotColor = '#ef4444'; glowColor = '#ef4444'; label = `H${i+1} —`;
          } else if (!s.palmVisible) {
            dotColor = '#888'; glowColor = '#888'; label = `H${i+1} back`;
          } else if (s.isPinching) {
            dotColor = '#f59e0b'; glowColor = '#f59e0b'; label = `H${i+1} pinch`;
          } else {
            dotColor = `rgb(${ACTIVE_DOT})`; glowColor = `rgb(${ACTIVE_DOT})`; label = `H${i+1} palm`;
          }
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: dotColor,
                boxShadow: `0 0 8px ${glowColor}`,
                transition: 'background 0.2s, box-shadow 0.2s',
              }} />
              <span style={{
                fontSize: 11, letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase',
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <HandTrackingService
        settings={defaultSettings}
        enabled={true}
        onHandPosition={handleHandPosition}
      />

      <LiveCursor handIndex={0} />
      <LiveCursor handIndex={1} />
    </div>
  );
}