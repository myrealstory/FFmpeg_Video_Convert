import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { IncomingForm } from "formidable";
import { Readable } from "stream";

ffmpeg.setFfmpegPath("C:/ffmpeg/bin/ffmpeg.exe");

// Disable body parsing (required for file uploads)
export const config = {
  api: {
    bodyParser: false,
  },
};


// Convert a Fetch Request to a Node.js readable stream
const convertRequestToStream = async (req: Request): Promise<Readable> => {
    const body = await req.arrayBuffer();
    const stream = new Readable();
    stream.push(Buffer.from(body));
    stream.push(null); // End the stream

    //Mock headers
    const headers: Record<string,string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return Object.assign(stream, {
        headers,
        method: req.method,
        url: req.url,
    });
  };

// Parse form data with formidable
const parseForm = async (
  req: Request
): Promise<{ fields: Record<string, string>; files: any }> => {

  const form = new IncomingForm({ keepExtensions: true });
  console.log("parseForm req:",form);
  
  const nodeReq = await convertRequestToStream(req);
  console.log("stream:",nodeReq);

  return new Promise((resolve, reject) => {
    form.parse(nodeReq as any, (err, fields, files) => {
      if (err) reject(err);
      else {
        console.log("fields:",fields, "files:",files);
        resolve({ fields, files });}
    });
  });
};

export async function POST(
    req: Request
) {
  
  try {
    console.log("POST req:",req);
    const { fields, files } = await parseForm(req);
    console.log("Post fields:",fields, "POST files:",files);

    const videoFile = files.file ? files.file[0] : null;
    console.log("videoFile:",videoFile);

    if (!videoFile || !videoFile.filepath) {
        return NextResponse.json({ error: "No video file provided" }, { status: 400 });
      }

       // Validate and copy the file to a permanent directory
       const absolutePath = path.resolve(videoFile.filepath);
       console.log("absolutePath:",absolutePath);
  
      // Validate file type and size
      const supportedTypes = ["video/mp4", "video/avi", "video/mov"];
      if (!supportedTypes.includes(videoFile.mimetype)) {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
      }
  
      const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB
      if (videoFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "File is too large" }, { status: 400 });
      }
      const lang = fields.lang || "tc";
    const outputDir = path.resolve(`public/${lang}/optimized-videos`);
    await fs.mkdir(outputDir, { recursive: true });
    console.log("outputDir:",outputDir);

    const uniqueFilename = `${Date.now()}-optimized.mp4`;
    const outputPath = path.join(outputDir, uniqueFilename);
    console.log("outputPath:",outputPath);

    // Retrieve trim start and end from fields
    const trimStart = parseFloat(fields.trimStart || "0"); // Default to 0
    const trimEnd = parseFloat(fields.trimEnd || "0");

    if (trimEnd <= trimStart) {
        return NextResponse.json({ error: "Invalid trim range" }, { status: 400 });
    }

    const duration = trimEnd - trimStart;
    console.log("duration:",duration);

    // Process video with FFmpeg
    // Process video with FFmpeg
await new Promise<void>((resolve, reject) => {
    ffmpeg(absolutePath)
      .setStartTime(trimStart) // Start time of the video
      .setDuration(duration) // Duration to extract
      .videoCodec("libx264") // Set the video codec to H.264
      .size("480x854") // Resize the video
      .outputOptions("-crf 28") // Set compression rate factor (lower = better quality)
      .on("start", (commandLine) => {
        console.log("Spawned FFmpeg with command:", commandLine); // Log the FFmpeg command for debugging
      })
      .on("progress", (progress) => {
        console.log(
          `Processing: ${progress.frames} frames completed, ${progress.percent}% done`
        );
      })
      .on("end", () => {
        console.log("Video processing completed successfully!");
        resolve();
      })
      .on("error", (err, stdout, stderr) => {
        console.error("FFmpeg encountered an error:", err.message);
        console.error("FFmpeg stderr output:", stderr);
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .save(outputPath); // Save the output file to the specified path
  });
  
    console.log("complete ffmpeg");

    const outputUrl = `/optimized-videos/${uniqueFilename}`;
    const fileStats = await fs.stat(outputPath);
    console.log("fileStats:",fileStats);

    return NextResponse.json({
      message: "Video processed successfully",
      videoURL: outputUrl,
      size: fileStats.size,
      duration,
      originalFileType: videoFile.mimetype,
      convertedFileType: "video/mp4",
      covertedFileName: uniqueFilename,
    });
  } catch (error) {
    console.error("Error optimizing video:", error);
    return NextResponse.json(
        { error: "Failed to process video" },
        { status: 500 }
      );
  }
}
