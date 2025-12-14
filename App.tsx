import React, { useState, useEffect, useRef } from 'react';
import { CURRICULUM } from './constants';
import { Chapter, ModuleType, QuizQuestion, ReadingContent, WritingFeedback, ListeningExercise, Message, Flashcard, GrammarContent, GrammarDrill } from './types';
import { generateGrammarLesson, generateReadingExercise, checkWritingExercise, generateListeningExercise, getChatResponse, evaluateSpeech } from './services/geminiService';
import { loadDeck, saveDeck, createCard, calculateReview, getDueCards } from './services/srsService';
import { loadProgress, saveProgress, saveReadingStats, getAverageConfidence, saveActiveLesson, loadActiveLesson } from './services/progressService';
import Button from './components/Button';
import AudioPlayer from './components/AudioPlayer';
import AudioRecorder from './components/AudioRecorder';
import PronunciationPractice from './components/PronunciationPractice';
import QuizComponent from './components/QuizComponent';
import GlossaryMatchGame from './components/GlossaryMatchGame';
import { 
  BookOpen, 
  PenTool, 
  Headphones, 
  MessageCircle, 
  ChevronRight, 
  Layout, 
  Check, 
  User,
  Send,
  ArrowLeft,
  Loader2,
  Brain,
  Plus,
  RotateCcw,
  Clock,
  ThumbsUp,
  Star,
  Trophy,
  PieChart,
  BarChart,
  Save,
  Settings,
  Sparkles,
  Mic,
  ArrowRight,
  RefreshCcw,
  Circle,
  CheckCircle,
  XCircle,
  Lightbulb
} from 'lucide-react';

// --- Sub-components for specific Views ---

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-64 space-y-4">
    <Loader2 className="animate-spin text-orange-500 h-10 w-10" />
    <p className="text-slate-500 font-medium">Gemini is preparing your lesson...</p>
  </div>
);

