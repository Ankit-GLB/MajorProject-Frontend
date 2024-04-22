import { useState, useRef, useEffect } from "react";
import axios from "axios";

function App() {
  const [prediction, setPrediction] = useState("");
  const [error, setError] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  const backend_url = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    console.log("your backend is here: " + backend_url);
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
              console.error("Error playing the video stream after load:", e);
              setError(
                "Error playing the video. Please check camera permissions and ensure nothing else is using it."
              );
            });
          };
        }
      } catch (error) {
        console.error("Error accessing the camera:", error);
        setError(
          "Error accessing the camera. Please make sure it is enabled and allowed."
        );
      }
    };

    initializeCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isPredicting) {
      intervalRef.current = setInterval(captureAndPredict, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPredicting]);

  const captureAndPredict = () => {
    if (!videoRef.current || !videoRef.current.videoWidth) {
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
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          const { prediction } = response.data;
          setPrediction(prediction || "No prediction available");
          setError("");
        })
        .catch((error) => {
          console.error("Error processing the image:", error);
          setError("Error occurred while processing the image.");
        });
    }, "image/jpeg");
  };

  const handleStartPredicting = () => {
    setIsPredicting(true);
  };

  const handleStopPredicting = () => {
    setIsPredicting(false);
  };

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
      <div>
        <button
          onClick={handleStartPredicting}
          disabled={isPredicting}
          style={{ margin: "10px", padding: "10px" }}
        >
          Start Predicting
        </button>
        <button
          onClick={handleStopPredicting}
          disabled={!isPredicting}
          style={{ margin: "10px", padding: "10px" }}
        >
          Stop Predicting
        </button>
      </div>
      {error && (
        <p className="error" style={{ color: "red" }}>
          {error}
        </p>
      )}
      {prediction && <p style={{ color: "green" }}>Prediction: {prediction}</p>}
    </div>
  );
}

export default App;
