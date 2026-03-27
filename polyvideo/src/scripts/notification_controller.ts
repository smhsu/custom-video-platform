// I have the context, but I use nothing from the context...
import type { Context, PlayerMode } from "./types";

export class NotificationController {
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

    setAdRequestedListener(callback) {

    }

    setAdRequestedListener(callback) {

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

    hidePlayAdBtn() {
        this.playAdContainer.hidden = true;
        this.hasBeenDismissed = true;
    }

    showAdSoonNotification() {
        if (this.dismissed) {
            return;
        }
    }

    hideAdSoonNotification() {
        this.dismissed = true;
    }

    showAdSoonNotification() {
        if (this.dismissed) {
            return;
        }
    }

    hideAdSoonNotification() {
        this.dismissed = true;
    }

    // Called on video timeupdate
    // Responsible for marker + play-ad-btn visibility based on progress
    handleTimeUpdate(progressPercent: number){
        if (this.hasAdPlayed) return;

         // Flag once play-ad-btn is shown, shouldn't rehide if user rewinds
        if (this.mode.hidePlayAdButton(progressPercent)) {
            this.showAdSoonNotification();
        }

        // Either Mode or Dissmissal determines visibility
        let shouldHide = !this.mode.shouldAdAppear 
            || this.hasBeenDismissed 
            || !this.hasBeenShown;

        this.playAdContainer.hidden = shouldHide;
    }
}

