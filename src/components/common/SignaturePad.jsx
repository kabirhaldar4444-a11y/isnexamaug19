import React, { useRef, useState, useEffect } from 'react';

const SignaturePad = ({ onSave, onClear, placeholder }) => {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const hasContentRef = useRef(false);
  const [hasContentState, setHasContentState] = useState(false);

  // Use refs to avoid capturing stale props in useEffect event listeners
  const onSaveRef = useRef(onSave);
  const onClearRef = useRef(onClear);

  useEffect(() => {
    onSaveRef.current = onSave;
    onClearRef.current = onClear;
  }, [onSave, onClear]);

  // Set canvas dimensions based on display size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Only resize if the dimensions have actually changed, to avoid resetting drawings unnecessarily
      if (canvas.width === rect.width * dpr && canvas.height === rect.height * dpr) {
        return;
      }
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#2563eb'; // blue-600
      ctx.lineWidth = 2.5;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches[0]) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    
    if (!hasContentRef.current) {
      hasContentRef.current = true;
    }
  };

  const saveSignature = () => {
    if (!hasContentRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (onSaveRef.current) onSaveRef.current(blob);
    }, 'image/png');
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    
    if (hasContentRef.current && !hasContentState) {
      setHasContentState(true);
    }
    
    // Auto-save/convert to blob when user stops drawing
    saveSignature();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasContentRef.current = false;
    setHasContentState(false);
    if (onClearRef.current) onClearRef.current();
    if (onSaveRef.current) onSaveRef.current(null);
  };

  // Attach touch events imperatively with passive: false to allow e.preventDefault()
  // to successfully block touch gestures and page scrolling while drawing.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e) => {
      startDrawing(e);
    };

    const handleTouchMove = (e) => {
      draw(e);
    };

    const handleTouchEnd = (e) => {
      stopDrawing();
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [hasContentState]);

  return (
    <div className="flex flex-col gap-3 w-full animate-fade-in">
      <div className="flex items-center justify-between mb-3 px-1">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Digital Signature *
        </label>
        <button 
          type="button" 
          onClick={clearCanvas}
          className="text-[9px] font-black text-rose-600 uppercase tracking-widest hover:text-rose-700 transition-colors flex items-center gap-1.5"
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      </div>

      <div className="relative group">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-40 bg-white rounded-2xl border-2 border-dashed border-slate-200 cursor-crosshair transition-all hover:border-primary-400 touch-none shadow-inner"
        />
        {!hasContentState && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">{placeholder || 'Sign Here (Mouse/Touch/Pen)'}</span>
          </div>
        )}
      </div>
      
      <p className="text-[9px] font-medium text-slate-400 italic ml-2">
        * Please sign carefully. This signature will be used for all certificates and official documents.
      </p>
    </div>
  );
};

export default SignaturePad;
