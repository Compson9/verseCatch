import { useState, useEffect } from "react";
import { CircleStop, Mic, AudioLines, MicOff, Pause } from "lucide-react";
import axios from 'axios';  // Import axios
import RecordRTC from 'recordrtc';  // Import RecordRTC

function App() {
  const version = "(NIV)";

  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStopped, setHasStopped] = useState(false); // New state to track if listening has been stopped
  const [verse, setVerse] = useState({ reference: "", text: "" });
  const [bibleQuotes, setBibleQuotes] = useState([]); // State to manage the Bible quotes
  const [recorder, setRecorder] = useState(null); // State to manage the recorder instance

  useEffect(() => {
    if (isListening && !isPaused) {
      const interval = setInterval(() => {
        if (recorder) {
          recorder.stopRecording(async () => {
            const blob = recorder.getBlob();
            const formData = new FormData();
            formData.append('audio', blob, 'recording.wav');
            try {
              const response = await axios.post('http://localhost:3000/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              setVerse({
                reference: "Transcription",
                text: response.data.transcription,
              });
              setBibleQuotes(response.data.bibleQuotes);
              console.log('Bible Quotes:', response.data.bibleQuotes);
            } catch (error) {
              console.error('Error uploading audio:', error);
            }
            recorder.startRecording();
          });
        }
      }, 5000); // Adjust the interval as needed
      return () => clearInterval(interval);
    }
  }, [isListening, isPaused, recorder]);

  const handleButtonClick = async () => {
    if (isListening) {
      if (isPaused) {
        setIsPaused(false);
        recorder.resumeRecording();
        console.log("Resumed recording.");
      } else {
        setIsPaused(true);
        recorder.pauseRecording();
        console.log("Paused recording.");
      }
    } else {
      setIsListening(true);
      setIsPaused(false);
      setHasStopped(false);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newRecorder = new RecordRTC(stream, { type: 'audio' });
        newRecorder.startRecording();
        setRecorder(newRecorder);
        console.log("Started recording.");
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    }
  };

  const handleStopClick = () => {
    setIsListening(false);
    setIsPaused(false);
    setHasStopped(true);
    if (recorder) {
      recorder.stopRecording(async () => {
        const blob = recorder.getBlob();
        // Handle the recorded audio blob (e.g., send it to the backend)
        console.log("Recorded blob:", blob);

        // Create a FormData object to send the blob
        const formData = new FormData();
        formData.append('audio', blob, 'recording.wav');

        try {
          console.log("Uploading audio...");
          const response = await axios.post('http://localhost:3000/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          console.log('Audio uploaded successfully:', response.data);

          // Update the verse state with the transcription
          setVerse({
            reference: "Transcription",
            text: response.data.transcription,
          });
          setBibleQuotes(response.data.bibleQuotes);
          console.log('Transcription:', response.data.transcription);
          console.log('Bible Quotes:', response.data.bibleQuotes);
        } catch (error) {
          console.error('Error uploading audio:', error);
          setVerse({
            reference: "Error",
            text: "Error uploading audio.",
          });
        }
      });
    } else {
      // Simulate a default response
      console.log("Simulating default response...");
      setVerse({
        reference: "John 3:16",
        text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
      });
      setBibleQuotes([
        { reference: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." }
      ]);
      console.log("Default verse and Bible quotes set.");
    }
  };

  return (
    <div
      className={`flex flex-col justify-center items-center min-h-screen bg-gray-100 ${
        isListening ? "gap-4" : "gap-32"
      }`}
    >
      <div className="mt-[-10px]">
        <h2 className="text-center font-bold text-[20px]">VerseCatch</h2>
      </div>

      {verse.text && ( // Check if verse.text exists
        <div className="flex flex-col justify-center mt-16 items-center max-w-[450px]">
          <h3 className="font-semibold text-[28px]">{verse.reference} {version}</h3>
          <p className="text-[20px] text-center mt-5">{verse.text}</p>
        </div>
      )}

      {bibleQuotes.length > 0 && ( // Check if there are any Bible quotes
        <div className="flex flex-col justify-center mt-16 items-center max-w-[450px]">
          <h3 className="font-semibold text-[28px]">Bible Quotes</h3>
          <ul className="text-[20px] text-center mt-5">
            {bibleQuotes.map((quote, index) => (
              <li key={index}>
                <strong>{quote.reference} {version}:</strong> {quote.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="w-[500px] h-[210px] flex-col p-4 flex justify-center items-center rounded-lg mt-12 bg-white">
        <button
          className={`bg-gray-200 h-12 w-12 mt-[-10px] flex justify-center items-center rounded-full`}
          onClick={handleStopClick}
        >
          {isListening ? (
            isPaused ? (
              <Pause className="rounded-full text-center" size={20} />
            ) : (
              <AudioLines className="rounded-full text-center" size={20} />
            )
          ) : (
            <CircleStop className="rounded-full text-center" size={20} />
          )}
        </button>

        <p className="px-[130px] text-center mt-2">
          Transcribing and detecting Bible quotations in real time.
        </p>

        <button
          onClick={handleButtonClick}
          className={`flex rounded-3xl items-center justify-center gap-5 px-6 py-2 mt-6 ${
            isListening && !isPaused ? "bg-red-300" : "bg-black"
          } ${isListening && !isPaused ? "text-red-500" : "text-white"}`}
        >
          {isListening ? (
            isPaused ? (
              <>
                <Mic className="text-white" size={20} />
                Continue Listening
              </>
            ) : (
              <>
                <MicOff className="text-red-500" size={20} />
                Stop Listening
              </>
            )
          ) : hasStopped ? (
            <>
              <Mic className="text-white" size={20} />
              Continue Listening
            </>
          ) : (
            <>
              <Mic className="text-white" size={20} />
              Start Listening
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default App;

