import pauseIcon from "../assets/images/pause.svg"
import playIcon from "../assets/images/play.svg"
import volumeOn from "../assets/images/volume_on.svg";
import volumeOff from "../assets/images/volume_off.svg";
import volumeMute from "../assets/images/volume_mute.svg";

function handleProgress(video: HTMLVideoElement) {
    const progressBar = document.getElementById("progress-bar")
    if (!(progressBar instanceof HTMLDivElement)) return;

    video.addEventListener("timeupdate", () => {
        const currentTime = video.currentTime
        const progressFill = (currentTime / video.duration) * 100
        progressBar.style.width = progressFill + "%"
    })

    // requestAnimationFrame(updateProgress)
}

// Set video where user clicks on timeline
function handleTimelineClick(video: HTMLVideoElement) {
    const input = document.getElementById("scrubber");
    const progressBar = document.getElementById("progress-bar");

    if (!(input instanceof HTMLInputElement && progressBar instanceof HTMLDivElement)) return;

    input.addEventListener("input", () => {
        const value = parseInt(input.value);

        // Duration and current time is in seconds
        const desiredTime = (value / 100) * video.duration

        // Update both video time and progress bar
        video.currentTime = desiredTime
        progressBar.style.width = value + "%";
    });
}



function handlePlayButton(video: HTMLVideoElement) {
    const playButton = document.getElementById("play-btn");
    // Button acts as a toggle between pause and play icons
    const currentIcon = document.getElementById("play-pause-icon")

    if (!(playButton instanceof HTMLButtonElement && currentIcon instanceof HTMLImageElement)) return;

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

function handleMuteButton(video: HTMLVideoElement) {
    const muteButton = document.getElementById("mute-btn")
    const volumeIcon = document.getElementById("volume-icon") as HTMLImageElement

    if (!(muteButton instanceof HTMLButtonElement && volumeIcon instanceof HTMLImageElement)) return;

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

function handleVolumeSlider(video: HTMLVideoElement) {
    const volumeSlider = document.getElementById("volume-slider")
    const volumeIcon = document.getElementById("volume-icon")

    if (!(volumeSlider instanceof HTMLInputElement && volumeIcon instanceof HTMLImageElement)) return;

    volumeSlider.addEventListener("input", () => {
        // Video volume scales from 0 to 1
        const volumeLevel = parseFloat(volumeSlider.value)
        video.volume = volumeLevel

        if (volumeLevel === 0) {
            volumeIcon.src = volumeOff.src
        } else if (volumeIcon.src !== volumeOn.src) {
            // Only switch to the volume on icon if the current icon is volume off
            volumeIcon.src = volumeOn.src
        }
    })
}


function handleFullscreen() {
    // Request fullscreen on div (not video) to not have the default fullscreen UI
    const videoContainer = document.getElementById("video-container")
    const fsButton = document.getElementById("fullscreen-btn")

    if (!(videoContainer instanceof HTMLDivElement && fsButton instanceof HTMLButtonElement)) return;

    fsButton.addEventListener("click", () => {
        if (document.fullscreenElement !== videoContainer) {
            videoContainer.requestFullscreen()
        } else {
            document.exitFullscreen();
        }
    })

}

function handleCurrentTime(video: HTMLVideoElement) {
    const displayedTime = document.getElementById("current-video-time")

    if (!(displayedTime instanceof HTMLSpanElement)) return;

    video.addEventListener("timeupdate", () => {
        const currentTime = secondsToClockTime(video.currentTime);
        displayedTime.textContent = currentTime

    })
}

function handleVideoDuration(video: HTMLVideoElement) {
    const displayedDuration = document.getElementById("full-video-duration")

    if (!(displayedDuration instanceof HTMLSpanElement)) return;

    const duration = secondsToClockTime(video.duration)
    displayedDuration.textContent = duration
}

// Only supports MM:SS format (for now?), returns formatted string
function secondsToClockTime(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)

    // Seconds are padded with a leading zero
    const secondsFormat = String(remainingSeconds).padStart(2, '0')
    return `${minutes}:${secondsFormat}`
}

// Works, not 100% if this is the best way however
function handleControlHide() {
    const videoContainer = document.getElementById("video-container")
    const controls = document.getElementById("custom-control-container")

    if (!(videoContainer instanceof HTMLDivElement && controls instanceof HTMLDivElement)) return;

    // setTimeout returns a number (timeoutID)
    let autohideTimeout: ReturnType<typeof setTimeout>;

    // When mouse moves, show controls (and reset timeout timer)
    videoContainer.addEventListener("mousemove", () => {
        showControls(controls)

        // Reset timer for hide
        clearTimeout(autohideTimeout);
        autohideTimeout = setTimeout(() => {
            hideControls(controls)
        }, 3000) // In ms, so 3 seconds then executes 
    })

    // When mouse leaves hide controls
    videoContainer.addEventListener("mouseleave", () => {
        hideControls(controls)
    })

    // When mouse enters show controls
    videoContainer.addEventListener("mouseenter", () => {
        showControls(controls)
    })
}

function showControls(controls: HTMLDivElement) {
    controls.classList.remove('opacity-0')
    controls.classList.add('opacity-100')
}

function hideControls(controls: HTMLDivElement) {
    controls.classList.remove('opacity-100')
    controls.classList.add('opacity-0')
}

function handleAdButton(video: HTMLVideoElement) {
    const adButton = document.getElementById("play-ad-btn")
    if (!(adButton instanceof HTMLButtonElement)) return;

    const adPath = "../../ad_video.mp4"
    const videoPath = video.currentSrc
    let returnTime = 0;
    let adIsPlaying = false

    // Returns to where the video left off when the AD ends
    video.addEventListener("ended", () => {
        // Ignore if main video is playing
        if (!adIsPlaying) return;

        // Revert back to main video and set flag
        adIsPlaying = false
        video.src = videoPath
        video.currentTime = returnTime
        video.play()
    })

    adButton.addEventListener("click", () => {
        // Store video time to go back to later
        returnTime = video.currentTime

        // Change video to ad and play immediately
        adIsPlaying = true
        video.src = adPath
        video.play()

        // Make Progress bar yellow and track ad time (maybe can tweak existing handleProgress function and use that)
        // handleAdProgress(video)


        // Have play ad button disappear when ad starts
    })
}

// function handleAdProgress(video: HTMLVideoElement) {
//     const progressBar = document.getElementById("progress-bar")

//     if (progressBar) {
//         video.addEventListener("timeupdate", () => {
//             const currentTime = video.currentTime
//             const progressFill = (currentTime / video.duration) * 100
//             progressBar.style.width = progressFill + "%"
//         })
//     }
// }

// function handleSkipAdButton(video: HTMLVideoElement) {
//     const skipButton = document.getElementById("skip-ad-btn")
// }

function init() {
    const video = document.getElementById("media-video")

    if (!(video instanceof HTMLVideoElement)) return;

    handleProgress(video);
    handleTimelineClick(video);
    handlePlayButton(video);
    handleMuteButton(video);
    handleVolumeSlider(video);
    handleFullscreen();
    handleCurrentTime(video);
    handleVideoDuration(video);
    handleControlHide();
    handleAdButton(video);

}
// Assign event listeners automatically on load
init()
