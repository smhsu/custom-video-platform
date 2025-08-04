import pauseIcon from "../assets/images/pause.svg"
import playIcon from "../assets/images/play.svg"
import volumeOn from "../assets/images/volume_on.svg";
import volumeOff from "../assets/images/volume_off.svg";
import volumeMute from "../assets/images/volume_mute.svg";

export function updateProgress() {
    const video = document.getElementById("media-video")
    const progressBar = document.getElementById("progress-bar")

    if (progressBar && video instanceof HTMLVideoElement) {
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
export function userDesiredTime() {
    const video = document.getElementById("media-video")
    const input = document.getElementById("scrubber");
    const progressBar = document.getElementById("progress-bar");

    if (input && progressBar && video instanceof HTMLVideoElement) {
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


export function playVideo() {
    const playButton = document.getElementById("play-btn");
    const video = document.getElementById("media-video");

    // Button acts as a toggle between pause and play icons
    const currentIcon = document.getElementById("play-pause-icon") as HTMLImageElement

    if (playButton && video instanceof HTMLVideoElement) {
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

export function muteVideo() {
    const video = document.getElementById("media-video")
    const muteButton = document.getElementById("mute-btn")
    const volumeIcon = document.getElementById("volume-icon") as HTMLImageElement

    if (muteButton && video instanceof HTMLVideoElement) {
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

export function changeVolume() {
    const video = document.getElementById("media-video")
    const volumeSlider = document.getElementById("volume-slider")
    const volumeIcon = document.getElementById("volume-icon") as HTMLImageElement

    if (volumeSlider && video instanceof HTMLVideoElement) {
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

export function fullscreenVideo() {
    const videoContainer = document.getElementById("video-container")
    const fsButton = document.getElementById("fullscreen-btn")
    const fsIcon = document.getElementById("fullscreen-icon") as HTMLImageElement

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

// Assign event listeners automatically on load
updateProgress();
userDesiredTime();
playVideo();
muteVideo();
changeVolume();
fullscreenVideo();