// --- Drill Component ---
const DrillSection = ({ drills }: { drills: GrammarDrill[] }) => {
  const [activeDrillIndex, setActiveDrillIndex] = useState(0);
  const [feedback, setFeedback] = useState<{isCorrect: boolean, msg: string} | null>(null);

  // Fill in blank state
  const [fillInput, setFillInput] = useState("");
  
  // Reorder state
  const [reorderSelection, setReorderSelection] = useState<string[]>([]);
  const [reorderPool, setReorderPool] = useState<string[]>([]);

  // MCQ state
  const [mcqSelection, setMcqSelection] = useState<string | null>(null);

  const activeDrill = drills[activeDrillIndex];

  useEffect(() => {
    // Reset state on drill change
    setFeedback(null);
    setFillInput("");
    setMcqSelection(null);
    if (activeDrill?.type === 'reorder' && activeDrill.reorderSegments) {
       setReorderPool([...activeDrill.reorderSegments].sort(() => Math.random() - 0.5));
       setReorderSelection([]);
    }
  }, [activeDrill]);

  const handleFillCheck = () => {
    if (fillInput.trim().toLowerCase() === activeDrill.correctAnswer.toLowerCase()) {
      setFeedback({ isCorrect: true, msg: "Correct! " + activeDrill.explanation });
    } else {
      setFeedback({ isCorrect: false, msg: `Incorrect. The correct answer is '${activeDrill.correctAnswer}'. ${activeDrill.explanation}` });
    }
  };

  const handleReorderCheck = () => {
    const userSentence = reorderSelection.join(' ');
    if (userSentence.trim() === activeDrill.correctAnswer.trim()) {
      setFeedback({ isCorrect: true, msg: "Correct! " + activeDrill.explanation });
    } else {
       setFeedback({ isCorrect: false, msg: `Incorrect. The correct order is: "${activeDrill.correctAnswer}". ${activeDrill.explanation}` });
    }
  };

  const handleMcqCheck = () => {
    if (!mcqSelection) return;
    if (mcqSelection === activeDrill.correctAnswer) {
      setFeedback({ isCorrect: true, msg: "Correct! " + activeDrill.explanation });
    } else {
      setFeedback({ isCorrect: false, msg: `Incorrect. The correct answer is '${activeDrill.correctAnswer}'. ${activeDrill.explanation}` });
    }
  };

  const nextDrill = () => {
    if (activeDrillIndex < drills.length - 1) {
      setActiveDrillIndex(prev => prev + 1);
    }
  };

  const isLast = activeDrillIndex === drills.length - 1;

  if (!activeDrill) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
           <PenTool size={18} className="text-orange-500" /> 
           Practice Drill {activeDrillIndex + 1}/{drills.length}
        </h3>
        <span className="text-xs uppercase font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border">
          {activeDrill.type.replace('-', ' ')}
        </span>
      </div>

      <p className="mb-4 text-slate-700 font-medium text-lg">{activeDrill.question}</p>

      {/* Fill-in-blank Type */}
      {activeDrill.type === 'fill-in-blank' && (
        <div className="space-y-4">
           <div className="p-6 bg-slate-50 rounded-lg text-lg text-slate-800 border border-slate-200">
              {activeDrill.fillInBlankSentence?.split('____').map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && (
                     <input 
                       type="text" 
                       value={fillInput}
                       onChange={(e) => setFillInput(e.target.value)}
                       className={`mx-2 border-b-2 bg-transparent outline-none text-center font-bold w-32 focus:border-orange-500 ${
                         feedback 
                           ? feedback.isCorrect ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'
                           : 'border-slate-400'
                       }`}
                       placeholder="?"
                       disabled={!!feedback}
                     />
                  )}
                </React.Fragment>
              ))}
           </div>
           
           {!feedback && (
             <div className="flex justify-end">
               <Button onClick={handleFillCheck} disabled={!fillInput.trim()}>Check Answer</Button>
             </div>
           )}
        </div>
      )}

      {/* Reorder Type */}
      {activeDrill.type === 'reorder' && (
        <div className="space-y-6">
           <div className={`min-h-[60px] p-4 rounded-lg border-2 border-dashed flex flex-wrap gap-2 items-center ${
              feedback 
               ? feedback.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
               : 'bg-slate-50 border-slate-200'
           }`}>
              {reorderSelection.length === 0 && !feedback && (
                <span className="text-slate-400 text-sm w-full text-center">Tap words below to build the sentence</span>
              )}
              {reorderSelection.map((word, idx) => (
                <button
                  key={`${word}-${idx}`}
                  onClick={() => {
                    if (feedback) return;
                    setReorderSelection(prev => prev.filter((_, i) => i !== idx));
                    setReorderPool(prev => [...prev, word]);
                  }}
                  disabled={!!feedback}
                  className="bg-white px-3 py-1.5 rounded shadow-sm border border-slate-200 font-medium hover:border-red-300 text-slate-800"
                >
                  {word}
                </button>
              ))}
           </div>

           <div className="flex flex-wrap gap-2 justify-center">
              {reorderPool.map((word, idx) => (
                <button
                  key={`${word}-${idx}`}
                  onClick={() => {
                    if (feedback) return;
                    setReorderPool(prev => prev.filter((_, i) => i !== idx));
                    setReorderSelection(prev => [...prev, word]);
                  }}
                  disabled={!!feedback}
                  className="bg-blue-50 text-blue-800 px-3 py-1.5 rounded shadow-sm border border-blue-100 font-medium hover:bg-blue-100 hover:-translate-y-0.5 transition-all"
                >
                  {word}
                </button>
              ))}
           </div>

           {!feedback && (
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => {
                     setReorderPool([...(activeDrill.reorderSegments || [])]);
                     setReorderSelection([]);
                  }}
                  className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm"
                >
                  <RefreshCcw size={14} /> Reset
                </button>
                <Button onClick={handleReorderCheck} disabled={reorderSelection.length === 0}>Check Order</Button>
              </div>
           )}
        </div>
      )}

      {/* Multiple Choice Type */}
      {activeDrill.type === 'multiple-choice' && activeDrill.options && (
        <div className="space-y-4">
           <div className="grid grid-cols-1 gap-3">
             {activeDrill.options.map((option, idx) => {
               const isSelected = mcqSelection === option;
               let btnClass = "w-full text-left p-4 rounded-lg border-2 transition-all flex items-center justify-between ";
               
               if (feedback) {
                  if (option === activeDrill.correctAnswer) {
                     btnClass += "bg-green-50 border-green-500 text-green-800";
                  } else if (isSelected && option !== activeDrill.correctAnswer) {
                     btnClass += "bg-red-50 border-red-500 text-red-800";
                  } else {
                     btnClass += "bg-white border-slate-100 text-slate-400 opacity-60";
                  }
               } else {
                  if (isSelected) {
                     btnClass += "bg-orange-50 border-orange-500 text-orange-900";
                  } else {
                     btnClass += "bg-white border-slate-200 hover:border-orange-300 hover:bg-slate-50 text-slate-700";
                  }
               }

               return (
                 <button 
                   key={idx}
                   onClick={() => !feedback && setMcqSelection(option)}
                   className={btnClass}
                   disabled={!!feedback}
                 >
                   <span className="font-medium">{option}</span>
                   {feedback && option === activeDrill.correctAnswer && <CheckCircle size={20} className="text-green-600" />}
                   {feedback && isSelected && option !== activeDrill.correctAnswer && <XCircle size={20} className="text-red-600" />}
                   {!feedback && isSelected && <CheckCircle size={20} className="text-orange-500" />}
                   {!feedback && !isSelected && <Circle size={20} className="text-slate-300" />}
                 </button>
               )
             })}
           </div>
           
           {!feedback && (
             <div className="flex justify-end pt-2">
               <Button onClick={handleMcqCheck} disabled={!mcqSelection}>Check Answer</Button>
             </div>
           )}
        </div>
      )}

      {feedback && (
        <div className={`mt-6 p-4 rounded-lg border flex flex-col gap-3 animate-fade-in ${
          feedback.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
             {feedback.isCorrect ? <Check size={20} className="mt-0.5 text-green-700" /> : <RefreshCcw size={20} className="mt-0.5 text-red-700" />}
             <div className="flex-1">
                <p className={`font-medium ${feedback.isCorrect ? 'text-green-900' : 'text-red-900'}`}>{feedback.msg}</p>
             </div>
          </div>
          
          {(activeDrill.ruleExplanation || activeDrill.exampleSentence) && (
            <div className="mt-2 pt-3 border-t border-black/5">
              {activeDrill.ruleExplanation && (
                <div className="flex gap-2 mb-2">
                  <Lightbulb size={16} className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-800"><span className="font-semibold">Rule:</span> {activeDrill.ruleExplanation}</p>
                </div>
              )}
              {activeDrill.exampleSentence && (
                <div className="bg-white/60 p-3 rounded-lg text-sm ml-6">
                  <p className="italic text-slate-900 font-medium">"{activeDrill.exampleSentence}"</p>
                  {activeDrill.exampleTranslation && <p className="text-slate-500 mt-1">{activeDrill.exampleTranslation}</p>}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
             {!isLast && feedback.isCorrect && (
               <Button size="sm" onClick={nextDrill} className="ml-2">Next Drill <ArrowRight size={14} /></Button>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

// 1. Grammar View
const GrammarView = ({ chapter, onBack, onAddToDeck, onComplete, onNotify }: { chapter: Chapter; onBack: () => void; onAddToDeck: (front: string, back: string, source: string) => void; onComplete: () => void; onNotify: (msg: string) => void }) => {
  const [data, setData] = useState<GrammarContent | null>(null);
  const [setupMode, setSetupMode] = useState(true);
  const [customTopic, setCustomTopic] = useState(chapter.title);
  const [isLoading, setIsLoading] = useState(false);

  const COMMON_TOPICS = [
    "Verb Conjugation",
    "Word Order",
    "Prepositions",
    "Articles (De/Het)",
    "Adjectives",
    "Plurals",
    "Negation (Niet/Geen)",
    "Separable Verbs"
  ];
  
  useEffect(() => {
    const saved = loadActiveLesson(chapter.id);
    if (saved) {
      setData(saved);
      setSetupMode(false);
      onNotify("Resumed saved lesson");
    } else {
      // Initialize fresh state for new lesson
      setCustomTopic(chapter.title);
      setSetupMode(true);
      setData(null);
    }
  }, [chapter.id]);

  const handleStartLesson = async () => {
    setSetupMode(false);
    setIsLoading(true);
    try {
      const result = await generateGrammarLesson(customTopic, chapter.level);
      setData(result);
    } catch (e) {
      console.error(e);
      setSetupMode(true); // Revert to setup on error
      onNotify("Failed to generate lesson. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (data) {
      saveActiveLesson(chapter.id, data);
      onNotify("Lesson saved successfully");
    }
  };

  if (isLoading) return <LoadingScreen />;

  if (setupMode) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Button variant="outline" onClick={onBack} className="mb-6"><ArrowLeft size={16} /> Back</Button>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Configure Lesson</h2>
              <p className="text-slate-500 text-sm">Target specific grammar rules</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Topic</label>
              <input 
                type="text" 
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="e.g. Past Tense"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-orange-500" /> Suggested Topics
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_TOPICS.map(topic => (
                  <button
                    key={topic}
                    onClick={() => setCustomTopic(topic)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                      customTopic === topic 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleStartLesson} className="w-full py-4 text-lg" disabled={!customTopic.trim()}>
                Start Lesson
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return <LoadingScreen />;

  // Select a phrase for pronunciation practice (either from drills or generated expl)
  const practiceSentence = data.drills.find(d => d.exampleSentence)?.exampleSentence 
    || data.explanation.split('.')[0] + '.';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={onBack}><ArrowLeft size={16} /> Back to Dashboard</Button>
        <Button variant="secondary" onClick={handleSave} className="gap-2"><Save size={16} /> Save Lesson</Button>
      </div>
      <div className="mb-2">
        <span className="text-xs uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {data.topic || chapter.title}
        </span>
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-2">{chapter.title}</h2>
      <p className="text-slate-500 mb-8">{chapter.description}</p>
      
      <div className="prose prose-orange max-w-none bg-white p-8 rounded-xl shadow-sm border border-slate-100 mb-8">
        {data.explanation.split('\n').map((para, i) => (
          para.trim() && <p key={i} className="mb-4 text-slate-700 leading-relaxed">{para}</p>
        ))}
      </div>

      {data.drills && data.drills.length > 0 && (
         <DrillSection drills={data.drills} />
      )}

      {/* Integrated Pronunciation Practice */}
      <PronunciationPractice referenceText={practiceSentence} onNotify={onNotify} />

      {data.flashcards && data.flashcards.length > 0 && (
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="text-indigo-600" size={20} />
            <h3 className="text-lg font-bold text-indigo-900">Key Concepts for Review</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {data.flashcards.map((card, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-semibold text-indigo-900">{card.front}</p>
                  <p className="text-sm text-indigo-700">{card.back}</p>
                </div>
                <button 
                  onClick={() => onAddToDeck(card.front, card.back, chapter.title)}
                  className="p-2 hover:bg-indigo-50 rounded-full text-indigo-500 hover:text-indigo-700 transition-colors"
                  title="Add to Flashcards"
                >
                  <Plus size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <QuizComponent questions={data.quiz} onComplete={onComplete} />
    </div>
  );
};

// 2. Reading View
const ReadingView = ({ chapter, onBack, onAddToDeck, onComplete, onNotify }: { chapter: Chapter; onBack: () => void; onAddToDeck: (front: string, back: string, source: string) => void; onComplete: (confidence?: number) => void; onNotify: (msg: string) => void }) => {
  const [data, setData] = useState<ReadingContent | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [confidence, setConfidence] = useState(5);

  useEffect(() => {
    const saved = loadActiveLesson(chapter.id);
    if (saved) {
      setData(saved);
      onNotify("Resumed saved lesson");
    } else {
      const avg = getAverageConfidence();
      generateReadingExercise(chapter.title, chapter.level, avg).then(setData).catch(console.error);
    }
  }, [chapter.id]);

  const handleSave = () => {
    if (data) {
      saveActiveLesson(chapter.id, data);
      onNotify("Lesson saved successfully");
    }
  };

  if (!data) return <LoadingScreen />;

  const handleFinish = () => {
    onComplete(confidence);
  };

  // Pick first sentence for practice
  const practiceSentence = data.text.split(/[.!?]/)[0] + '.';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={onBack}><ArrowLeft size={16} /> Back</Button>
        <Button variant="secondary" onClick={handleSave} className="gap-2"><Save size={16} /> Save Lesson</Button>
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-6">{data.title}</h2>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 mb-8">
        {data.text.split('\n').map((para, i) => (
           para.trim() && <p key={i} className="mb-4 text-lg leading-relaxed text-slate-800 font-serif">{para}</p>
        ))}
      </div>

      {Object.keys(data.glossary).length > 0 && (
        <>
          <div className="bg-orange-50 p-6 rounded-lg mb-8">
            <div className="flex items-center justify-between mb-4">
               <h4 className="font-bold text-orange-900 uppercase text-sm tracking-wide">Woordenlijst (Glossary)</h4>
               <span className="text-xs text-orange-700 bg-orange-200/50 px-2 py-1 rounded">Quick Add to Flashcards</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {Object.entries(data.glossary).map(([term, def]) => (
                <div key={term} className="flex items-center justify-between bg-white/50 p-2 rounded border border-orange-100">
                  <div className="flex flex-col">
                    <span className="font-semibold text-orange-800">{term}</span>
                    <span className="text-sm text-orange-900 opacity-80">{def}</span>
                  </div>
                  <button 
                    onClick={() => onAddToDeck(term, def, chapter.title)}
                    className="p-1.5 hover:bg-orange-200 rounded-full text-orange-600 transition-colors"
                    title="Add to Flashcards"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <GlossaryMatchGame 
             glossary={data.glossary} 
             onComplete={() => {}} 
          />
        </>
      )}

      {/* Integrated Pronunciation Practice */}
      <PronunciationPractice referenceText={practiceSentence} onNotify={onNotify} />

      <QuizComponent questions={data.questions} onComplete={() => setQuizFinished(true)} />

      {quizFinished && (
        <div className="mt-8 bg-slate-800 text-white p-6 rounded-xl animate-fade-in-up">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart size={24} className="text-orange-400" />
            How confident did you feel?
          </h3>
          <p className="text-slate-300 mb-6">Your feedback helps us tailor future reading exercises to your level.</p>
          
          <div className="flex items-center gap-4 mb-2">
            <span className="text-sm font-medium">Struggled</span>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={confidence} 
              onChange={(e) => setConfidence(parseInt(e.target.value))}
              className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <span className="text-sm font-medium">Too Easy</span>
          </div>
          <div className="text-center font-bold text-2xl text-orange-400 mb-6">{confidence}/10</div>
          
          <div className="flex justify-end">
            <Button variant="primary" size="lg" onClick={handleFinish}>
              Complete Lesson
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Writing View
const WritingView = ({ chapter, onBack, onComplete, onNotify }: { chapter: Chapter; onBack: () => void; onComplete: () => void; onNotify: (msg: string) => void }) => {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const saved = loadActiveLesson(chapter.id);
    if (saved) {
      if (saved.text) setText(saved.text);
      if (saved.feedback) setFeedback(saved.feedback);
      onNotify("Resumed saved draft");
    }
  }, [chapter.id]);

  const handleSave = () => {
    saveActiveLesson(chapter.id, { text, feedback });
    onNotify("Draft saved successfully");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await checkWritingExercise(text, chapter.description);
      setFeedback(result);
      if (result.score >= 6) {
        onComplete();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
       <div className="flex items-center justify-between mb-6">
         <Button variant="outline" onClick={onBack}><ArrowLeft size={16} /> Back</Button>
         <Button variant="secondary" onClick={handleSave} className="gap-2"><Save size={16} /> Save Draft</Button>
       </div>
       <h2 className="text-3xl font-bold text-slate-900 mb-2">{chapter.title}</h2>
       <div className="bg-blue-50 p-4 rounded-lg text-blue-800 mb-6 border border-blue-100">
         <strong>Assignment:</strong> {chapter.description}
       </div>

       {!feedback ? (
         <div className="space-y-4">
           <textarea
             className="w-full h-64 p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none font-sans text-lg"
             placeholder="Typ hier uw tekst..."
             value={text}
             onChange={(e) => setText(e.target.value)}
           ></textarea>
           <div className="flex justify-end">
             <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={text.length < 10}>
               Submit for Review
             </Button>
           </div>
         </div>
       ) : (
         <div className="space-y-6 animate-fade-in">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-xl font-bold text-slate-800">Feedback Result</h3>
               <span className={`px-3 py-1 rounded-full text-sm font-bold ${feedback.score >= 7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                 Score: {feedback.score}/10
               </span>
             </div>
             <div className="space-y-4">
               <div>
                  <h4 className="font-semibold text-slate-700 mb-1">Critique</h4>
                  <p className="text-slate-600">{feedback.critique}</p>
               </div>
               <div>
                  <h4 className="font-semibold text-slate-700 mb-1">Improved Version</h4>
                  <div className="bg-slate-50 p-4 rounded-lg text-slate-800 border-l-4 border-green-500 italic">
                    {feedback.correctedText}
                  </div>
               </div>
             </div>
             
             {/* Pronunciation Practice for Writing */}
             <div className="mt-6 pt-6 border-t border-slate-100">
               <h4 className="font-bold text-slate-800 mb-4">Read your improved text aloud:</h4>
               <PronunciationPractice referenceText={feedback.correctedText} onNotify={onNotify} />
             </div>

             <div className="mt-6 flex justify-end gap-4">
               <Button variant="outline" onClick={() => setFeedback(null)}>Try Again</Button>
               <Button variant="primary" onClick={onBack}>Finish Lesson</Button>
             </div>
           </div>
           <div className="bg-green-50 text-green-800 p-4 rounded-lg text-center font-medium border border-green-200">
              Lesson marked as complete!
           </div>
         </div>
       )}
    </div>
  );
};

