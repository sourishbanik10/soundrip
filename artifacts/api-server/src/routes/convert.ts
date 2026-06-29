import { Router } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";

const execAsync = promisify(exec);
const router = Router();

const TMP_DIR = "/tmp/mp3-converter";
fs.mkdirSync(TMP_DIR, { recursive: true });

type JobStatus = "pending" | "processing" | "completed" | "failed";

interface Job {
  jobId: string;
  status: JobStatus;
  title: string | null;
  filename: string | null;
  progress: number | null;
  error: string | null;
  source: string | null;
  createdAt: string;
  outputPath: string | null;
}

const jobs = new Map<string, Job>();
const MAX_HISTORY = 20;

function addJob(job: Job) {
  jobs.set(job.jobId, job);
  if (jobs.size > MAX_HISTORY) {
    const oldest = Array.from(jobs.keys())[0];
    const oldJob = jobs.get(oldest);
    if (oldJob?.outputPath && fs.existsSync(oldJob.outputPath)) {
      fs.unlinkSync(oldJob.outputPath);
    }
    jobs.delete(oldest);
  }
}

async function convertToMp3(inputPath: string, jobId: string): Promise<string> {
  const outputPath = path.join(TMP_DIR, `${jobId}.mp3`);
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate(192)
      .format("mp3")
      .on("progress", (progress: { percent?: number }) => {
        const job = jobs.get(jobId);
        if (job) {
          job.progress = Math.min(progress.percent ?? 0, 99);
        }
      })
      .on("end", () => resolve(outputPath))
      .on("error", (err: Error) => reject(err))
      .save(outputPath);
  });
}

async function downloadYoutube(url: string, jobId: string): Promise<{ videoPath: string; title: string }> {
  const videoPath = path.join(TMP_DIR, `${jobId}_input.%(ext)s`);
  const job = jobs.get(jobId);

  const { stdout: titleOut } = await execAsync(
    `yt-dlp --get-title --no-playlist "${url}" 2>/dev/null || echo "Unknown Title"`
  );
  const title = titleOut.trim() || "Unknown Title";
  if (job) job.title = title;

  const { stdout: extOut } = await execAsync(
    `yt-dlp --get-filename --no-playlist -o "${videoPath}" "${url}" 2>/dev/null`
  );
  const resolvedPath = extOut.trim();

  await execAsync(
    `yt-dlp --no-playlist -f "bestaudio/best" -o "${videoPath}" "${url}" 2>/dev/null`
  );

  return { videoPath: resolvedPath, title };
}

const upload = multer({
  dest: TMP_DIR,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["video/mp4", "video/x-matroska", "video/quicktime", "video/x-msvideo", "video/webm", "video/mpeg", "audio/mpeg", "audio/mp4"];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(mp4|mkv|mov|avi|webm|mpeg|mpg)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

router.post("/convert/youtube", async (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url || typeof url !== "string" || !url.includes("youtube") && !url.includes("youtu.be")) {
    res.status(400).json({ error: "A valid YouTube URL is required" });
    return;
  }

  const jobId = uuidv4();
  const job: Job = {
    jobId,
    status: "pending",
    title: null,
    filename: null,
    progress: 0,
    error: null,
    source: "youtube",
    createdAt: new Date().toISOString(),
    outputPath: null,
  };
  addJob(job);

  (async () => {
    try {
      job.status = "processing";
      const { videoPath, title } = await downloadYoutube(url, jobId);
      job.title = title;
      job.progress = 30;

      const outputPath = await convertToMp3(videoPath, jobId);
      job.outputPath = outputPath;
      job.filename = `${title.replace(/[^a-z0-9_\- ]/gi, "_").slice(0, 80)}.mp3`;
      job.progress = 100;
      job.status = "completed";

      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    } catch (err) {
      job.status = "failed";
      job.error = err instanceof Error ? err.message : "Conversion failed";
    }
  })();

  res.status(202).json({ jobId, title: job.title });
});

router.post("/convert/upload", upload.single("video"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No video file uploaded" });
    return;
  }

  const jobId = uuidv4();
  const originalName = req.file.originalname.replace(/\.[^.]+$/, "");
  const job: Job = {
    jobId,
    status: "pending",
    title: originalName,
    filename: null,
    progress: 0,
    error: null,
    source: "upload",
    createdAt: new Date().toISOString(),
    outputPath: null,
  };
  addJob(job);

  const uploadedPath = req.file.path;

  (async () => {
    try {
      job.status = "processing";
      const outputPath = await convertToMp3(uploadedPath, jobId);
      job.outputPath = outputPath;
      job.filename = `${originalName.replace(/[^a-z0-9_\- ]/gi, "_").slice(0, 80)}.mp3`;
      job.progress = 100;
      job.status = "completed";

      if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
    } catch (err) {
      job.status = "failed";
      job.error = err instanceof Error ? err.message : "Conversion failed";
      if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
    }
  })();

  res.status(202).json({ jobId, title: originalName });
});

router.get("/convert/status/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  const { outputPath: _o, ...rest } = job;
  res.json(rest);
});

router.get("/convert/download/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job || job.status !== "completed" || !job.outputPath) {
    res.status(404).json({ error: "File not found or not ready" });
    return;
  }
  if (!fs.existsSync(job.outputPath)) {
    res.status(410).json({ error: "File has expired" });
    return;
  }
  res.download(job.outputPath, job.filename ?? "audio.mp3");
});

router.get("/convert/history", (_req, res) => {
  const history = Array.from(jobs.values())
    .map(({ outputPath: _o, ...rest }) => rest)
    .reverse()
    .slice(0, 10);
  res.json(history);
});

export default router;
