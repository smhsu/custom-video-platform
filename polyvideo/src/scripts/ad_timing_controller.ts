// I have the context, but I use nothing from the context...
import type { Context, PlayerMode } from "./types";

export class AdTimingController {
    private mode: PlayerMode
    private hasBeenDismissed: boolean;
    private hasAdPlayed: boolean;
    private hasBeenShown: boolean;
    private marker!: HTMLDivElement;
    private playAdContainer!: HTMLDivElement;

    // Removed context as the Controller will document query here
    constructor(ctx: Context, initalMode: PlayerMode) {
        this.initNotificationControls();
        this.mode = initalMode
        this.hasBeenDismissed = false;
        this.hasBeenShown = false
        this.hasAdPlayed = false;
    }

    // Used to connect skip ad button controls
    setAdRequestedListener(callback: string) {
        console.log(callback);
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
        this.hasAdPlayed = true;
        this.playAdContainer.hidden = true
        this.marker.hidden = true
    }

    // Dynamically set market and Ad placement(currently hardcoded at 50%)
    setMarkerAtPercent(percent: number){
        this.marker.style.left = `${percent}%`;
    }

    showAdSoonNotification() {
        if (this.hasBeenDismissed) return;
        this.hasBeenShown = true;
        this.playAdContainer.hidden = false;
    }

    hideAdSoonNotification() {
        this.playAdContainer.hidden = true;
    }

    dismissAdSoonNotification(){
        this.hasBeenDismissed = true;
        this.hideAdSoonNotification();
    }

    // Called on video timeupdate
    // Responsible for marker + play-ad-btn visibility based on progress
    handleTimeUpdate(progressPercent: number){
        if (this.hasAdPlayed || this.hasBeenDismissed) return;

        // Either mode or Dissmissal determines visibility
        // hasBeenShown flag once play-ad-btn is shown (shouldn't rehide if user rewinds)
        if (this.mode.hidePlayAdButton(progressPercent) && !this.hasBeenShown) {
            this.hideAdSoonNotification();
        } else {
            this.showAdSoonNotification();
        }
    }
}

