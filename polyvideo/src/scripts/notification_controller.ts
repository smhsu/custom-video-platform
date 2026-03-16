// I have the context, but I use nothing from the context...
interface Context {
        video: HTMLVideoElement;
        progressBar: HTMLDivElement;
        scrubber: HTMLInputElement;
        customControlContainer: HTMLDivElement;
    }

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

export class NotificationController {
    private mode: PlayerMode
    private dismissed: boolean;
    private adPlayed: boolean;
    private marker!: HTMLDivElement;
    private playAdContainer!: HTMLDivElement;

    // Removed context as the Controller will document query here
    constructor(ctx: Context, initalMode: PlayerMode) {
        this.initNotificationControls();
        this.mode = initalMode
        this.dismissed = false;
        this.adPlayed = false;
    }

    // Keep VideoController mode in sync
    switchMode(newMode: PlayerMode) {
        this.mode = newMode
    }

    initNotificationControls() {
        const playAdContainer = document.getElementById("play-ad-container");
        const marker = document.getElementById("marker");

        if (!(playAdContainer instanceof HTMLDivElement)) return;
        if (!(marker instanceof HTMLDivElement)) return;

        this.playAdContainer = playAdContainer;
        this.marker = marker;
    }

    // Hide controls when ad triggers
    onAdStarted() {
        this.adPlayed = true;
        this.playAdContainer.hidden = true
        this.marker.hidden = true
    }

    // Dynamically set market and Ad placement(currently hardcoded at 50%)
    setMarkerAtPercent(percent: number){
        this.marker.style.left = `${percent}%`;
    }

    hidePlayAdBtn() {
        this.playAdContainer.hidden = true;
        this.dismissed = true;
    }

    // Called on video timeupdate
    // Responsible for marker + play-ad-btn visibility based on progress
    // Mode responsible ifAdShouldPlay instead of passing in
    handleTimeUpdate(progressPercent: number){
        if (this.adPlayed) return;

        // Mode or Dissmissal determines visibility
        let shouldHide = !this.mode.shouldAdAppear 
            || this.dismissed 
            || this.mode.hidePlayAdButton(progressPercent);

        this.playAdContainer.hidden = shouldHide;

    }
}

