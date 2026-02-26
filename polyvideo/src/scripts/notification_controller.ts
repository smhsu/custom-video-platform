// Package of relevant HTML elements
interface Context {
    playAdContainer: HTMLDivElement;
    marker: HTMLDivElement;
}


export class NotificationController {
    private dismissed: boolean;
    private hidden: boolean;
    private autoHideTimeout: ReturnType<typeof setTimeout> | null = null;
    private ctx: Context

    constructor(ctx: Context) {
        this.ctx = ctx
        this.dismissed = false;
        this.hidden = true;
    }

    // Dynamically set market and Ad placement(currently hardcoded at 50%)
    setMarkerAtPercent(percent: number){
        this.ctx.marker.style.left = `${percent}%`;
    }

    // Marker showing and hiding are bound to the autohide timing
    marker_show() {
        console.log("show");
    }

    marker_hide() {
        console.log("hide");
    }

    // play 
    play_ad_show() {

    }

    play_ad_hide() {

    }

    reset() {
        console.log("reset")
    }
}

