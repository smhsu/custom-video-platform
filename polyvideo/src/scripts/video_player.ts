import pauseIcon from "../assets/images/pause.svg"
import playIcon from "../assets/images/play.svg"
import volumeOn from "../assets/images/volume_on.svg"
import volumeOff from "../assets/images/volume_off.svg"
import volumeMute from "../assets/images/volume_mute.svg"

type ModeName = "main" | "ad";

// Contains all properties and HTML elements relevant to each mode
interface Context {
    video: HTMLVideoElement;
    progressBar: HTMLDivElement;
    scrubber: HTMLInputElement;
    mainSrc: string;
    adSrc: string;
    returnTime: number;
}

// Acts as the composite of mode specific behavior/functionality (If I understood composition correctly from our meeting)
// Functionality that's shared between modes (pause play, fullscreen, etc.) are set when declaring event listeners
interface PlayerMode {
    name: ModeName;
    canSeek: boolean;

    // Compute progress percent for the bar
    handleProgress(ctx: Context): number;

    handleHideControls(ctx: Context): void;
    handleShowControls(ctx: Context): void;

    hasSkipAd: boolean;

    applyTheme(ctx: Context): void;
    enter(ctx: Context): void;
    onEnded(ctx: Context): void;
}

// Mode for main content
const mainMode: PlayerMode = {
    name: "main",
    canSeek: true,

    // Track progress for entire video
    handleProgress: ({ video }) => {
        const currentTime = video.currentTime;
        return (currentTime / video.duration) * 100;
    },

    handleHideControls(ctx) {
        return;
    },

    handleShowControls(ctx) {
        return;
    },

    hasSkipAd: false,

    applyTheme: ({ progressBar }) => {
        progressBar.classList.remove("bg-yellow-300");
        progressBar.classList.add("bg-blue-400");
    },
    enter: (ctx) => {
        mainMode.applyTheme(ctx);
    },
    onEnded: (ctx) => {
        // Have the play icon show when main video ends
    }
};

// Mode for ad
const adMode: PlayerMode = {
    name: "ad",
    canSeek: false,

    // Tracks first 5 seconds of ad
    handleProgress: ({ video }) => {
        const currentTime = video.currentTime;
        return Math.min(100, (currentTime / 5) * 100);
    },

    // Have controls present the entire ad duration
    handleHideControls(ctx) {
        return;
    },

    handleShowControls(ctx) {
        return;
    },

    hasSkipAd: true,

    applyTheme: (ctx) => {
        ctx.progressBar.classList.remove("bg-blue-400");
        ctx.progressBar.classList.add("bg-yellow-300");
        // "Play Ad" button dissappears


    },
    enter: (ctx) => {
        // Grab main video time to return to once ad finishes
        ctx.returnTime = ctx.video.currentTime

        // Switch src to ad and add theme
        ctx.video.src = ctx.adSrc;
        adMode.applyTheme(ctx);

        // Autoplay ad
        ctx.video.play();

    },
    // Will run both when ads end OR when the user skips ad
    onEnded: (ctx) => {
        // Switch src back to main content 
        ctx.video.src = ctx.mainSrc;

        // Bring main video back where it left off
        ctx.video.currentTime = ctx.returnTime;

        // Auto play main video
        ctx.video.play();
    }
};

class VideoController {
    private mode: PlayerMode;
    // private autoHideTimeout: ReturnType<typeof setTimeout>;

    constructor(private ctx: Context, private modes: Record<ModeName, PlayerMode>) {
        this.mode = modes.main;

        // Only attatch listeners once
        this.addListeners();
        this.mode.enter(ctx);
    }

    modeSwich(newMode: ModeName) {
        this.mode = this.modes[newMode];
        this.mode.enter(this.ctx);
    }

    // Only supports MM:SS format, returns formatted string
    secondsToClockTime(seconds: number) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        // Seconds are padded with a leading zero
        const secondsFormat = String(remainingSeconds).padStart(2, "0");
        return `${minutes}:${secondsFormat}`;
    }

    addListeners() {
        // Grab all needed HTML elements from context
        const { video, progressBar, scrubber } = this.ctx;

        // Handles progress
        video.addEventListener("timeupdate", () => {
            const progress = this.mode.handleProgress(this.ctx);

            progressBar.style.width = progress + "%";
        });


        // Handles timeline clicks
        scrubber.addEventListener("input", () => {
            if (!this.mode.canSeek) return;
            const value = parseInt(scrubber.value);

            // Duration and current time is in seconds
            const desiredTime = (value / 100) * video.duration;

            // Update both video time and progress bar
            video.currentTime = desiredTime;
            progressBar.style.width = value + "%";
        });


        // Handles play/pause button (acts as toggle)
        const playButton = document.getElementById("play-btn");

        // Button acts as a toggle between pause and play icons
        const currentIcon = document.getElementById("play-pause-icon");
        if (!(playButton instanceof HTMLButtonElement && currentIcon instanceof HTMLImageElement)) return;

        playButton.addEventListener("click", () => {
            if (video.paused) {
                video.play();
                // Change the icon from play to pause
                currentIcon.src = pauseIcon.src;
            } else {
                video.pause();
                currentIcon.src = playIcon.src;
            }
        });


        // Handles video fullscreen
        // Request fullscreen on div (not video) to not have the default fullscreen UI
        const videoContainer = document.getElementById("video-container");
        const fsButton = document.getElementById("fullscreen-btn");

        if (!(videoContainer instanceof HTMLDivElement && fsButton instanceof HTMLButtonElement)) return;
        fsButton.addEventListener("click", () => {
            if (document.fullscreenElement !== videoContainer) {
                videoContainer.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });


        // Handles Ad Play button (temporary), disappears when in ad mode
        const adButton = document.getElementById("play-ad-btn");
        if (!(adButton instanceof HTMLButtonElement)) return;

        adButton.addEventListener("click", () => {
            // Mode switch handles src changes, button visability, etc
            this.modeSwich("ad");
        })


        // Handles Skip Ad button, disappears when in main mode
        const skipButton = document.getElementById("skip-ad-btn");
        if (!(skipButton instanceof HTMLButtonElement)) return;

        skipButton.addEventListener("click", () => {
            // Currently in ad mode
            this.mode.onEnded(this.ctx);

            this.modeSwich("main");
        });


        // Handles current time display
        const displayedTime = document.getElementById("current-video-time");

        if (!(displayedTime instanceof HTMLSpanElement)) return;

        video.addEventListener("timeupdate", () => {
            const currentTime = this.secondsToClockTime(video.currentTime);
            displayedTime.textContent = currentTime;
        });


        // Handles time display for video's duration (need to put between modes as they switch)
        const displayedDuration = document.getElementById("full-video-duration");

        if (!(displayedDuration instanceof HTMLSpanElement)) return;

        const duration = this.secondsToClockTime(video.duration);
        displayedDuration.textContent = duration;


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
}


function init() {

    // Document queries on mode specific elements to create Context 
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
        mainSrc: video.currentSrc,
        adSrc: "../../ad_video.mp4",
        // Will be assigned once ad played
        returnTime: 0,
    };

    // Create VideoController instance
    const controller = new VideoController(ctx, { main: mainMode, ad: adMode });
}

init();