export interface VideoPlayerState {
    isPlaying: boolean;
    trimRange: [number, number];
    video: string | null;
    currentTime: number;
}

export interface OutputVideoState {
    blobURL: string | null;
    duration: number;
    size: number;
    lastSize: number;
    originalFileType: string;
    convertedFileType: string;
}