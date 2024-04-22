import { useState, useRef, useEffect } from "react";
import axios from "axios";

function App() {
  const [prediction, setPrediction] = useState("");
  const [currentSentence, setCurrentSentence] = useState("");
  const [error, setError] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  const backend_url = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const initializeCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera not supported by this browser.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch((e) => {
              setError(
                "Error playing the video. Please check camera permissions and ensure nothing else is using it."
              );
            });
          };
        }
      } catch (err) {
        setError(
          "Error accessing the camera. Please make sure it is enabled and allowed."
        );
      }
    };

    initializeCamera();
    return () =>
      videoRef.current?.srcObject?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (isPredicting) {
      intervalRef.current = setInterval(captureAndPredict, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [isPredicting]);

  const captureAndPredict = () => {
    if (!videoRef.current?.videoWidth) {
      setError("Video is not ready or available.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const formData = new FormData();
      formData.append("file", blob, "image.jpg");
      axios
        .post(backend_url, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((response) => {
          const { prediction } = response.data;
          if (prediction !== "No hands detected") {
            setPrediction(prediction);
            handleSentenceUpdate(prediction);
          }
        })
        .catch((error) => {
          setError("Error occurred while processing the image.");
        });
    }, "image/jpeg");
  };

  const handleSentenceUpdate = (prediction) => {
    // Check if prediction is a space, indicating a word separator
    if (prediction === " ") {
      setCurrentSentence((prev) => `${prev} `);
    } else {
      setCurrentSentence((prev) => `${prev}${prediction}`);
    }
  };

  const handleStartStopPredicting = () => setIsPredicting(!isPredicting);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h1>Hand Sign Detection</h1>
      <video
        ref={videoRef}
        width="640"
        height="480"
        autoPlay
        playsInline
        muted
        style={{ border: "2px solid black" }}
      ></video>
      <button
        onClick={handleStartStopPredicting}
        style={{ margin: "10px", padding: "10px" }}
      >
        {isPredicting ? "Stop Predicting" : "Start Predicting"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {prediction && (
        <p style={{ color: "green" }}>Last Prediction: {prediction}</p>
      )}
      <p style={{ color: "blue" }}>Current Sentence: {currentSentence}</p>
    </div>
  );
}

export default App;