// 4. Listening View
const ListeningView = ({ chapter, onBack, onComplete, onNotify }: { chapter: Chapter; onBack: () => void; onComplete: () => void; onNotify: (msg: string) => void }) => {
  const [data, setData] = useState<ListeningExercise | null>(null);

  useEffect(() => {
    const saved = loadActiveLesson(chapter.id);
    if (saved) {
      setData(saved);
      onNotify("Resumed saved lesson");
    } else {
      generateListeningExercise(chapter.title, chapter.level).then(setData).catch(console.error);
    }
  }, [chapter.id]);

  const handleSave = () => {
    if (data) {
      saveActiveLesson(chapter.id, data);
      onNotify("Lesson saved successfully");
    }
  };

  if (!data) return <LoadingScreen />;

  // Extract practice sentence
  const practiceSentence = data.transcript.split(/[.!?]/)[0] + '.';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={onBack}><ArrowLeft size={16} /> Back</Button>
        <Button variant="secondary" onClick={handleSave} className="gap-2"><Save size={16} /> Save Lesson</Button>
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-2">{chapter.title}</h2>
      <p className="text-slate-500 mb-8">{chapter.description}</p>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 mb-8 flex flex-col items-center">
         <div className="w-full max-w-md">
            <AudioPlayer base64Audio={data.audioBase64} />
         </div>
         <p className="mt-4 text-sm text-slate-400">Listen carefully before answering the questions below.</p>
      </div>

      <QuizComponent questions={data.questions} onComplete={onComplete} />
      
      {/* Pronunciation Practice Section */}
      <PronunciationPractice referenceText={practiceSentence} onNotify={onNotify} />

      <div className="mt-8 text-center">
        <details className="cursor-pointer text-slate-500 text-sm">
          <summary>Show Transcript</summary>
          <p className="mt-2 p-4 bg-slate-100 rounded text-slate-700 italic">{data.transcript}</p>
        </details>
      </div>
    </div>
  );
};

