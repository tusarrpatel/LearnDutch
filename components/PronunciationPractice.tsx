import React, { useState } from 'react';
import { Mic, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import { evaluateSpeech } from '../services/geminiService';

interface PronunciationPracticeProps {
  referenceText: string;
  onNotify?: (msg: string) => void;
}

interface FeedbackState {
  score: number;
  feedback: string;
  transcript: string;
}

const PronunciationPractice: React.FC<PronunciationPracticeProps> = ({ referenceText, onNotify }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<FeedbackState | null>(null);

  const handleRecord = async (base64: string, mimeType: string) => {
    setIsProcessing(true);
    setResult(null);
    try {
      const response = await evaluateSpeech(base64, mimeType, referenceText);
      setResult({
        score: response.score,
        feedback: response.feedback,
        transcript: response.transcript
      });
      if (onNotify) onNotify("Analysis complete!");
    } catch (error) {
      console.error(error);
      if (onNotify) onNotify("Failed to analyze audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Clean the reference text for display (remove markdown if any)
  const cleanText = referenceText.replace(/\*\*/g, '').replace(/\*/g, '');

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-6 my-8 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
          <Mic size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-indigo-900">Pronunciation Practice</h3>
          <p className="text-xs text-indigo-600 font-medium">Read the sentence below aloud</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-indigo-200 shadow-inner text-center mb-6">
        <p className="text-xl font-serif text-slate-800 leading-relaxed">
          "{cleanText}"
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <AudioRecorder onRecordingComplete={handleRecord} isProcessing={isProcessing} />

        {result && (
          <div className="w-full animate-fade-in-up">
            <div className={`rounded-xl border p-4 ${
              result.score >= 7 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {result.score >= 7 ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <Sparkles className="text-orange-500" size={20} />
                  )}
                  <span className={`font-bold ${result.score >= 7 ? 'text-green-800' : 'text-orange-800'}`}>
                    Analysis Result
                  </span>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-bold border ${
                  result.score >= 7 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-orange-100 text-orange-700 border-orange-200'
                }`}>
                  Score: {result.score}/10
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="font-semibold opacity-70 min-w-[80px]">You said:</span>
                  <span className="italic opacity-90">"{result.transcript}"</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold opacity-70 min-w-[80px]">Feedback:</span>
                  <span className="opacity-90">{result.feedback}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PronunciationPractice;
