import { useState } from "react";
import { useAITeacher } from "@/hooks/useAITeacher";
import { ChatControl } from "./ChatControl";
import { RecorderControl } from "./RecorderControl";
import useAudioRecorder from "@/hooks/useAudioRecorder";

export const TypingBox = ({prompt}) => {
  const askAI = useAITeacher((state) => state.askAI);
  const loading = useAITeacher((state) => state.loading);
  const cantonese = useAITeacher((state) => state.cantonese);
  // console.log(cantonese)

  const {
    isRecording,
    isTranscribing,
    hasAudio,
    startRecording,
    stopRecording,
    playAudio,
    deleteAudio,
    speechToText,
  } = useAudioRecorder();

  const [question, setQuestion] = useState("");

  const ask = () => {
    console.log(`\nPrompt-1: ${prompt}`)
    askAI(question, cantonese, prompt);
    setQuestion("");
  };
  
  const convertSpeechToText = async () => {
    const data = await speechToText();
    if (data.text) {
      deleteAudio();
      console.log(`\nPrompt-2 (AUDIO): ${prompt}`)
      askAI(data.text, cantonese, prompt);
    }
  };

  return (
    <div className="z-10 max-w-[600px] flex space-y-6 flex-col bg-gradient-to-tr  from-slate-300/30 via-gray-400/30 to-slate-600-400/30 p-4  backdrop-blur-md rounded-xl border-slate-100/30 border">
      <div>
        <h2 className="text-white font-bold text-xl">Ask AI teacher about your studies!</h2>
        <p className="text-white/65">Ask any question related to your studies and AI teacher will answer that</p>
      </div>

      {loading || isTranscribing ? (
        <div className="flex justify-center items-center">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
          </span>
        </div>
      ) : isRecording || hasAudio ? (
        RecorderControl({
          isRecording: isRecording,
          onPlay: playAudio,
          onSend: convertSpeechToText,
          onDelete: deleteAudio,
          onStop: stopRecording,
        })
      ) : (
        ChatControl({
          question: question,
          onChange: (e) => setQuestion(e.target.value),
          onAsk: ask,
          onEnterKey: ask,
          onStart: startRecording,
        })
      )}
    </div>
  );
};
