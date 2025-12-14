import React, { useState, useEffect } from 'react';
import { Check, RefreshCw, GripVertical, Shuffle } from 'lucide-react';
import Button from './Button';

interface GlossaryMatchGameProps {
  glossary: Record<string, string>;
  onComplete?: () => void;
}

interface TermItem {
  id: string; // The term itself
  text: string;
}

interface DefItem {
  id: string; // The term it corresponds to
  text: string; // The definition text
}

const GlossaryMatchGame: React.FC<GlossaryMatchGameProps> = ({ glossary, onComplete }) => {
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [definitions, setDefinitions] = useState<DefItem[]>([]);
  const [matches, setMatches] = useState<Record<string, string | null>>({}); // defId -> matchedTermId
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    initGame();
  }, [glossary]);

  const initGame = () => {
    const termList = Object.keys(glossary).map(t => ({ id: t, text: t }));
    const defList = Object.entries(glossary).map(([t, d]) => ({ id: t, text: d }));

    // Shuffle both
    setTerms(termList.sort(() => Math.random() - 0.5));
    setDefinitions(defList.sort(() => Math.random() - 0.5));
    
    // Reset matches
    const initialMatches: Record<string, string | null> = {};
    defList.forEach(d => initialMatches[d.id] = null);
    setMatches(initialMatches);
    setSelectedTerm(null);
    setIsCompleted(false);
  };

  // Check if all correct
  useEffect(() => {
    const allMatched = definitions.length > 0 && definitions.every(def => matches[def.id] === def.id);
    if (allMatched && !isCompleted) {
      setIsCompleted(true);
      if (onComplete) onComplete();
    }
  }, [matches, definitions, onComplete, isCompleted]);

  const handleTermClick = (termId: string) => {
    // If term is already matched, ignore
    if (Object.values(matches).includes(termId)) return;
    setSelectedTerm(selectedTerm === termId ? null : termId);
  };

  const handleDefClick = (defId: string) => {
    // If we have a selected term, try to match
    if (selectedTerm) {
      // Check if correct (immediate feedback mode)
      if (defId === selectedTerm) {
        setMatches(prev => ({ ...prev, [defId]: selectedTerm }));
        setSelectedTerm(null);
      } else {
        // Wrong match visual cue could go here
        const el = document.getElementById(`def-${defId}`);
        if (el) {
          el.classList.add('animate-shake');
          setTimeout(() => el.classList.remove('animate-shake'), 500);
        }
        setSelectedTerm(null);
      }
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, termId: string) => {
    if (Object.values(matches).includes(termId)) {
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData("text/plain", termId);
    setSelectedTerm(termId); // Also select it visually
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, defId: string) => {
    e.preventDefault();
    const termId = e.dataTransfer.getData("text/plain");
    if (termId === defId) {
       setMatches(prev => ({ ...prev, [defId]: termId }));
       setSelectedTerm(null);
    } else {
        const el = document.getElementById(`def-${defId}`);
        if (el) {
          el.classList.add('animate-shake');
          setTimeout(() => el.classList.remove('animate-shake'), 500);
        }
    }
  };

  const availableTerms = terms.filter(t => !Object.values(matches).includes(t.id));

  return (
    <div className="bg-orange-50/50 p-6 rounded-xl border border-orange-100 my-8">
      <div className="flex items-center justify-between mb-6">
         <div>
            <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
              <Shuffle size={20} /> Match the Terms
            </h3>
            <p className="text-sm text-orange-700">Drag terms to their definitions, or tap to select.</p>
         </div>
         <button onClick={initGame} className="p-2 text-orange-600 hover:bg-orange-100 rounded-full" title="Reset">
           <RefreshCw size={20} />
         </button>
      </div>

      {/* Terms Pool */}
      <div className="flex flex-wrap gap-3 mb-8 min-h-[60px] p-4 bg-white/50 rounded-lg border border-orange-100 border-dashed">
        {availableTerms.length === 0 && !isCompleted && (
           <p className="text-sm text-slate-400 w-full text-center italic">All terms matched!</p>
        )}
        {isCompleted && (
           <div className="w-full flex items-center justify-center gap-2 text-green-600 font-bold animate-pulse">
             <Check size={24} /> Perfect Match!
           </div>
        )}
        {availableTerms.map(term => (
          <div
            key={term.id}
            draggable
            onDragStart={(e) => handleDragStart(e, term.id)}
            onClick={() => handleTermClick(term.id)}
            className={`cursor-grab active:cursor-grabbing px-4 py-2 rounded-full font-medium text-sm shadow-sm border transition-all transform hover:-translate-y-0.5
              ${selectedTerm === term.id 
                ? 'bg-orange-500 text-white border-orange-600 ring-2 ring-orange-200 scale-105' 
                : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <GripVertical size={14} className="opacity-50" />
              {term.text}
            </div>
          </div>
        ))}
      </div>

      {/* Definitions List */}
      <div className="space-y-3">
        {definitions.map(def => {
          const matchedTerm = matches[def.id];
          const isMatched = !!matchedTerm;

          return (
            <div 
              key={def.id}
              id={`def-${def.id}`}
              onDragOver={!isMatched ? handleDragOver : undefined}
              onDrop={!isMatched ? (e) => handleDrop(e, def.id) : undefined}
              onClick={() => !isMatched && handleDefClick(def.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-300 relative flex items-center justify-between
                ${isMatched 
                  ? 'bg-green-50 border-green-200' 
                  : selectedTerm 
                    ? 'bg-white border-orange-200 border-dashed cursor-pointer hover:bg-orange-50' 
                    : 'bg-white border-slate-100'
                }
              `}
            >
              <div className="flex-1 pr-4">
                 <p className={`text-sm ${isMatched ? 'text-green-800' : 'text-slate-600'}`}>
                   {def.text}
                 </p>
              </div>
              
              {/* Drop Zone / Filled Slot */}
              <div className={`min-w-[140px] h-10 rounded flex items-center justify-center px-3 text-sm font-medium transition-all
                 ${isMatched 
                   ? 'bg-green-100 text-green-700 border border-green-200' 
                   : 'bg-slate-50 text-slate-400 border border-slate-200'
                 }
              `}>
                {isMatched ? (
                   <span className="flex items-center gap-1">
                     <Check size={14} /> {matchedTerm}
                   </span>
                ) : (
                   <span className="text-xs opacity-50">Drop term here</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default GlossaryMatchGame;