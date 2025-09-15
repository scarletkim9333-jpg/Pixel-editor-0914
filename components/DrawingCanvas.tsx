

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { dataURLtoFile } from '../utils';
import { useTranslations } from '../contexts/LanguageContext';
import { UndoIcon } from './Icons';

interface DrawingCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File) => void;
}

const PixelButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
    <button
        className={`border-2 border-black shadow-[3px_3px_0_0_#000] transition-all duration-100 ease-in-out active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${className}`}
        {...props}
    />
);

const COLOR_PALETTE = ['#212121', '#E57A77', '#2E7D73', '#FFFFFF']; // Dark Gray, Coral, Teal, White
const CANVAS_BACKGROUND = '#E0E0E0';


export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ isOpen, onClose, onSave }) => {
  const { t } = useTranslations();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#212121');
  const [brushSize, setBrushSize] = useState(15);
  
  // State for undo history
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // State for custom cursor
  const [isHovering, setIsHovering] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [undoShortcut, setUndoShortcut] = useState('Ctrl+Z');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator) {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      setUndoShortcut(isMac ? 'Cmd+Z' : 'Ctrl+Z');
    }
  }, []);

  const saveStateToHistory = useCallback(() => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL();
    // If we've undone and then draw something new, overwrite the "future" history
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [history, historyStep]);


  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      // Set the internal drawing resolution
      canvas.width = 512;
      canvas.height = 512;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setContext(ctx);
        
        // Set initial background
        ctx.fillStyle = CANVAS_BACKGROUND;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Save initial state for undo
        const dataUrl = canvas.toDataURL();
        setHistory([dataUrl]);
        setHistoryStep(0);
      }
    } else {
      // Cleanup when closed
      setHistory([]);
      setHistoryStep(-1);
    }
  }, [isOpen]);

  const handleUndo = useCallback(() => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      const previousState = history[newStep];
      
      if (context && canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          context.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          context.drawImage(img, 0, 0);
        };
        img.src = previousState;
      }
    }
  }, [history, historyStep, context]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        handleUndo();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleUndo]);


  useEffect(() => {
    if (context) {
      context.lineWidth = brushSize;
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = brushColor;
    }
  }, [brushColor, brushSize, context]);

  const getCoords = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Scale coordinates from display size to drawing buffer size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in event.nativeEvent && event.nativeEvent.touches.length > 0) {
      clientX = event.nativeEvent.touches[0].clientX;
      clientY = event.nativeEvent.touches[0].clientY;
    } else {
      clientX = (event.nativeEvent as MouseEvent).clientX;
      clientY = (event.nativeEvent as MouseEvent).clientY;
    }

    if (clientX === undefined || clientY === undefined) return { x: 0, y: 0 };

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    const { x, y } = getCoords(event);
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  }, [context]);

  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    const { x, y } = getCoords(event);
    context.lineTo(x, y);
    context.stroke();
  }, [isDrawing, context]);

  const stopDrawing = useCallback(() => {
    if (!context || !isDrawing) return;
    context.closePath();
    setIsDrawing(false);
    saveStateToHistory();
  }, [context, isDrawing, saveStateToHistory]);
  
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getCoords(event);
      setCursorPos({ x: x / (canvasRef.current!.width / canvasRef.current!.getBoundingClientRect().width), y: y / (canvasRef.current!.height / canvasRef.current!.getBoundingClientRect().height)});
  };

  const clearCanvas = useCallback(() => {
    if (context && canvasRef.current) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      context.fillStyle = CANVAS_BACKGROUND;
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      saveStateToHistory();
    }
  }, [context, saveStateToHistory]);

  const handleSave = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const file = dataURLtoFile(dataUrl, `drawing-${Date.now()}.png`);
      onSave(file);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#FDF6E3] border-2 border-black shadow-[4px_4px_0_0_#000] p-6 flex flex-col gap-4 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full">
          <canvas
            ref={canvasRef}
            className="w-full aspect-square bg-transparent cursor-none border-2 border-black"
            onMouseDown={startDrawing}
            onMouseMove={(e) => {
                draw(e);
                handleMouseMove(e);
            }}
            onMouseUp={stopDrawing}
            onMouseOut={() => {
                stopDrawing();
                handleMouseLeave();
            }}
            onMouseEnter={handleMouseEnter}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <button
            onClick={handleUndo}
            disabled={historyStep <= 0}
            className="absolute top-2 right-2 flex flex-col items-center p-1 bg-white/80 hover:bg-white border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/80 transition-colors"
            aria-label={t.undoButton}
          >
            <UndoIcon className="w-6 h-6 text-black" />
            <span className="text-xs font-mono select-none">{undoShortcut}</span>
          </button>
          {isHovering && (
              <div
                  className="absolute pointer-events-none rounded-full border border-dashed border-black"
                  style={{
                      left: cursorPos.x,
                      top: cursorPos.y,
                      width: brushSize,
                      height: brushSize,
                      transform: 'translate(-50%, -50%)',
                  }}
              />
          )}
        </div>
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <label className="text-base font-medium text-black shrink-0">{t.canvasColor}</label>
                <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PALETTE.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => {
                                setBrushColor(color);
                            }}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                                brushColor === color ? 'border-black ring-2 ring-offset-1 ring-black' : 'border-gray-500'
                            } ${color === '#FFFFFF' ? 'shadow-inner' : ''}`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                        />
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <label htmlFor="brushSize" className="text-base font-medium text-black shrink-0">{t.canvasSize}</label>
                 <input id="brushSize" type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full"/>
            </div>
             <div className="grid grid-cols-1 gap-3">
                <button onClick={clearCanvas} className="w-full bg-gray-200 hover:bg-gray-300 text-black font-semibold py-2 px-4 text-base transition border-2 border-black">
                    {t.canvasClear}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                 <PixelButton onClick={onClose} className="w-full bg-gray-400 hover:bg-gray-500 text-black font-bold py-2 px-4 transition">
                    {t.cancelButton}
                </PixelButton>
                <PixelButton onClick={handleSave} className="w-full bg-[#E57A77] hover:bg-[#d46a68] text-white font-bold py-2 px-4 transition">
                    {t.canvasSave}
                </PixelButton>
            </div>
        </div>
      </div>
    </div>
  );
};
