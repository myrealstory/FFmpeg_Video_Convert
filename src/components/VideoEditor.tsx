"use client";
import { LocaleKeysType } from "../app/i18n";
import { useTranslation } from "../app/i18n/client";
import { useEffect, useRef, useState } from "react";
import { OutputVideoState, VideoPlayerState } from "../types/VideoEditor";
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import Image from "next/image";

// icons
import { FaCheck, FaVideo } from "react-icons/fa6";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { FaPlay } from "react-icons/fa6";
import { FaPause } from "react-icons/fa6";
import { ImSpinner } from "react-icons/im";
import { FaChevronDown } from "react-icons/fa";
import { FaChevronUp } from "react-icons/fa";
import SampleImage from "@/images/Screenshot 2024-12-23 093813.png";

export const VideoEditor = ({ lang }: { lang: LocaleKeysType }) => {
  const { translate: t } = useTranslation(lang);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [triggerBox, setTriggerBox] = useState(false);
  const [toogleUploadDetails, setToogleUploadDetails] = useState(false);
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
    processingTime: "",
  });

  //Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const isBrowser = () => typeof window !== 'undefined';

  useEffect(() => {
    const initFFmpeg = async () => {
      await load();
    };
  
    initFFmpeg();
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
    setVideoState((prev: VideoPlayerState) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleLoadMetadata = () => {
    if (!videoRef.current) return;
    const videoDuration = videoRef.current.duration;

    setVideoState({ ...videoState, trimRange: [0, videoDuration] });
  };

  const resetEditor = () => {
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
      originalFileType: '',
      convertedFileType: '',
      processingTime: '',
    });
    setVideoUpload(null);
  };
  

  const load = async () => {
    if (!isBrowser()) {
      console.warn('FFmpeg is not supported in SSR');
      return;
    }
  
    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      if(ffmpegRef.current === null) ffmpegRef.current = new FFmpeg();
      
      const ffmpeg = ffmpegRef.current;
  
  
      // 加載 FFmpeg 所需的核心文件
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
  
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Error loading FFmpeg:', error);
      setError('Failed to load FFmpeg. Please try again.');
    }
  };

  const handleResizeAndUpload = async () => {
    if (!videoUpload || videoRef.current === null || !(videoRef.current instanceof HTMLVideoElement) || ffmpegRef.current === null) {
      setError(t("VideoEditor.noFile"));
      setStatus("error");
      return;
    }
    const ffmpeg =  ffmpegRef.current;
    const [startTime, endTime] = videoState.trimRange;
    const duration = endTime - startTime;
    if (duration <= 0) {
      setError(t("VideoEditor.invalidTrim"));
      setStatus("error");
      return;
    }
    setStatus("loading");
    setTriggerBox(false);
    const targetWidth = 720;
    const targetHeight = 1280;
    const inputFileName = videoUpload.name;

    const processStartTime = performance.now();

    await ffmpeg.writeFile(inputFileName, await fetchFile(videoUpload));
    await ffmpeg.exec([
    //   '-i', inputFileName,
    //   '-vf', `scale=${targetWidth}:${targetHeight}`,
    //   '-r', '24', // 設定幀率
    // '-c:v', 'libx264', // 使用 H.264 編碼器
    //   '-b:v', 
    //   '-an',
    //   '-preset', 'fast',
    //   'output.mp4'
    '-i', 
    inputFileName,
    "-r", "18",
    "-c:v",
    "libx264",
    "-crf","18",
    "-c:a",
    "aac",
    "-b:a", "48k",
    "-vf",
    `scale=${targetWidth}:${targetHeight}`,
    "output.mp4"
    ]);

    const processEndTime = performance.now();
    const processingTime = ((processEndTime - processStartTime) / 1000).toFixed(2); // 處理時間

    // 讀取壓縮後的文件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await ffmpeg.readFile('output.mp4')) as any;
    const outputBlob = new Blob([data.buffer], { type: "video/mp4" });
    const outputURL = URL.createObjectURL(outputBlob);

    // 更新 outputDetails
    setOutputDetails({
      blobURL: outputURL,
      size: outputBlob.size,
      duration: duration || 0, // 如果視頻對象包含持續時間，則使用
      lastSize: videoUpload.size,
      originalFileType: videoUpload.type,
      convertedFileType: "video/mp4",
      processingTime: `${processingTime} seconds`,
    });

    // 自動觸發下載
    const downloadLink = document.createElement("a");
    downloadLink.href = outputURL;
    downloadLink.download = "compressed-video.mp4";
    downloadLink.click();

    setStatus("success");

  }

  // const handleResizeAndUpload = async () => {
  //   if (!videoUpload || videoRef.current === null || !(videoRef.current instanceof HTMLVideoElement)) {
  //     setError("No video file selected");
  //     setStatus("error");
  //     return;
  //   }
  
  //   setStatus("loading");
  //   setTriggerBox(false);
  
  //   const [startTime, endTime] = videoState.trimRange;
  //   const duration = endTime - startTime;
  //   if (duration <= 0) {
  //     setError("Invalid trim range");
  //     setStatus("error");
  //     return;
  //   }
  
  //   // Prepare canvas for resizing frames
  //   const canvas = document.createElement("canvas");
  //   const ctx = canvas.getContext("2d");
  //   const targetWidth = 480;
  //   const targetHeight = 854;
  //   canvas.width = targetWidth;
  //   canvas.height = targetHeight;

  //   if (!ctx) {
  //     setError("Failed to get canvas 2D context");
  //     setStatus("error");
  //     return;
  //   }
  
  //   // WebCodecs encoder
  //   const outputChunks: Uint8Array[] = [];

  //   // Encoder configuration remains the same
  //   const encoder = new VideoEncoder({
  //     output: (chunk) => {
  //       // Create a new buffer for the chunk data
  //       const arrayBuffer = new ArrayBuffer(chunk.byteLength);
  //       chunk.copyTo(new Uint8Array(arrayBuffer));
  //       outputChunks.push(new Uint8Array(arrayBuffer)); // Push the raw data to the array
  //     },
  //     error: (error) => {
  //       console.error("VideoEncoder error:", error);
  //       setError("Video encoding failed");
  //       setStatus("error");
  //     },
  //   });

  //   if (!(await VideoEncoder.isConfigSupported({
  //     codec: "vp8",
  //     height: targetHeight,
  //     width: targetWidth
  //   }))) {
  //     setError("Codec VP8 not supported");
  //     setStatus("error");
  //     return;
  //   }
  
  //   encoder.configure({
  //     codec: "vp8", // Use VP8 for better browser support
  //     width: targetWidth,
  //     height: targetHeight,
  //     framerate: 24,
  //     // hardwareAcceleration: "prefer-hardware",
  //   });
  
  //   let currentTime = startTime;
  //   const frameInterval = 1 / 24; // 24 fps
  
  //   // new Promise<void>((resolve, reject) => {
  //   //   const processFrames = async () => {
  //   //     while (currentTime < endTime) {
  //   //       videoRef.current!.currentTime = currentTime;
  
  //   //       await new Promise<void>((resolve, reject) => {
  //   //         videoRef.current!.onseeked = () => resolve();
  //   //         videoRef.current!.onerror = () => reject(new Error("Video seek failed"));
  //   //       });
  
  //   //       if (videoRef.current) {
  //   //         ctx.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight);
  //   //       }else {
  //   //         reject(new Error("Video element not found"));
  //   //         setError("Video element not found");
  //   //         setStatus("error");
  //   //       }
  
  //   //       const frame = new VideoFrame(canvas, {
  //   //         timestamp: (currentTime - startTime) * 1000,
  //   //       });
  //   //       encoder.encode(frame);
  //   //       frame.close();
  
  //   //       currentTime += frameInterval;
  //   //     }
  
  //   //     encoder.flush().then(() => {
  //   //       encoder.close();
  //   //       resolve();
  //   //     });
  //   //   };
  
  //   //   processFrames().catch(reject);
  //   // })
  //   //   .then(() => {
  //   //     setStatus("success");
  
  //   //     // Create a Blob from the encoded chunks
  //   //     const outputBlob = new Blob(
  //   //       outputChunks.map((chunk) => new Uint8Array(chunk.byteLength)),
  //   //       { type: "video/webm" }
  //   //     );
  //   //     const outputURL = URL.createObjectURL(outputBlob);
  
  //   //     setOutputDetails({
  //   //       blobURL: outputURL,
  //   //       size: outputBlob.size,
  //   //       duration,
  //   //       lastSize: videoUpload.size,
  //   //       originalFileType: videoUpload.type,
  //   //       convertedFileType: "video/webm",
  //   //     });

  //   //     // Automatically trigger download
  //   //   const downloadLink = document.createElement("a");
  //   //   downloadLink.href = `${outputURL}`;
  //   //   downloadLink.download = "processed-video.webm";
  //   //   document.body.appendChild(downloadLink);
  //   //   downloadLink.click();
  //   //   document.body.removeChild(downloadLink);

  
  //   //     setStatus("success");
  //   //   })
  //   //   .catch((error) => {
  //   //     console.error("Error during video processing:", error);
  //   //     setError("Failed to process video");
  //   //     setStatus("error");
  //   //   });
  //   try {
  //     while (currentTime < endTime) {
  //       videoRef.current.currentTime = currentTime;
  
  //       await new Promise<void>((resolve, reject) => {
  //         videoRef.current!.onseeked = () => resolve();
  //         videoRef.current!.onerror = () => reject(new Error("Video seek failed"));
  //       });
  
  //       ctx.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight);
  
  //       const frame = new VideoFrame(canvas, {
  //         timestamp: (currentTime - startTime) * 1000,
  //       });
  //       encoder.encode(frame);
  //       frame.close();
  
  //       currentTime += frameInterval;
  //     }
  
  //     await encoder.flush();
  //     encoder.close();
  
  //     const outputBlob = new Blob(outputChunks, { type: "video/webm" });
  //     const outputURL = URL.createObjectURL(outputBlob);
  
  //     setOutputDetails({
  //       blobURL: outputURL,
  //       size: outputBlob.size,
  //       duration,
  //       lastSize: videoUpload.size,
  //       originalFileType: videoUpload.type,
  //       convertedFileType: "video/webm",
  //     });
  
  //     // Automatically trigger download
  //     const downloadLink = document.createElement("a");
  //     downloadLink.href = outputURL;
  //     downloadLink.download = "processed-video.webm";
  //     downloadLink.click();
  
  //     setStatus("success");
  //   } catch (error) {
  //     console.error("Error during video processing:", error);
  //     setError("Failed to process video");
  //     setStatus("error");
  //   }
  // };

  return (
    <div className="mx-auto relative w-[500px]">
      <div className="relative w-full flex items-center gap-4">
        <button
          className="py-2 color-black/50 bg-white rounded-full w-auto text-center flex items-center justify-center border-black border-solid border px-6 gap-4"
          onClick={resetEditor}
        >
          <FaVideo className="text-base" />
          {t("VideoEditor.editVideo")}
        </button>
        {status !== "idle" && (
          <div
            className={`${status === "error" ? "bg-red-400/20":"bg-black/20"} px-4 text-left text-base color-black/70 rounded-3xl w-auto duration-500 transform overflow-y-hidden flex flex-col justify-center`}
            style={{
              height:
                outputDetails.blobURL !== null &&
                outputDetails.blobURL.length > 0 &&
                toogleUploadDetails
                  ? 854
                  : 42,
            }}
          >
              <div className="w-full flex justify-between items-center h-auto gap-4">
                {status === "loading" ?
                  <p className="pl-6">{t("VideoEditor.uploading")}</p>
                  :
                  status === "error" ?
                  <p className="pl-6 text-red-600">{t("VideoEditor.uploadFailed")}</p>
                  :
                  <p className="pl-6 text-green-700 ">{t("VideoEditor.uploadSuccess")}</p>
                }
                <div className="flex gap-4 items-center">
                {status === "loading" ? (
                  <ImSpinner className="animate-spin text-lg origin-center" />
                ) : (
                  <FaCheck className="text-green-700 text-lg "/>
                )}
                  <button
                    className=""
                    onClick={() => setToogleUploadDetails(!toogleUploadDetails)}
                  >
                    {toogleUploadDetails ? (
                      <FaChevronUp
                        className={`${
                          outputDetails.blobURL !== null &&
                          outputDetails.blobURL.length > 0
                            ? "text-black/70 cursor-pointer"
                            : "text-black/20 cursor-default"
                        } text-lg`}
                      />
                    ) : (
                      <FaChevronDown
                        className={`${
                          outputDetails.blobURL !== null &&
                          outputDetails.blobURL.length > 0
                            ? "text-black/70 cursor-pointer"
                            : "text-black/20 cursor-default"
                        } text-lg`}
                      />
                    )}
                  </button>
                </div>
              </div>
              <div className={`overflow-y-auto ${toogleUploadDetails? "h-[845px]":"h-[0px]"}`}>
                {status === "success" && outputDetails.blobURL && (
                  <div className="bg-black/20 p-4 text-left text-base color-black/70 overflow-y-auto">
                    {error !== null && error.length > 0 ? (
                      <p>{error}</p>
                    ) : (
                      <div>
                        <p>after render URL :{outputDetails.blobURL}</p>
                        <p>Duration :{outputDetails.duration}</p>
                        <p>
                          Size :{(outputDetails.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <p>
                          Last Size :
                          {(outputDetails.lastSize / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <p>lastFormat :{outputDetails.originalFileType}</p>
                        <p>current Format :{outputDetails.convertedFileType}</p>
                        <p>Processing Time :{outputDetails.processingTime}</p>
                        {/* <video
                          className="border border-black/30 border-solid mt-4 w-full h-[854px]"
                          controls
                        >
                          <source  src={outputDetails.blobURL} type="video/webm; codecs='vp8'"/>
                          Your browser does not support the video tag.
                        </video> */}
                        <video
                        className="border border-black/30 border-solid mt-4 w-full h-auto" controls
                        src={outputDetails.blobURL}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
          </div>
        )}
      </div>

        <div className={`${triggerBox ?"block":"hidden"} fixed bg-black/30 backdrop-blur-sm top-0 left-0 w-full md:h-full h-[100dvh]`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:max-w-[450px] md:h-auto h-full w-full aspect-[9/16] border-white border-2 border-solid overflow-hidden">
            <div className="h-full w-full bg-black/50 flex items-center justify-center duration-500 transform">
              <button
                className="text-white text-2xl absolute -right-0 -top-0 z-[999]"
                onClick={resetEditor}
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
        <div className="w-full h-[700px] overflow-y-auto">
          <Image 
            src={SampleImage}
            layout="responsive"
            className="w-full h-auto object-contain"
            alt="sampleImage1"
          />
          <Image 
            src={SampleImage}
            layout="responsive"
            className="w-full h-auto object-contain"
            alt="sampleImage1"
          />
          <Image 
            src={SampleImage}
            layout="responsive"
            className="w-full h-auto object-contain"
            alt="sampleImage1"
          />
          <Image 
            src={SampleImage}
            layout="responsive"
            className="w-full h-auto object-contain"
            alt="sampleImage1"
          />
          <Image 
            src={SampleImage}
            layout="responsive"
            className="w-full h-auto object-contain"
            alt="sampleImage1"
          />
        </div>
    </div>
  );
};
