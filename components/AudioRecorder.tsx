import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import Button from './Button';

interface AudioRecorderProps {
  onRecordingComplete: (base64Data: string, mimeType: string) => void;
  isProcessing?: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, isProcessing = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          onRecordingComplete(base64String, 'audio/webm');
        };
        reader.readAsDataURL(blob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isProcessing ? (
        <div className="p-3 bg-slate-100 rounded-full animate-pulse">
            <Loader2 className="animate-spin text-slate-500" size={20} />
        </div>
      ) : isRecording ? (
        <Button 
          variant="danger" 
          onClick={stopRecording}
          className="rounded-full w-12 h-12 flex items-center justify-center p-0"
          title="Stop Recording"
        >
          <Square size={20} fill="currentColor" />
        </Button>
      ) : (
        <Button 
          variant="secondary" 
          onClick={startRecording}
          className="rounded-full w-12 h-12 flex items-center justify-center p-0"
          title="Start Recording"
        >
          <Mic size={20} />
        </Button>
      )}
      {isRecording && <span className="text-sm text-red-500 font-medium animate-pulse">Recording...</span>}
    </div>
  );
};

export default AudioRecorder;