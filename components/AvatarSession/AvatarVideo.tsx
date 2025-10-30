import React, { forwardRef } from "react";
import { ConnectionQuality } from "@heygen/streaming-avatar";

import { useConnectionQuality } from "../logic/useConnectionQuality";
import { useStreamingAvatarSession } from "../logic/useStreamingAvatarSession";
import { StreamingAvatarSessionState } from "../logic";
import { CloseIcon } from "../Icons";
import { Button } from "../Button";

export const AvatarVideo = forwardRef<HTMLVideoElement>(({}, ref) => {
  const { sessionState, stopAvatar } = useStreamingAvatarSession();
  const { connectionQuality } = useConnectionQuality();

  const isLoaded = sessionState === StreamingAvatarSessionState.CONNECTED;

  const handleClose = async () => {
    stopAvatar();
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error("Failed to exit fullscreen", err);
      }
    }
  };

  return (
    <>
      {connectionQuality !== ConnectionQuality.UNKNOWN && (
        <div className="absolute bottom-3 left-3 bg-black text-white rounded-lg px-3 py-2 text-sm">
          Connection Quality: {connectionQuality}
        </div>
      )}
      {isLoaded && (
        <Button
          className="absolute top-3 right-3 !p-2 bg-zinc-700 bg-opacity-50 z-10"
<<<<<<< HEAD
          onClick={async () => {
            try {
              stopAvatar();
            } finally {
              try {
                if (document.fullscreenElement) {
                  await document.exitFullscreen();
                }
              } catch (err) {
                console.error("Exit fullscreen failed", err);
              }
            }
          }}
=======
          onClick={handleClose}
>>>>>>> cc3632b24c1842018356ce9a299b7cc880bacb40
        >
          <CloseIcon />
        </Button>
      )}
      <video
        ref={ref}
        autoPlay
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      >
        <track kind="captions" />
      </video>
      {!isLoaded && (
        <div className="w-full h-full flex items-center justify-center absolute top-0 left-0 text-white">
          Loading...
        </div>
      )}
    </>
  );
});
AvatarVideo.displayName = "AvatarVideo";