// 5. Chat View
const ChatView = ({ chapter, onBack, onComplete, onNotify }: { chapter: Chapter; onBack: () => void; onComplete: () => void; onNotify: (msg: string) => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Hoi! Ik ben Sanne. Hoe gaat het met je vandaag?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const saved = loadActiveLesson(chapter.id);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      // Restore timestamps from strings if necessary
      const restored = saved.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      setMessages(restored);
      onNotify("Chat history restored");
    }
  }, [chapter.id]);

  const handleSave = () => {
    saveActiveLesson(chapter.id, messages);
    onNotify("Conversation saved");
  };

  const handleVoiceMessage = async (base64: string, mimeType: string) => {
    setIsProcessingAudio(true);
    try {
      // 1. Analyze pronunciation & transcribe
      const analysis = await evaluateSpeech(base64, mimeType);
      
      const userMsg: Message = { 
        id: Date.now().toString(), 
        role: 'user', 
        text: analysis.transcript, 
        timestamp: new Date(),
        pronunciationScore: analysis.score,
        pronunciationFeedback: analysis.feedback
      };
      
      const newHistory = [...messages, userMsg];
      setMessages(newHistory);
      
      // 2. Get response from Sanne based on transcript
      setIsLoading(true); // Show typing indicator
      
      // Prepare text history for chat context
      const historyForChat = newHistory.map(m => ({ role: m.role, text: m.text }));
      const responseText = await getChatResponse(historyForChat, chapter.level);
      
      const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
      setMessages(prev => [...prev, modelMsg]);

    } catch (e) {
      console.error(e);
      onNotify("Failed to process voice message");
    } finally {
      setIsProcessingAudio(false);
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, text: m.text }));
      const responseText = await getChatResponse(history, chapter.level);
      
      const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
      setMessages(prev => [...prev, modelMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete();
    onBack();
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={onBack} size="sm"><ArrowLeft size={16} /> Exit</Button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-900">Sanne (Colleague)</h2>
          <span className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
          </span>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" size="sm" onClick={handleSave} className="gap-1"><Save size={14} /> Save</Button>
           <Button variant="primary" size="sm" onClick={handleComplete}>Mark Complete</Button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
           {messages.map((m) => (
             <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl relative ${
                  m.role === 'user' 
                    ? 'bg-orange-500 text-white rounded-br-none' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                }`}>
                  <div className="p-4">
                    <p>{m.text}</p>
                  </div>
                  {/* Pronunciation Feedback Bubble */}
                  {m.role === 'user' && m.pronunciationFeedback && (
                    <div className="bg-orange-600/90 text-orange-50 text-xs p-2 rounded-b-xl border-t border-orange-400">
                      <div className="flex items-center gap-1 font-bold mb-1">
                        <Mic size={10} /> Pronunciation Score: {m.pronunciationScore}/10
                      </div>
                      {m.pronunciationFeedback}
                    </div>
                  )}
                </div>
             </div>
           ))}
           {(isLoading || isProcessingAudio) && (
             <div className="flex justify-start">
               <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm">
                 <div className="flex gap-1">
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                 </div>
               </div>
             </div>
           )}
        </div>
        
        <div className="p-4 bg-white border-t border-slate-200">
           <div className="flex gap-2 items-center">
             <AudioRecorder onRecordingComplete={handleVoiceMessage} isProcessing={isProcessingAudio} />
             <input 
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder="Typ een bericht..."
               className="flex-1 border border-slate-300 rounded-full px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:outline-none"
             />
             <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-orange-500 text-white p-3 rounded-full hover:bg-orange-600 disabled:opacity-50 transition-colors"
             >
               <Send size={20} />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// 6. Review View (SRS)
const ReviewView = ({ onBack, onComplete, dueCards }: { onBack: () => void; onComplete: (cardId: string, quality: number) => void; dueCards: Flashcard[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const currentCard = dueCards[currentIndex];

  if (!currentCard) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
           <Check size={48} className="text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">All caught up!</h2>
        <p className="text-slate-500 mb-8">You have reviewed all your vocabulary for now.</p>
        <Button onClick={onBack}>Back to Dashboard</Button>
      </div>
    );
  }

  const handleRate = (quality: number) => {
    onComplete(currentCard.id, quality);
    setIsFlipped(false);
    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Force end state by incrementing beyond length
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-xl mx-auto h-[600px] flex flex-col">
       <div className="flex items-center justify-between mb-8">
         <Button variant="outline" onClick={onBack} size="sm"><ArrowLeft size={16} /> Quit</Button>
         <div className="text-slate-500 font-medium">
           Card {currentIndex + 1} of {dueCards.length}
         </div>
         <div className="w-[80px]"></div>
       </div>

       <div className="flex-1 perspective-1000 relative">
          <div className={`relative w-full h-96 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center justify-center p-8 transition-all duration-300 ${isFlipped ? 'bg-orange-50 border-orange-200' : ''}`}>
             <div className="text-center">
               <span className="uppercase tracking-widest text-xs font-bold text-slate-400 mb-4 block">
                 {isFlipped ? 'Answer' : 'Question'}
               </span>
               <h3 className="text-3xl font-bold text-slate-900 mb-4">
                 {isFlipped ? currentCard.back : currentCard.front}
               </h3>
               {isFlipped && currentCard.source && (
                 <p className="text-sm text-slate-400 mt-4">Source: {currentCard.source}</p>
               )}
             </div>
          </div>
       </div>

       <div className="mt-8 h-24">
         {!isFlipped ? (
           <Button onClick={() => setIsFlipped(true)} className="w-full h-14 text-lg">
             Show Answer
           </Button>
         ) : (
           <div className="grid grid-cols-4 gap-3">
             <button onClick={() => handleRate(1)} className="flex flex-col items-center justify-center p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
               <RotateCcw size={20} className="mb-1" />
               <span className="text-xs font-bold">Again</span>
               <span className="text-[10px] opacity-75">&lt; 1min</span>
             </button>
             <button onClick={() => handleRate(2)} className="flex flex-col items-center justify-center p-2 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors">
               <Clock size={20} className="mb-1" />
               <span className="text-xs font-bold">Hard</span>
               <span className="text-[10px] opacity-75">2 days</span>
             </button>
             <button onClick={() => handleRate(3)} className="flex flex-col items-center justify-center p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
               <ThumbsUp size={20} className="mb-1" />
               <span className="text-xs font-bold">Good</span>
               <span className="text-[10px] opacity-75">4 days</span>
             </button>
             <button onClick={() => handleRate(5)} className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
               <Star size={20} className="mb-1" />
               <span className="text-xs font-bold">Easy</span>
               <span className="text-[10px] opacity-75">7 days</span>
             </button>
           </div>
         )}
       </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [deck, setDeck] = useState<Flashcard[]>([]);
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setDeck(loadDeck());
    setCompletedChapters(loadProgress());
  }, []);

  useEffect(() => {
    saveDeck(deck);
  }, [deck]);

  useEffect(() => {
    saveProgress(completedChapters);
  }, [completedChapters]);

  const dueCards = getDueCards(deck);

  const handleAddToDeck = (front: string, back: string, source: string) => {
    const newCard = createCard(front, back, source);
    if (!deck.find(c => c.front === front)) {
      setDeck(prev => [...prev, newCard]);
      showNotification(`Added "${front}" to flashcards`);
    } else {
      showNotification(`"${front}" is already in your deck`);
    }
  };

  const handleLessonComplete = (chapterId: string, readingConfidence?: number) => {
    if (!completedChapters.includes(chapterId)) {
      setCompletedChapters(prev => [...prev, chapterId]);
      showNotification("Lesson completed! 🎉");
    } else {
      showNotification("Lesson updated! 👍");
    }

    if (readingConfidence) {
      saveReadingStats(chapterId, readingConfidence);
    }
  };

  const handleReviewComplete = (cardId: string, quality: number) => {
    setDeck(prev => prev.map(card => {
      if (card.id === cardId) {
        return calculateReview(card, quality);
      }
      return card;
    }));
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const getModuleIcon = (type: ModuleType) => {
    switch(type) {
      case ModuleType.GRAMMAR: return <BookOpen className="text-blue-500" />;
      case ModuleType.READING: return <Layout className="text-green-500" />;
      case ModuleType.WRITING: return <PenTool className="text-purple-500" />;
      case ModuleType.LISTENING: return <Headphones className="text-red-500" />;
      case ModuleType.CONVERSATION: return <MessageCircle className="text-orange-500" />;
    }
  };

  const renderModule = () => {
    if (!activeChapter) return null;
    const onComplete = (confidence?: number) => handleLessonComplete(activeChapter.id, confidence);
    
    switch(activeChapter.type) {
      case ModuleType.GRAMMAR: return <GrammarView chapter={activeChapter} onBack={() => setActiveChapter(null)} onAddToDeck={handleAddToDeck} onComplete={() => onComplete()} onNotify={showNotification} />;
      case ModuleType.READING: return <ReadingView chapter={activeChapter} onBack={() => setActiveChapter(null)} onAddToDeck={handleAddToDeck} onComplete={onComplete} onNotify={showNotification} />;
      case ModuleType.WRITING: return <WritingView chapter={activeChapter} onBack={() => setActiveChapter(null)} onComplete={() => onComplete()} onNotify={showNotification} />;
      case ModuleType.LISTENING: return <ListeningView chapter={activeChapter} onBack={() => setActiveChapter(null)} onComplete={() => onComplete()} onNotify={showNotification} />;
      case ModuleType.CONVERSATION: return <ChatView chapter={activeChapter} onBack={() => setActiveChapter(null)} onComplete={() => onComplete()} onNotify={showNotification} />;
      default: return <div>Unknown module</div>;
    }
  };

  // Stats Calculation
  const totalChapters = CURRICULUM.length;
  const totalCompleted = completedChapters.length;
  const totalProgress = Math.round((totalCompleted / totalChapters) * 100) || 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 bg-slate-800 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in">
          {notification}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveChapter(null); setIsReviewMode(false); }}>
             <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
               <span className="text-white font-bold text-lg">Z</span>
             </div>
             <h1 className="text-xl font-bold text-slate-900 tracking-tight">Zakelijk Nederlands</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              <User size={16} />
              <span>English Speaker</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isReviewMode ? (
          <ReviewView 
            dueCards={dueCards} 
            onBack={() => setIsReviewMode(false)} 
            onComplete={handleReviewComplete}
          />
        ) : !activeChapter ? (
          <div className="space-y-12">
            
            {/* Welcome Section */}
            <div className="text-center space-y-4 py-8">
              <h2 className="text-4xl font-extrabold text-slate-900">Master Dutch for the Workplace</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                A phased learning approach to help you communicate confidently with your Dutch colleagues.
              </p>
            </div>

            {/* Dashboards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Progress Dashboard */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <PieChart className="text-blue-500" size={20} />
                    Your Progress
                  </h3>
                  <span className="text-2xl font-bold text-blue-600">{totalProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
                  <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${totalProgress}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 text-right">{totalCompleted} of {totalChapters} lessons completed</p>
              </div>

              {/* SRS Widget */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-md flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Brain size={20} /> Vocabulary Review</h3>
                  <p className="opacity-90 text-sm">Spaced repetition system</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-4">
                     <div className="text-center">
                       <div className="text-xl font-bold">{dueCards.length}</div>
                       <div className="text-[10px] opacity-75 uppercase">Due</div>
                     </div>
                     <div className="text-center border-l border-white/20 pl-4">
                       <div className="text-xl font-bold">{deck.length}</div>
                       <div className="text-[10px] opacity-75 uppercase">Total</div>
                     </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-white text-indigo-900 hover:bg-white/90 w-full"
                    onClick={() => setIsReviewMode(true)}
                    disabled={dueCards.length === 0}
                  >
                    {dueCards.length > 0 ? 'Review Now' : 'Synced'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Curriculum Grid */}
            <div className="grid gap-8">
              {['Phase 1: Beginner', 'Phase 2: Intermediate', 'Phase 3: Professional'].map((phaseTitle, idx) => {
                const phaseLevel = idx === 0 ? 'Beginner' : idx === 1 ? 'Intermediate' : 'Professional';
                const chapters = CURRICULUM.filter(c => c.level.includes(phaseLevel));
                const phaseProgress = chapters.filter(c => completedChapters.includes(c.id)).length;
                const phaseTotal = chapters.length;
                const phasePercentage = Math.round((phaseProgress / phaseTotal) * 100) || 0;
                
                return (
                  <section key={phaseTitle} className="relative">
                    <div className="flex items-end justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shadow-sm ${phasePercentage === 100 ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'}`}>
                          {phasePercentage === 100 ? <Check size={16} /> : idx + 1}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 leading-none">{phaseTitle}</h3>
                          <p className="text-sm text-slate-500 mt-1">{phaseProgress}/{phaseTotal} Completed</p>
                        </div>
                      </div>
                      <div className="w-32 hidden sm:block">
                         <div className="w-full bg-slate-200 rounded-full h-1.5">
                           <div className={`h-1.5 rounded-full transition-all duration-500 ${phasePercentage === 100 ? 'bg-green-500' : 'bg-slate-800'}`} style={{ width: `${phasePercentage}%` }}></div>
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {chapters.map((chapter) => {
                        const isCompleted = completedChapters.includes(chapter.id);
                        return (
                          <div 
                            key={chapter.id}
                            className={`group bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-full relative overflow-hidden ${isCompleted ? 'border-green-200' : 'border-slate-200 hover:border-orange-200'}`}
                            onClick={() => setActiveChapter(chapter)}
                          >
                            {isCompleted && (
                              <div className="absolute top-0 right-0 bg-green-500 text-white p-1 rounded-bl-lg">
                                <Check size={16} />
                              </div>
                            )}
                            <div className="flex items-center justify-between mb-4">
                              <div className={`p-3 rounded-lg transition-colors ${isCompleted ? 'bg-green-50' : 'bg-slate-50 group-hover:bg-orange-50'}`}>
                                {getModuleIcon(chapter.type)}
                              </div>
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                {chapter.type}
                              </span>
                            </div>
                            <h4 className={`text-lg font-bold mb-2 transition-colors ${isCompleted ? 'text-green-700' : 'text-slate-900 group-hover:text-orange-600'}`}>
                              {chapter.title}
                            </h4>
                            <p className="text-sm text-slate-500 mb-6 flex-1">
                              {chapter.description}
                            </p>
                            <div className={`flex items-center text-sm font-medium transition-opacity duration-300 ${isCompleted ? 'text-green-600 opacity-100' : 'text-orange-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0'}`}>
                              {isCompleted ? 'Review Lesson' : 'Start Lesson'} <ChevronRight size={16} className="ml-1" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            {renderModule()}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Zakelijk Nederlands. Powered by Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;