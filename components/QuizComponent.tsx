import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizComponentProps {
  questions: QuizQuestion[];
  onComplete: () => void;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ questions, onComplete }) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (qIndex: number, optionIndex: number) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleSubmit = () => {
    setShowResults(true);
    onComplete();
  };

  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  return (
    <div className="space-y-8 mt-8">
      <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Check your understanding</h3>
      {questions.map((q, qIdx) => {
        const selected = answers[qIdx];
        const isCorrect = showResults && selected === q.correctAnswerIndex;
        
        return (
          <div key={qIdx} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
            <p className="font-semibold text-lg mb-4 text-slate-800">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oIdx) => {
                let optionClass = "w-full text-left p-3 rounded-md border transition-all ";
                
                if (showResults) {
                   if (oIdx === q.correctAnswerIndex) {
                     optionClass += "bg-green-50 border-green-500 text-green-800 ";
                   } else if (selected === oIdx) {
                     optionClass += "bg-red-50 border-red-500 text-red-800 ";
                   } else {
                     optionClass += "border-slate-200 opacity-50 ";
                   }
                } else {
                  if (selected === oIdx) {
                    optionClass += "bg-orange-50 border-orange-500 text-orange-900 ";
                  } else {
                    optionClass += "border-slate-200 hover:bg-slate-50 ";
                  }
                }

                return (
                  <button 
                    key={oIdx}
                    onClick={() => handleSelect(qIdx, oIdx)}
                    className={optionClass}
                    disabled={showResults}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt}</span>
                      {showResults && oIdx === q.correctAnswerIndex && <CheckCircle size={18} className="text-green-600" />}
                      {showResults && selected === oIdx && selected !== q.correctAnswerIndex && <XCircle size={18} className="text-red-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {showResults && (
              <div className="mt-4 p-3 bg-slate-50 rounded text-sm text-slate-700">
                <strong>Explanation:</strong> {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {!showResults && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
          >
            Submit Answers
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizComponent;