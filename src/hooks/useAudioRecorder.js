import { useState, useEffect } from "react";

const useAudioRecorder = () => {
  const [isRecordorAvailable, setIsRecordorAvailable] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const [hasAudio, setHasAudio] = useState(false);

  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [error, setError] = useState("");

  // This array will hold the audio data
  let chunks = [];

  // This useEffect hook sets up the media recorder when the component mounts
  useEffect(() => {
    const setUpRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        
        const mimeType = getMimeType();
        
        const recorder = new MediaRecorder(stream, { mimeType: mimeType });
        
        recorder.onstart = () => {
          chunks = [];
          setHasAudio(false);
          setIsRecording(true);
        };
        
        
        recorder.ondataavailable = (e) => {
          chunks.push(e.data);
        };
        
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: mimeType });
          setAudioBlob(blob);
          setHasAudio(true);
          setIsRecording(false);
        };
        
        setMediaRecorder(recorder);

      } catch (error) {
        setIsRecordorAvailable(false);
        console.log(error);
        setError(error.toString())
      }
    };

    if (navigator.mediaDevices) {
      setIsRecordorAvailable(true);
      setUpRecorder();
    } else {
      setIsRecordorAvailable(false);
      alert("Audio Recording is not supported on your device!");
    }
  }, []);

  // Function to get mime type based on browser

  const getMimeType = () => {
    let userAgent = navigator.userAgent;

    if (/Chrome/.test(userAgent) && !/Chromium/.test(userAgent)) {
      return "audio/webm";
    } else if (/Edg/.test(userAgent)) {
      return "audio/webm";
    } else if (/Firefox/.test(userAgent)) {
      return "audio/webm";
    } else if (/Safari/.test(userAgent)) {
      return "audio/mp4";
    } else {
      return "audio/webm";
    }
  };

  // Function to start recording
  const startRecording = () => {
    if (mediaRecorder && isRecordorAvailable) {
      mediaRecorder.start(1000);
    } else {
      alert("Audio Recording is not supported on your device!");
    }
  };

  // Function to stop recording
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  };

  // Function to play audio
  const playAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  // Function to delete audio
  const deleteAudio = () => {
    setAudioBlob(null);
    chunks = [];
    setIsRecording(false);
    setHasAudio(false);
  };

  const speechToText = async () => {
    if (!audioBlob) return null;

    return new Promise((resolve, reject) => {
      try {
        setIsTranscribing(true);

        const mimeType = getMimeType();
        const fileType = mimeType.split("/").pop();

        const formData = new FormData();
        const file = new File([audioBlob], `recording.${fileType}`, {
          type: audioBlob.type,
          lastModified: Date.now(),
        });
        formData.append("file", file);

        fetch("/api/speechToText", {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            setIsTranscribing(false);
            if (!response.ok) {
              reject({
                error: `Request failed with status ${response.status}`,
              });
            } else {
              return response.json();
            }
          })
          .then((data) => {
            resolve(data);
          })
          .catch((error) => {
            setIsTranscribing(false);
            reject(error);
          });
      } catch (error) {
        setIsTranscribing(false);
        reject(error);
      }
    });
  };

  return {
    isRecording,
    isTranscribing,
    hasAudio,
    error,
    startRecording,
    stopRecording,
    playAudio,
    deleteAudio,
    speechToText,
  };
};

export default useAudioRecorder;
