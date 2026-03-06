import pauseIcon from "../assets/images/pause.svg"
import playIcon from "../assets/images/play.svg"
import volumeOn from "../assets/images/volume_on.svg"
import volumeOff from "../assets/images/volume_off.svg"
import volumeMute from "../assets/images/volume_mute.svg"

// Class responsible for all Ad notifications
import { NotificationController } from "./notification_controller"

const AD_ADVANCE_WARNING = 30 // Percent into video when first warning appears and panel warning 
const AD_PLAYS = 50 // Percent into the video when ad plays

/**
 * MVP features
 * Dismissable ad soon button -/
 * Tick mark and small panel that explains it -/
 * Auto-hiding controls -/
 * Goes back to play the video when ad finishes (autoskip when ad ends) -/ 
 * Render a video player that doesn't have all of the ad soon play now features based on url parameters
 *       Introduce a third mode
 *          ex: should ad soon notifcation appear on one mode 
 * Make tick mark darker -/
 * cancel dismiss be a circular overlay on top -/
 * Cleanup and Rename method stubs
 * There is a telemetry system in place (requires backend)
 *      Set up database...
 *      Set up backend API...
 */

/**
 * Other nice to haves
 *
 * Polish styles cross-platform
 * Video scrubber mouse clicks are not completely precise
 * Change profile icons
 */

// A package of relevant HTML elements
interface Context {
    video: HTMLVideoElement;
    progressBar: HTMLDivElement;
    scrubber: HTMLInputElement;
    customControlContainer: HTMLDivElement;
}

// Acts as the composite of mode specific behavior/functionality
// Functionality that's shared between modes (pause play, fullscreen, etc.) are set when declaring event listeners
interface PlayerMode {
    videoSrc: string;
    canSeek: boolean;
    isAutoHideControlsEnabled: boolean;
    shouldAdAppear: boolean;
    isAutoSkipAdEnabled: boolean;

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
    isAutoSkipAdEnabled: false,

    progressBarCssClass: "bg-blue-400",

    // Track progress for entire video
    calculateProgressPercent: (currentTime: number, videoDuration: number) => {
        if (!Number.isFinite(videoDuration)) return 0;
        return (currentTime / videoDuration) * 100;
    },

    hideSkipAdButton: (progressPercent: number) => true,

    // Should check for this (and the skip button be here or moved to videoController also?)
    hidePlayAdButton: (progressPercent: number) => {
        return progressPercent < AD_ADVANCE_WARNING;
    }
};

