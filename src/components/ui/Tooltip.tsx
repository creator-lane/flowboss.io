import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
  icon?: boolean;
}

export function Tooltip({ text, children, icon = true }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<'top' | 'bottom'>('top');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos(rect.top < 80 ? 'bottom' : 'top');
    }
  }, [show]);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children || (icon && (
        <Info className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 cursor-help transition-colors" />
      ))}
      {show && (
        <div
          ref={ref}
          className={`absolute z-50 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg max-w-[220px] whitespace-normal leading-relaxed pointer-events-none ${
            pos === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } left-1/2 -translate-x-1/2`}
        >
          {text}
          <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 ${
            pos === 'top' ? 'top-full -mt-1' : 'bottom-full -mb-1'
          }`} />
        </div>
      )}
    </span>
  );
}
