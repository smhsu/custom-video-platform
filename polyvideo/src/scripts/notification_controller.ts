export class NotificationController {
    private dismissed: boolean;
    private hidden: boolean;
    private autoHideTimeout: ReturnType<typeof setTimeout> | null = null;
    private adPlayed: boolean;
    private marker!: HTMLDivElement;
    private playAdContainer!: HTMLDivElement;

    // Removed context as the Controller will document query here
    constructor() {
        this.initNotificationControls();
        this.dismissed = false;
        this.hidden = true;
        this.adPlayed = false;
    }

    initNotificationControls() {
        const playAdContainer = document.getElementById("play-ad-container");
        const marker = document.getElementById("marker");

        if (!(playAdContainer instanceof HTMLDivElement)) return;
        if (!(marker instanceof HTMLDivElement)) return;

        this.playAdContainer = playAdContainer;
        this.marker = marker;
    }

    // Dynamically set market and Ad placement(currently hardcoded at 50%)
    setMarkerAtPercent(percent: number){
        this.marker.style.left = `${percent}%`;
    }

    // Marker showing and hiding are bound to the autohide timing
    showMarker() {
        this.marker.hidden = false;
    }

    hideMarker() {
        this.marker.hidden = true;
    }

    showPlayAdBtn() {
        this.playAdContainer.hidden = false;
    }

    hidePlayAdBtn() {
        this.playAdContainer.hidden = true;
        this.dismissed = true;
    }

    reset() {
        console.log("reset");
    }

    // Called on video timeupdate
    // Responsible for marker + play-ad-btn visibility based on progress
    update(progressPercent: number, shouldAdAppear: boolean, hidePlayAdButton: (prog: number) => boolean){
        if (this.adPlayed = true) return;

    }
}

