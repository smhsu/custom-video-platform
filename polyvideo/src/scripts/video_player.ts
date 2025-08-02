export function updateProgress() {
    const input = document.getElementById("scrubber");
    const progressBar = document.getElementById("progress-bar");

    if (input && progressBar) {
        input.addEventListener("input", (e) => {
            if(e.target instanceof HTMLInputElement){
                const value = e.target.value;
                progressBar.style.width = value + "%";
            }
        });
    }
}


export function playVideo() {
    const playButton = document.getElementById("play-btn");
    const video = document.getElementById("media-video");

    if (playButton && video instanceof HTMLVideoElement) {
        playButton.addEventListener("click", () => {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        });
    }

}

// Assign event listeners automatically on load
updateProgress();
playVideo();
