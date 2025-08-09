import pauseIcon from "../assets/images/pause.svg"
import playIcon from "../assets/images/play.svg"
import volumeOn from "../assets/images/volume_on.svg";
import volumeOff from "../assets/images/volume_off.svg";
import volumeMute from "../assets/images/volume_mute.svg";

export function handleProgress(video: HTMLVideoElement) {
    const progressBar = document.getElementById("progress-bar")

    if (progressBar) {
        video.addEventListener("timeupdate", () => {
            const currentTime = video.currentTime
            const progressFill = (currentTime / video.duration) * 100
            progressBar.style.width = progressFill + "%"
        })
    }

    // Progress bar updates are choppy, any way to smoothen out?
    // requestAnimationFrame(updateProgress)

}

// Set video where user clicks on timeline
export function handleTimelineClick(video:HTMLVideoElement) {
    const input = document.getElementById("scrubber");
    const progressBar = document.getElementById("progress-bar");

    if (input && progressBar) {
        input.addEventListener("input", (e) => {
            if (e.target instanceof HTMLInputElement) {
                const value = parseInt(e.target.value);

                // Duration and current time is in seconds
                const desiredTime = (value / 100) * video.duration

                // Update both video time and progress bar
                video.currentTime = desiredTime
                progressBar.style.width = value + "%";
            }
        });
    }
}


export function handlePlayButton(video:HTMLVideoElement) {
    const playButton = document.getElementById("play-btn");

    // Button acts as a toggle between pause and play icons
    const currentIcon = document.getElementById("play-pause-icon") as HTMLImageElement

    if (playButton) {
        playButton.addEventListener("click", () => {
            if (video.paused) {
                video.play();
                // Change the icon from play to pause
                currentIcon.src = pauseIcon.src
            } else {
                video.pause();
                currentIcon.src = playIcon.src
            }
        });
    }
}

export function handleMuteButton(video:HTMLVideoElement) {
    const muteButton = document.getElementById("mute-btn")
    const volumeIcon = document.getElementById("volume-icon") as HTMLImageElement

    if (muteButton) {
        muteButton.addEventListener("click", () => {
            if (video.muted) {
                //Volume will be current value of the slider
                video.muted = false
                volumeIcon.src = volumeOn.src
            } else {
                video.muted = true
                volumeIcon.src = volumeMute.src
            }
        })
    }
}

export function handleVolumeSlider(video:HTMLVideoElement) {
    const volumeSlider = document.getElementById("volume-slider")
    const volumeIcon = document.getElementById("volume-icon") as HTMLImageElement

    if (volumeSlider) {
        volumeSlider.addEventListener("input", (e) => {
            if (e.target instanceof HTMLInputElement) {
                // Volume scales from 0 to 1
                const volumeLevel = parseInt(e.target.value) / 100
                video.volume = volumeLevel

                if (volumeLevel === 0) {
                    volumeIcon.src = volumeOff.src
                } else if (volumeIcon.src !== volumeOn.src) {
                    // Only switch to the volume on icon if the current icon is volume off
                    volumeIcon.src = volumeOn.src
                }
            }

        })
    }
}

export function handleFullscreen() {
    const videoContainer = document.getElementById("video-container")
    const fsButton = document.getElementById("fullscreen-btn")

    if (fsButton && videoContainer instanceof HTMLDivElement) {
        fsButton.addEventListener("click", () => {
            // Request fullscreen on div to not have the default fullscreen UI
            if (document.fullscreenElement !== videoContainer) {
                videoContainer.requestFullscreen()
            } else {
                document.exitFullscreen();
            }
        })
    }
}

function handleCurrentTime(video: HTMLVideoElement) {
    const displayedTime = document.getElementById("current-video-time")
    video.addEventListener("timeupdate", () => {
        if (displayedTime instanceof HTMLSpanElement) {
            const currentTime = secondsToClockTime(video.currentTime);
            displayedTime.textContent = currentTime
        }
    })
}

function handleVideoDuration(video: HTMLVideoElement) {
    const displayedDuration = document.getElementById("full-video-duration")
    if(displayedDuration instanceof HTMLSpanElement){
        const duration = secondsToClockTime(video.duration)
        displayedDuration.textContent = duration
    }
}

// Only supports MM:SS format (for now?), returns formatted string
export function secondsToClockTime(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)

    //Seconds pad with a leading zero
    const secondsFormat = String(remainingSeconds).padStart(2, '0')
    return `${minutes}:${secondsFormat}`
}

function init() {
    const video = document.getElementById("media-video")
    if (video instanceof HTMLVideoElement) {    
        handleProgress(video);
        handleTimelineClick(video);
        handlePlayButton(video);
        handleMuteButton(video);
        handleVolumeSlider(video);
        handleFullscreen();
        handleCurrentTime(video);
        handleVideoDuration(video);
    }
}
// Assign event listeners automatically on load
init()
