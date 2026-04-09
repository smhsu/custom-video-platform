# Custom Video Player 

## Testing Pipeline
Below is a set of feature tests to ensure the video player is working properly.
* On Load, Start State:
  * Full Volume
  * Play Icon
  * Video time (and other related metadata) loaded
  * Yellow tick marker to indicate where ad plays appears
* Video Player Functionality
  * Autohide controls
  * Pause, Play, Volume slider, Mute, Fullscreen all work
* While Video Playing:
  * Ad Notification (Notification above tick marker + "Play Ad Now" button) at 30% of video progress
    * Notification above tick marker only appears on autohide
    * "Play Ad Now" Button persistent regardless of control autohide
  * "Play Ad Now" button both is dissmissable and plays ad
  * Ad Automatically plays at 50% of video progress
* While Ad Playing:
  * "Skip" button appears after 5 seconds
  * Once ad ends, automatically swithces back to normal mode
