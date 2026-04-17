import { type Context, type PlayerMode} from "./types";
import { AD_PLAYS, adEarlyPath } from "./types";

export class AdTimingController {
    private mode: PlayerMode
    private hasBeenDismissed: boolean;
    private hasAdPlayed: boolean;
    private hasBeenShown: boolean;
    private onSkipAdRequested: (() => void) | null;
    private onAdRequested: (() => void) | null;
    private marker!: HTMLDivElement;
    private playAdContainer!: HTMLDivElement;
    private tooltip!: HTMLDivElement;
    private skipAdBtn!: HTMLButtonElement;
    private service!: string;

    // Removed context as the Controller will document query here
    constructor(ctx: Context, initalMode: PlayerMode) {
        this.initNotificationControls();
        this.mode = initalMode;
        this.hasBeenDismissed = false;
        this.hasBeenShown = false
        this.hasAdPlayed = false;
        this.onSkipAdRequested = null;
        this.onAdRequested = null;
    }

    // Used to connect skip ad button mode switch functionality
    setSkipAdRequestedListener(callback: () => void) {
        this.onSkipAdRequested = callback;
    }

    // Used to connect play ad now button mode switch functionality
    setPlayAdRequestedListener(callback: () => void) {
        this.onAdRequested = callback;
    }

    // Keep VideoController mode in sync
    switchMode(newMode: PlayerMode) {
        this.mode = newMode;
    }

    // Checks if the current service supports the custom ad playing controls
    private hasPlayAdService() {
        return this.service === adEarlyPath;
    }

    initNotificationControls() {
        const playAdContainer = document.getElementById("play-ad-container");
        const marker = document.getElementById("marker");
        const tooltip = document.getElementById("tooltip");
        const skipAdBtn = document.getElementById("skip-ad-btn");

        if (!(playAdContainer instanceof HTMLDivElement)) return;
        if (!(marker instanceof HTMLDivElement)) return;
        if (!(tooltip instanceof HTMLDivElement)) return;
        if (!(skipAdBtn instanceof HTMLButtonElement)) return;

        this.playAdContainer = playAdContainer;
        this.marker = marker;
        this.tooltip = tooltip;
        this.skipAdBtn = skipAdBtn;

        // Check current service from URL params
        const serviceParams = window.location.pathname;
        if (serviceParams) this.service = serviceParams;

        // Utility function for finding an element by ID, ensuring it exists, then attaching a function to run on click.
        function attachClickListener(elementId: string, onClick: () => void) {
            const element = document.getElementById(elementId);
            if (!element) return;
            element.addEventListener("click", onClick);
        }

        // Handles Skip Ad button, disappears when in main mode
        attachClickListener("skip-ad-btn", () => {
            if (this.onSkipAdRequested) {
                this.onSkipAdRequested();
            }
        });

        // Handles Ad Play button, should disappear when in ad mode
        attachClickListener("play-ad-btn", () => {
            if (this.onAdRequested) {
                this.onAdRequested();
            }
        });

        // Handles Ad Play notification dismissal
        attachClickListener("play-ad-dismiss-btn", () => this.dismissAdSoonNotification());

    }

    // Hide controls when ad triggers
    onAdStarted() {
        this.hasAdPlayed = true;
        this.playAdContainer.hidden = true;
        this.marker.hidden = true;
    }

    // Dynamically set marker and Ad placement(currently hardcoded at 50%)
    setMarkerAtPercent(percent: number) {
        this.marker.style.left = `${percent}%`;
    }

    showAdSoonNotification() {
        if (this.hasBeenDismissed) return;
        if (!this.hasPlayAdService()) return;
        this.hasBeenShown = true;
        this.playAdContainer.hidden = false;
        this.tooltip.hidden = false;
    }

    hideAdSoonNotification() {
        this.playAdContainer.hidden = true;
    }

    dismissAdSoonNotification() {
        this.hasBeenDismissed = true;
        this.hideAdSoonNotification();
    }

    // Called on video timeupdate
    // Responsible for marker + play-ad-btn visibility based on progress
    handleTimeUpdate(progressPercent: number) {
        // Skip button visibility
        if (this.mode.hideSkipAdButton) {
            this.skipAdBtn.hidden = this.mode.hideSkipAdButton(progressPercent);
        }

        if (this.hasAdPlayed || this.hasBeenDismissed) return;

        // Either mode or Dissmissal determines visibility
        // hasBeenShown flag once play-ad-btn is shown (shouldn't rehide if user rewinds)
        if (this.mode.hidePlayAdButton(progressPercent) && !this.hasBeenShown) {
            this.hideAdSoonNotification();
        } else {
            this.showAdSoonNotification();
        }

        // Natural ad appearance
        if (this.mode.shouldAdAppear && progressPercent > AD_PLAYS && this.onAdRequested) {
            this.onAdRequested();
        }
    }
}

