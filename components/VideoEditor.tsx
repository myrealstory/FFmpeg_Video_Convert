"use client";
import { LocaleKeysType } from "@/app/i18n";
import { useTranslation } from "@/app/i18n/client";
import { useEffect, useRef, useState } from "react";
import { OutputVideoState, VideoPlayerState } from "@/types/VideoEditor";

// icons
import { FaVideo } from "react-icons/fa6";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { FaPlay } from "react-icons/fa6";
import { FaPause } from "react-icons/fa6";
import { ImSpinner } from "react-icons/im";

export const VideoEditor = ({ lang }: { lang: LocaleKeysType }) => {
  const { translate: t } = useTranslation(lang);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [triggerBox, setTriggerBox] = useState(false);
  const [videoUpload, setVideoUpload] = useState<File | null>(null);
  const [videoState, setVideoState] = useState<VideoPlayerState>({
    isPlaying: false,
    trimRange: [0, 0],
    video: null,
    currentTime: 0,
  });
  const [outputDetails, setOutputDetails] = useState<OutputVideoState>({
    blobURL: null,
    duration: 0,
    size: 0,
    lastSize: 0,
    originalFileType: "",
    convertedFileType: "",
  });

  //Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    console.log("Status updated:", status);
  }, [status]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError(t("VideoEditor.noFile"));
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoUpload(file);
    setVideoState({
      ...videoState,
      video: url,
      trimRange: [0, videoRef.current?.duration || 0.1],
    });
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoState.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setVideoState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleLoadMetadata = () => {
    if (!videoRef.current) return;
    const videoDuration = videoRef.current.duration;

    setVideoState({ ...videoState, trimRange: [0, videoDuration] });
  };

  const handleResizeAndUpload = async () => {
    if (!videoUpload) {
      setError(t("VideoEditor.noFile"));
      return;
    }

    setStatus("loading");

    const formData = new FormData();
    formData.append("file", videoUpload);
    formData.append("trimStart", videoState.trimRange[0].toString());
    formData.append("trimEnd", videoState.trimRange[1].toString());
    formData.append("lang", lang);

    try {
      const response = await fetch("/api/process-video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process video");
      }

      const { videoURL, size, duration, covertedFileName } =
        await response.json();
      console.log("videoURL:", videoURL);
      setOutputDetails({
        blobURL: `${videoURL}`,
        duration,
        size,
        lastSize: videoUpload.size,
        originalFileType: videoUpload.type,
        convertedFileType: "video/mp4",
      });
      setVideoState({
        isPlaying: false,
        trimRange: [0, 0],
        currentTime: 0,
        video: `${videoURL}`,
      });

      // Automatically trigger download
      const downloadLink = document.createElement("a");
      downloadLink.href = `${videoURL}`;
      downloadLink.download = `${covertedFileName}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setTriggerBox(false);
      setStatus("success");
    } catch (error) {
      console.error("Error during video processing:", error);
      setError("Failed to process video");
      setStatus("error");
      setTriggerBox(false);
    }
  };

  return (
    <div className="mx-auto relative w-full max-w-[450px]">
      <button
        className="py-2 color-black/50 bg-white rounded-full w-full text-center flex items-center justify-center border-black border-solid border"
        onClick={() => {
          setTriggerBox(true);
          setOutputDetails({
            blobURL: null,
            duration: 0,
            size: 0,
            lastSize: 0,
            originalFileType: "",
            convertedFileType: "",
          });
          setVideoState({
            isPlaying: false,
            trimRange: [0, 0],
            video: null,
            currentTime: 0,
          });
        }}
      >
        <FaVideo className="text-lg mr-2" />
        {t("VideoEditor.editVideo")}
      </button>
      {outputDetails.blobURL && (
        <div className="bg-black/20 p-4 text-left text-base color-black/70">
          {error !== null && error.length > 0 ? (
            <p>{error}</p>
          ) : (
            <div>
              <p>after render URL :{outputDetails.blobURL}</p>
              <p>Duration :{outputDetails.duration}</p>
              <p>Size :{(outputDetails.size / (1024 * 1024)).toFixed(2)} MB</p>
              <p>
                Last Size :{(outputDetails.lastSize / (1024 * 1024)).toFixed(2)}{" "}
                MB
              </p>
              <p>lastFormat :{outputDetails.originalFileType}</p>
              <p>current Format :{outputDetails.convertedFileType}</p>
              <video
                src={outputDetails.blobURL}
                className="border border-black/30 border-solid mt-4 w-full h-full max-w-[480px] max-h-[854px]"
                controls
              />
            </div>
          )}
        </div>
      )}
      {triggerBox && (
        <div className="fixed bg-black/30 backdrop-blur-sm top-0 left-0 w-full md:h-full h-[100dvh] ">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:max-w-[450px] md:h-auto h-full w-full aspect-[9/16] border-white border-2 border-solid overflow-hidden">
            <div className="h-full w-full bg-black/50 flex items-center justify-center duration-500 transform">
              <button
                className="text-white text-2xl absolute -right-0 -top-0 z-[999]"
                onClick={() => {
                  setTriggerBox(false);
                  setVideoState({
                    isPlaying: false,
                    trimRange: [0, 0],
                    video: null,
                    currentTime: 0,
                  });
                  setOutputDetails({
                    blobURL: null,
                    duration: 0,
                    size: 0,
                    lastSize: 0,
                    originalFileType: "",
                    convertedFileType: "",
                  });
                  setVideoUpload(null);
                }}
              >
                <IoMdCloseCircleOutline />
              </button>
              {!videoState.video ? (
                <div>
                  <input
                    type="file"
                    accept=".mp4,.mov,.avi"
                    onChange={(e) => handleFileChange(e)}
                    id="videoUpload"
                    className="hidden"
                  />
                  <label
                    htmlFor="videoUpload"
                    className="text-base text-white  cursor-pointer"
                  >
                    {t("VideoEditor.requestUpload")}
                  </label>
                  <p className="text-base text-white/30 text-center">
                    {t("VideoEditor.format")}
                  </p>
                </div>
              ) : (
                <div className="w-full h-full absolute inset-0">
                  {status === "loading" && (
                    <div className="absolute inset-0 backdrop-blur-sm w-full h-full bg-black/50 flex items-center justify-center">
                      <ImSpinner className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white text-4xl origin-center" />
                    </div>
                  )}
                  <video
                    src={videoState.video}
                    ref={videoRef}
                    onLoadedMetadata={handleLoadMetadata}
                    className="w-full h-full object-contain flex items-center justify-center absolute inset-0 "
                  />
                  <button
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/30 rounded-full p-4 text-white"
                    onClick={handlePlayPause}
                  >
                    {videoState.isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                  <button
                    className="absolute bottom-4 left-4 bg-red-500/70 text-white py-2 px-4 rounded-full"
                    onClick={handleResizeAndUpload}
                  >
                    {t("VideoEditor.uploadVideo")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
