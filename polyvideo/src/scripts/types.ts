// As controllers and modes (once seperates by file) share interfaces
// I move them into their own file and import as needed

export const AD_ADVANCE_WARNING = 30 // Percent into video when first warning appears and panel warning 
export const AD_PLAYS = 50 // Percent into the video when ad plays

// A package of relevant HTML elements
export interface Context {
    video: HTMLVideoElement;
    progressBar: HTMLDivElement;
    scrubber: HTMLInputElement;
    customControlContainer: HTMLDivElement;
}

// Acts as the composite of mode specific behavior/functionality
// Functionality that's shared between modes (pause play, fullscreen, etc.) are set when declaring event listeners
export interface PlayerMode {
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