import pauseIcon from "../assets/images/pause.svg"
import playIcon from "../assets/images/play.svg"
import volumeOn from "../assets/images/volume_on.svg"
import volumeOff from "../assets/images/volume_off.svg"
import volumeMute from "../assets/images/volume_mute.svg"

// A package of relevant HTML elements
interface Context {
    video: HTMLVideoElement;
    progressBar: HTMLDivElement;
    scrubber: HTMLInputElement;
}

// Acts as the composite of mode specific behavior/functionality (If I understood composition correctly from our meeting)
// Functionality that's shared between modes (pause play, fullscreen, etc.) are set when declaring event listeners
interface PlayerMode {
    videoSrc: string;
    canSeek: boolean;
    isAutoHideControlsEnabled: boolean;

    // CSS class to apply to the video playback progress bar
    progressBarCssClass: string;

    /**
     * Computes the current progress of video playback in terms of a percentage (output is between 0 and 100), which
     * will be visualized for the end user.
     */
    calculateProgressPercent(currentTime: number, videoDuration: number): number;
}

// Mode for main content
const normalMode: PlayerMode = {
    videoSrc: "", // Will be auto-set from the video element
    canSeek: true,
    isAutoHideControlsEnabled: true, // Not implemented yet in PlayerController
    progressBarCssClass: "bg-blue-400",

    // Track progress for entire video
    calculateProgressPercent: (currentTime: number, videoDuration: number) => {
        return (currentTime / videoDuration) * 100;
    }
};

// Mode for ad
const adMode: PlayerMode = {
    videoSrc: "../../ad_video.mp4",
    canSeek: false,
    isAutoHideControlsEnabled: true, // Not implemented yet in PlayerController
    progressBarCssClass: "bg-yellow-300",

    // Tracks first 5 seconds of ad
    calculateProgressPercent: (currentTime, videoDuration) => {
        return Math.min(100, (currentTime / 5) * 100);
    },
};

class VideoController {
    private ctx: Context;
    private mode: PlayerMode;
    private normalModeResumptionTime: number = 0;
    // private autoHideTimeout: ReturnType<typeof setTimeout>;

    constructor(ctx: Context, initialMode: PlayerMode) {
        this.ctx = ctx;
        this.mode = initialMode;
        this.switchMode(initialMode);
        this.initPlayerControls();
    }

    private switchMode(newMode: PlayerMode) {
        this.ctx.progressBar.classList.remove(this.mode.progressBarCssClass);
        this.mode = newMode;
        this.ctx.progressBar.classList.add(this.mode.progressBarCssClass);
        this.ctx.video.src = this.mode.videoSrc;
    }

    switchToAdMode() {
        this.normalModeResumptionTime = this.ctx.video.currentTime;
        this.switchMode(adMode);
        this.ctx.video.currentTime = 0;
        this.playVideo();
    }

    switchToNormalMode() {
        this.switchMode(normalMode);
        this.ctx.video.currentTime = this.normalModeResumptionTime;
        this.playVideo();
    }

    private setPlayPauseIcon(src: string) {
        const iconImgElement = document.getElementById("play-pause-icon");
        if (!(iconImgElement instanceof HTMLImageElement)) return;
        iconImgElement.src = src;
    }

    playVideo() {
        this.ctx.video.play();
        this.setPlayPauseIcon(pauseIcon.src);
    }

    pauseVideo() {
        this.ctx.video.pause();
        this.setPlayPauseIcon(playIcon.src);
    }

    initPlayerControls() {
        // Grab all needed HTML elements from context
        const { video, progressBar, scrubber } = this.ctx;

        // Utility function for finding an element by ID, ensuring it exists, then attaching a function to run on click.
        function attachClickListener(elementId: string, onClick: () => void) {
            const element = document.getElementById(elementId);
            if (!element) return;
            element.addEventListener("click", onClick);
        }

        // Handles progress display
        video.addEventListener("timeupdate", () => {
            let progressPercent;
            if (this.mode.calculateProgressPercent) {
                progressPercent = this.mode.calculateProgressPercent(video.currentTime, video.duration);
            } else {
                progressPercent = (video.currentTime / video.duration) * 100;
            }
            progressBar.style.width = progressPercent + "%";
        });

        // Handles timeline clicks, i.e. user requests to seek.
        scrubber.addEventListener("input", () => {
            if (!this.mode.canSeek) return;

            const percentIntoVideo = parseInt(scrubber.value);
            // Covert the percentage into the video into the number of seconds into the video
            video.currentTime = (percentIntoVideo / 100) * video.duration;
            progressBar.style.width = percentIntoVideo + "%";
        });

        // Toggle play button
        attachClickListener("play-btn", () => {
            if (video.paused) {
                this.playVideo();
            } else {
                this.pauseVideo();
            }
        });

        // Handles video fullscreen
        // Request fullscreen on div (not video) to not have the default fullscreen UI
        const videoContainer = document.getElementById("video-container");
        if (!(videoContainer instanceof HTMLDivElement)) return;
        attachClickListener("fullscreen-btn", () => {
            if (document.fullscreenElement !== videoContainer) {
                videoContainer.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });

        // Handles Ad Play button (temporary), should disappear when in ad mode
        attachClickListener("play-ad-btn", () => this.switchToAdMode());

        // Handles Skip Ad button, disappears when in main mode
        attachClickListener("skip-ad-btn", () => this.switchToNormalMode());

        // Handles current time display
        const displayedTime = document.getElementById("current-video-time");
        if (!(displayedTime instanceof HTMLSpanElement)) return;
        video.addEventListener("timeupdate", () => {
            displayedTime.textContent = this.formatDuration(video.currentTime);
        });

        // Handles display for video's duration.  Automatically runs when the video's src changes.
        video.addEventListener("loadedmetadata", () => {
            const displayedDuration = document.getElementById("full-video-duration");
            if (!(displayedDuration instanceof HTMLSpanElement)) return;
            displayedDuration.textContent = this.formatDuration(this.ctx.video.duration);
        });
        // Handles auto hiding video controls
        // const videoContainer = document.getElementById("video-container");
        // const controls = document.getElementById("custom-control-container");

        // if (!(videoContainer instanceof HTMLDivElement && controls instanceof HTMLDivElement)) return;

        // // Use timeout id
        // videoContainer.addEventListener("mousemove", () => {
        //     this.mode.handleShowControls(this.ctx);
        // })

        // videoContainer.addEventListener("mouseleave", () => {
        //     this.mode.handleHideControls(this.ctx);
        // })
    }

    /**
     * Converts a number in seconds to a formatted string of MM:SS.  Note that this will not format hours; e.g. a
     * duration of 110 minutes will be displayed as 110:00.
     */
    formatDuration(seconds: number) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        // Seconds are padded with a leading zero
        const secondsFormat = String(remainingSeconds).padStart(2, "0");
        return `${minutes}:${secondsFormat}`;
    }
}


function init() {
    const video = document.getElementById("media-video");
    const progressBar = document.getElementById("progress-bar");
    const scrubber = document.getElementById("scrubber");

    if (!(video instanceof HTMLVideoElement)) return;
    if (!(progressBar instanceof HTMLDivElement)) return;
    if (!(scrubber instanceof HTMLInputElement)) return;

    const ctx: Context = {
        video,
        progressBar,
        scrubber
    };

    normalMode.videoSrc = video.currentSrc;
    // Create VideoController instance
    const controller = new VideoController(ctx, normalMode);
}

init();
