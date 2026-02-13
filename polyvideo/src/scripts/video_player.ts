import pauseIcon from "../assets/images/pause.svg"
import playIcon from "../assets/images/play.svg"
import volumeOn from "../assets/images/volume_on.svg"
import volumeOff from "../assets/images/volume_off.svg"
import volumeMute from "../assets/images/volume_mute.svg"

const AD_ADVANCE_WARNING = 35 // Percent into video when first warning appears
const AD_PLAYS = 50 // Percent into the video when ad plays

/**
 * TODOs
 *
 * Place ad at some configured time
 * Volume slider
 * Make sure ad elements -- play ad and skip buttons appear at the right time and screen location
 * Bottom right persistant play ad button that is dismissable
 * Above tick, "Ad will play here" notification that disappears on autohide
 * Add ad location tick
 * Video scrubber mouse clicks are not completely precise
 * Change profile icons
 * Re-add Auto Hide Controls
 * Autoskip when ad ends
 */

// A package of relevant HTML elements
interface Context {
    video: HTMLVideoElement;
    progressBar: HTMLDivElement;
    scrubber: HTMLInputElement;
}

// Acts as the composite of mode specific behavior/functionality
// Functionality that's shared between modes (pause play, fullscreen, etc.) are set when declaring event listeners
interface PlayerMode {
    videoSrc: string;
    canSeek: boolean;
    isAutoHideControlsEnabled: boolean;
    shouldAdAppear: boolean;

    // CSS class to apply to the video playback progress bar
    progressBarCssClass: string;
    
    /**
     * Computes the current progress of video playback in terms of a percentage (output is between 0 and 100), which
     * will be visualized for the end user.
     */
    calculateProgressPercent(currentTime: number, videoDuration: number): number;

    hideSkipAdButton(progressPercent: number): boolean;

    hidePlayAdButton(progressPercent: number): boolean;
}

// Mode for main content
const normalMode: PlayerMode = {
    videoSrc: "", // Will be auto-set from the video element
    canSeek: true,
    isAutoHideControlsEnabled: true, // Not implemented yet in PlayerController
    shouldAdAppear: true, // Currently plays ad 50% through the video
    progressBarCssClass: "bg-blue-400",
    
    // Track progress for entire video
    calculateProgressPercent: (currentTime: number, videoDuration: number) => {
        if (!Number.isFinite(videoDuration)) return 0;
        return (currentTime / videoDuration) * 100;
    },

    hideSkipAdButton: (progressPercent: number) => true,

    hidePlayAdButton: (progressPercent: number) => {
        return progressPercent < AD_ADVANCE_WARNING
    }
};

// Mode for ad
const adMode: PlayerMode = {
    videoSrc: "../../ad_video.mp4",
    canSeek: false,
    isAutoHideControlsEnabled: false, // Not implemented yet in PlayerController
    shouldAdAppear: false,
    progressBarCssClass: "bg-yellow-300",

    // Tracks first 5 seconds of ad
    calculateProgressPercent: (currentTime: number, videoDuration: number) => {
        return Math.min(100, (currentTime / 5) * 100);
    },

    hideSkipAdButton: (progressPercent: number) => {
        // If in adMode and 5 seconds have passed (tracked by progressPercent), display skip button
        return progressPercent < 100;
    },

    hidePlayAdButton: (progressPercent: number) => true
};

class VideoController {
    private ctx: Context;
    private mode: PlayerMode;
    private normalModeResumptionTime: number = 0;
    // Flag to track if viewer has watched an ad (only checks one ad)
    private adPlayed: boolean;
    // private autoHideTimeout: ReturnType<typeof setTimeout>;

    constructor(ctx: Context, initialMode: PlayerMode) {
        this.ctx = ctx;
        this.mode = initialMode;
        this.switchMode(initialMode);
        this.initPlayerControls();
        this.adPlayed = false;
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
        this.adPlayed = true;
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

    private updateVolumeIcon() {
        // Icon dependant on state of volume
        let nextSrc: string;
        if (this.ctx.video.muted) {
            nextSrc = volumeMute.src;
        } else if (this.ctx.video.volume === 0) {
            nextSrc = volumeOff.src;
        } else {
            nextSrc = volumeOn.src;
        }
        const iconImgElement = document.getElementById("volume-icon");
        if (!(iconImgElement instanceof HTMLImageElement)) return;

        iconImgElement.src = nextSrc;
    }

    playVideo() {
        this.ctx.video.play();
        this.setPlayPauseIcon(pauseIcon.src);
    }

    pauseVideo() {
        this.ctx.video.pause();
        this.setPlayPauseIcon(playIcon.src);
    }

    muteVideoToggle() {
        this.ctx.video.muted = !this.ctx.video.muted;
        this.updateVolumeIcon();
    }

    initPlayerControls() {
        // Grab all needed HTML elements from context
        const { video, progressBar, scrubber } = this.ctx;

        // Initialize volume icon
        this.updateVolumeIcon();

        // Utility function for finding an element by ID, ensuring it exists, then attaching a function to run on click.
        function attachClickListener(elementId: string, onClick: () => void) {
            const element = document.getElementById(elementId);
            if (!element) return;
            element.addEventListener("click", onClick);
        }

        // Handles progress display and visibility of the skip ad button and play ad now button
        const skipAdBtn = document.getElementById("skip-ad-btn");
        if (!(skipAdBtn instanceof HTMLButtonElement)) return;
        const playAdContainer = document.getElementById("play-ad-container");
        if (!(playAdContainer instanceof HTMLDivElement)) return;
        video.addEventListener("timeupdate", () => {
            let progressPercent;
            if (this.mode.calculateProgressPercent) {
                progressPercent = this.mode.calculateProgressPercent(video.currentTime, video.duration);
            } else {
                progressPercent = (video.currentTime / video.duration) * 100;
            }
            progressBar.style.width = progressPercent + "%";

            if (this.mode.hideSkipAdButton){
                skipAdBtn.hidden = this.mode.hideSkipAdButton(progressPercent);
            }

            if (this.mode.shouldAdAppear && !this.adPlayed && progressPercent > AD_PLAYS){
                this.switchToAdMode();
            }

            if (this.mode.hidePlayAdButton && !this.adPlayed){
                playAdContainer.hidden = this.mode.hidePlayAdButton(progressPercent);
            }
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

        // Handles Skip Ad button, disappears when in main mode
        attachClickListener("skip-ad-btn", () => this.switchToNormalMode());

        // Handles Ad Play button (temporary), should disappear when in ad mode
        attachClickListener("play-ad-btn", () => this.switchToAdMode());

        // Handles Ad Play notification dismissal
        attachClickListener("play-ad-dismiss-btn", () => {
            playAdContainer.hidden = true
        });

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

        // Handles muting video
        attachClickListener("mute-btn", () => this.muteVideoToggle());

        // Handles user request to change volume using the slider
        const volumeSlider = document.getElementById("volume-slider");
        if (!(volumeSlider instanceof HTMLInputElement)) return;
        volumeSlider.addEventListener("input", () => {
            const volumeLevel = parseInt(volumeSlider.value);
            this.ctx.video.volume = volumeLevel / 100;
            
            // If user changes volume slider while muted, automatically umute
            if (volumeLevel > 0 && this.ctx.video.muted) {
                this.muteVideoToggle();
            }
            this.updateVolumeIcon();
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
        scrubber,
    };

    normalMode.videoSrc = video.currentSrc;
    // Create VideoController instance
    const controller = new VideoController(ctx, normalMode);
}

init();
