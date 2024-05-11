import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./Aes.scss";

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
            videoRef.current.play().catch(() => {
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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space" && isPredicting) {
        event.preventDefault(); // Prevent scrolling
        setCurrentSentence((prev) => `${prev} `);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
          if (prediction === "No hands detected") {
            // Check if the last character in currentSentence is not a space
            if (
              currentSentence
                .trim()
                .charAt(currentSentence.trim().length - 1) !== " "
            ) {
              setCurrentSentence((prev) => `${prev} `); // Add a space
            }
          } else {
            setPrediction(prediction);
            handleSentenceUpdate(prediction);
          }
        })
        .catch(() => {
          setError("Error occurred while processing the image.");
        });
    }, "image/jpeg");
  };

  const handleSentenceUpdate = (prediction) => {
    setCurrentSentence((prev) => `${prev}${prediction}`);
  };

  const handleStartStopPredicting = () => setIsPredicting(!isPredicting);

  return (
    <>
      <div className="container">
        <div className="video-container">
          <video
            ref={videoRef}
            width="640"
            height="480"
            autoPlay
            playsInline
            muted
            className="video"
          ></video>
          <button
            onClick={handleStartStopPredicting}
            className="predict-button"
          >
            {isPredicting ? "Stop Predicting" : "Start Predicting"}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        {prediction && (
          <p className="prediction">Last Prediction: {prediction}</p>
        )}
        <p className="sentence">Current Sentence: {currentSentence}</p>
      </div>
    </>
  );
}

export default App;