// Mode for ad
const adMode: PlayerMode = {
    videoSrc: "../../ad_video.mp4",
    canSeek: false,
    isAutoHideControlsEnabled: false, // Not implemented yet in PlayerController
    shouldAdAppear: false,
    isAutoSkipAdEnabled: true,

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
    // Flag to track if play ad button has been dismissed (will be eventually be in a new "PlayAdControl" class)
    private playAdBtnDissmissed: boolean
    private autoHideTimeout: ReturnType<typeof setTimeout> | null = null;


    constructor(ctx: Context, initialMode: PlayerMode) {
        this.ctx = ctx;
        this.mode = initialMode;
        this.switchMode(initialMode);
        this.initPlayerControls();
        this.adPlayed = false;
        this.playAdBtnDissmissed = false;
    }

    // Clear timeout on mode switches
    private switchMode(newMode: PlayerMode) {
        this.ctx.progressBar.classList.remove(this.mode.progressBarCssClass);
        this.mode = newMode;
        this.ctx.progressBar.classList.add(this.mode.progressBarCssClass);
        this.ctx.video.src = this.mode.videoSrc;
    }

    switchToAdMode() {
        this.adPlayed = true;
        this.normalModeResumptionTime = this.ctx.video.currentTime;
        this.switchMode(adMode);
        this.ctx.video.currentTime = 0;
        this.playVideo();
        this.showControls();
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

    showControls() {
        this.ctx.customControlContainer.classList.remove("opacity-0");
        this.ctx.customControlContainer.classList.add("opacity-100");
    }

    hideControls() {
        this.ctx.customControlContainer.classList.remove("opacity-100");
        this.ctx.customControlContainer.classList.add("opacity-0");
    }

    clearAutoHideTimeout() {
        if (this.autoHideTimeout) {
            clearTimeout(this.autoHideTimeout);
            this.autoHideTimeout = null;
        }
    }

    initPlayerControls() {
        // Grab all needed HTML elements from context
        const { video, progressBar, scrubber, customControlContainer } = this.ctx;

        // Document queries for relevant HTML elements
        const skipAdBtn = document.getElementById("skip-ad-btn");
        // const playAdContainer = document.getElementById("play-ad-container");
        // const marker = document.getElementById("marker");
        const videoContainer = document.getElementById("video-container");
        const displayedTime = document.getElementById("current-video-time");
        const volumeSlider = document.getElementById("volume-slider");
        
        if (!(skipAdBtn instanceof HTMLButtonElement)) return;
        // if (!(playAdContainer instanceof HTMLDivElement)) return;
        // if (!(marker instanceof HTMLDivElement)) return;
        if (!(videoContainer instanceof HTMLDivElement)) return;
        if (!(displayedTime instanceof HTMLSpanElement)) return;
        if (!(volumeSlider instanceof HTMLInputElement)) return;

        // Initialize notification class
        const notifications = new NotificationController();

        // Initialize volume icon
        this.updateVolumeIcon();

        // Utility function for finding an element by ID, ensuring it exists, then attaching a function to run on click.
        function attachClickListener(elementId: string, onClick: () => void) {
            const element = document.getElementById(elementId);
            if (!element) return;
            element.addEventListener("click", onClick);
        }

        // Handles progress display and visibility of the skip ad button and play ad now button
        video.addEventListener("timeupdate", () => {
            let progressPercent;
            if (this.mode.calculateProgressPercent) {
                progressPercent = this.mode.calculateProgressPercent(video.currentTime, video.duration);
            } else {
                progressPercent = (video.currentTime / video.duration) * 100;
            }
            progressBar.style.width = progressPercent + "%";

            // Skip button visibility
            if (this.mode.hideSkipAdButton) {
                skipAdBtn.hidden = this.mode.hideSkipAdButton(progressPercent);
            }

            // Ad tick mark visibility (may just hide on mode switch once refactored to notif controller)
            if (this.adPlayed) {
                marker.hidden = true;
            }

            // Ad mode switch progress switch
            if (this.mode.shouldAdAppear && !this.adPlayed && progressPercent > AD_PLAYS) {
                this.switchToAdMode();
            }

            // Play ad button visibility
            // if (this.mode.hidePlayAdButton && !this.playAdBtnDissmissed) {
            //     playAdContainer.hidden = this.adPlayed ? true : this.mode.hidePlayAdButton(progressPercent);
            // }
            
            // Instead, pass in progress to NotificationController and controller handles all visivility
            notifications.update(progressPercent, this.mode.shouldAdAppear, this.mode.hidePlayAdButton);
        });

        // Handles behavior once a video ends
        video.addEventListener("ended", () => {
            // Autoskip once ad finishes
            if (this.mode.isAutoSkipAdEnabled) {
                this.switchToNormalMode();
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
        attachClickListener("play-ad-dismiss-btn", () => notifications.hidePlayAdBtn());

        // Handles current time display
        video.addEventListener("timeupdate", () => {
            displayedTime.textContent = this.formatDuration(video.currentTime);
        });

        // Handles display for video's duration.  Automatically runs when the video's src changes.
        video.addEventListener("loadedmetadata", () => {
            const displayedDuration = document.getElementById("full-video-duration");
            if (!(displayedDuration instanceof HTMLSpanElement)) return;
            displayedDuration.textContent = this.formatDuration(video.duration);
        });

        // Handles muting video
        attachClickListener("mute-btn", () => this.muteVideoToggle());

        // Handles user request to change volume using the slider
        volumeSlider.addEventListener("input", () => {
            const volumeLevel = parseInt(volumeSlider.value);
            video.volume = volumeLevel / 100;

            // If user changes volume slider while muted, automatically umute
            if (volumeLevel > 0 && video.muted) {
                this.muteVideoToggle();
            }
            this.updateVolumeIcon();
        });

        // Handles auto hiding video controls
        videoContainer.addEventListener("mousemove", () => {
            // Reset timer for hiding
            this.clearAutoHideTimeout();

            this.showControls()

            this.autoHideTimeout = setTimeout(() => {
                if (!this.mode.isAutoHideControlsEnabled) return;
                this.hideControls();
            }, 2500) // In ms, so 2.5 seconds then executes 
        });

        videoContainer.addEventListener("mouseleave", () => {
            if (this.mode.isAutoHideControlsEnabled) {
                this.hideControls();
            }
        });
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
    const customControlContainer = document.getElementById("custom-control-container");

    if (!(video instanceof HTMLVideoElement)) return;
    if (!(progressBar instanceof HTMLDivElement)) return;
    if (!(scrubber instanceof HTMLInputElement)) return;
    if (!(customControlContainer instanceof HTMLDivElement)) return;

    const ctx: Context = {
        video,
        progressBar,
        scrubber,
        customControlContainer
    };

    normalMode.videoSrc = video.currentSrc;
    // Create VideoController instance
    const controller = new VideoController(ctx, normalMode);
}

init();
