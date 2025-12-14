import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MODEL_TEXT, MODEL_AUDIO } from '../constants';
import { QuizQuestion, WritingFeedback, ReadingContent, ListeningExercise, GrammarContent } from '../types';

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean JSON string from markdown code blocks
const cleanJson = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const generateGrammarLesson = async (topic: string, level: string): Promise<GrammarContent> => {
  const prompt = `Create a Dutch grammar lesson about "${topic}" for a student at the "${level}" level. 
  Focus on workplace usage.
  
  1. Provide a clear, concise explanation in English (with Dutch examples).
  
  2. Create 2 "fill-in-the-blank" drills. 
     - Provide a sentence with a '____' placeholder.
     - The 'correctAnswer' should be just the word(s) that go in the blank.
  
  3. Create 2 "sentence reordering" drills.
     - Provide a list of scrambled words/phrases in 'reorderSegments'.
     - The 'correctAnswer' should be the full correct sentence string.

  4. Provide 3 multiple choice quiz questions to test general understanding.

  5. Provide 3-5 key concepts/rules from this lesson formatted as flashcards (Front: Concept Name/Dutch Phrase, Back: Explanation/English).
  
  Return the response in this specific JSON schema:
  {
    "explanation": "string (markdown allowed)",
    "drills": [
      {
        "type": "fill-in-blank", 
        "question": "Instruction (e.g. Conjugate 'lopen')",
        "fillInBlankSentence": "Ik ____ naar het werk.",
        "correctAnswer": "loop",
        "explanation": "why this is correct"
      },
      {
        "type": "reorder",
        "question": "Put the words in the correct order",
        "reorderSegments": ["word1", "word2"],
        "correctAnswer": "word1 word2",
        "explanation": "word order rule"
      }
    ],
    "quiz": [
      {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswerIndex": number,
        "explanation": "string"
      }
    ],
    "flashcards": [
      { "front": "string", "back": "string" }
    ]
  }`;

  const response = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          drills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["fill-in-blank", "reorder"] },
                question: { type: Type.STRING },
                fillInBlankSentence: { type: Type.STRING },
                reorderSegments: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING }
              }
            }
          },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswerIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              }
            }
          },
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  const content = JSON.parse(response.text || '{}');
  return { ...content, topic };
};

export const generateReadingExercise = async (topic: string, level: string, avgConfidence?: number): Promise<ReadingContent> => {
  let adjustment = "";
  if (avgConfidence !== undefined) {
    if (avgConfidence < 5) {
        adjustment = "The user has struggled with previous texts (Confidence < 5/10). Please use simpler vocabulary and shorter sentences than usual for this level to build confidence.";
    } else if (avgConfidence > 8) {
        adjustment = "The user found previous texts very easy (Confidence > 8/10). Please include slightly more complex sentence structures and idiomatic expressions to challenge them.";
    }
  }

  const prompt = `Write a short Dutch text related to "${topic}" suitable for a "${level}" learner.
  ${adjustment}
  The text should be realistic for a Dutch workplace (e.g., email, memo, newsletter).
  Include a glossary of 3-5 difficult terms.
  Include 3 comprehension questions.

  Return JSON.`;

  const response = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          text: { type: Type.STRING },
          glossary: { 
            type: Type.OBJECT, 
            additionalProperties: { type: Type.STRING } 
          },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswerIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const checkWritingExercise = async (userText: string, context: string): Promise<WritingFeedback> => {
  const prompt = `A student submitted the following Dutch text for the exercise: "${context}".
  
  Student Text: "${userText}"
  
  Please correct the text, provide a critique on grammar and tone (workplace appropriateness), and give a score out of 10.
  Return JSON.`;

  const response = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          correctedText: { type: Type.STRING },
          critique: { type: Type.STRING },
          score: { type: Type.INTEGER }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateListeningExercise = async (topic: string, level: string): Promise<ListeningExercise> => {
  // Step 1: Generate the text transcript
  const textPrompt = `Generate a 2-3 sentence Dutch phrase/monologue related to "${topic}" for a "${level}" learner. 
  It should be something one might hear in an office.
  Also generate 2 simple comprehension questions based on it.
  
  Return JSON: { "transcript": "...", "questions": [...] }`;

  const textResponse = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: textPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcript: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswerIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  const content = JSON.parse(textResponse.text || '{}');

  // Step 2: Generate Audio using the transcript
  const audioResponse = await ai.models.generateContent({
    model: MODEL_AUDIO,
    contents: [{ parts: [{ text: content.transcript }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Male voice, professional
        },
      },
    },
  });

  const audioBase64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  return {
    ...content,
    audioBase64
  };
};

export const evaluateSpeech = async (audioBase64: string, mimeType: string, referenceText?: string): Promise<{ transcript: string, feedback: string, score: number }> => {
  let promptText = "";
  
  if (referenceText) {
    promptText = `I am learning Dutch. I will provide an audio recording of me saying: "${referenceText}".
    1. Transcribe what I actually said.
    2. Rate my pronunciation on a scale of 1-10.
    3. Give specific feedback on which words I mispronounced and how to improve.
    Return JSON.`;
  } else {
    promptText = `I am learning Dutch. Please transcribe this audio.
    Then, provide a brief critique of the pronunciation (score 1-10 and tips).
    Return JSON.`;
  }

  const response = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: audioBase64
          }
        },
        { text: promptText }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcript: { type: Type.STRING },
          feedback: { type: Type.STRING },
          score: { type: Type.INTEGER }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const getChatResponse = async (history: {role: 'user' | 'model', text: string}[], level: string) => {
  const systemInstruction = `You are a helpful Dutch colleague named "Sanne". 
  You are helping an English-speaking colleague learn Dutch. 
  Your level of speech should be adjusted to: ${level}.
  Keep responses relatively short and conversational.
  Correct major mistakes gently if necessary, but keep the flow going.`;

  // Filter history to only include text parts for the chat model
  const chatHistory = history.slice(0, -1).map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));
  
  const lastMessage = history[history.length - 1];

  const chatSession = ai.chats.create({
    model: MODEL_TEXT,
    config: { systemInstruction },
    history: chatHistory
  });

  const result = await chatSession.sendMessage({
    message: lastMessage.text
  });

  return result.text;
};

// Audio Decoding Helper
export async function decodeAudioData(
  base64String: string,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await audioContext.decodeAudioData(bytes.buffer);
}