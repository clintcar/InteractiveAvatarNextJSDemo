import {
  AvatarQuality,
  StreamingEvents,
  VoiceChatTransport,
  VoiceEmotion,
  StartAvatarRequest,
  STTProvider,
  ElevenLabsModel,
} from "@heygen/streaming-avatar";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, useUnmount } from "ahooks";

import { Button } from "./Button";
import { AvatarConfig } from "./AvatarConfig";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { AvatarControls } from "./AvatarSession/AvatarControls";
import { useVoiceChat } from "./logic/useVoiceChat";
import { useTextChat } from "./logic/useTextChat";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from "./logic";
import { LoadingIcon } from "./Icons";
import { MessageHistory } from "./AvatarSession/MessageHistory";

import { AVATARS } from "@/app/lib/constants";

const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.High,
  avatarName: "Marianne_Chair_Sitting_public",
  knowledgeId: "11e2a58a10004f679101e9a9477a6da0",
  voice: {
    rate: 1.0,
    emotion: "friendly" as VoiceEmotion,
    model: ElevenLabsModel.eleven_flash_v2_5,
    voiceId: "a78e0a4dbbe247d0a704b91175e6d987",
  },
  language: "es",
  voiceChatTransport: VoiceChatTransport.WEBSOCKET,
  sttSettings: {
    provider: STTProvider.DEEPGRAM,
  },
};

function InteractiveAvatar() {
  const { initAvatar, startAvatar, stopAvatar, sessionState, stream } =
    useStreamingAvatarSession();
  const { startVoiceChat } = useVoiceChat();
  const { sendMessage } = useTextChat();

  const [config, setConfig] = useState<StartAvatarRequest>(DEFAULT_CONFIG);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const mediaStream = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useMemoizedFn(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen?.();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen toggle failed", err);
    }
  });

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();

      console.log("Access Token:", token); // Log the token to verify

      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      throw error;
    }
  }

  const startSessionV2 = useMemoizedFn(async (isVoiceChat: boolean) => {
    try {
      const newToken = await fetchAccessToken();
      const avatar = initAvatar(newToken);

      avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        console.log("Avatar started talking", e);
        setIsSpeaking(true);
      });
      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        console.log("Avatar stopped talking", e);
        setIsSpeaking(false);
      });
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
      });
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log(">>>>> Stream ready:", event.detail);
      });
      avatar.on(StreamingEvents.USER_START, (event) => {
        console.log(">>>>> User started talking:", event);
      });
      avatar.on(StreamingEvents.USER_STOP, (event) => {
        console.log(">>>>> User stopped talking:", event);
      });
      avatar.on(StreamingEvents.USER_END_MESSAGE, (event) => {
        console.log(">>>>> User end message:", event);
      });
      avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
        console.log(">>>>> User talking message:", event);
      });
      avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
        console.log(">>>>> Avatar talking message:", event);
      });
      avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
        console.log(">>>>> Avatar end message:", event);
      });

      await startAvatar(config);

      if (isVoiceChat) {
        await startVoiceChat();
      }

      // Auto-greet to ensure avatar starts speaking on session start
      setTimeout(() => {
        sendMessage(
          "Hello! I'm your assistant. How can I help you today?"
        );
      }, 300);
    } catch (error) {
      console.error("Error starting avatar session:", error);
    }
  });

  useUnmount(() => {
    stopAvatar();
  });

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
      };
    }
  }, [mediaStream, stream]);

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="flex flex-col rounded-xl bg-zinc-900 overflow-hidden">
        {sessionState === StreamingAvatarSessionState.INACTIVE && (
          <div className="flex flex-row justify-center items-center gap-4 p-4 border-b border-zinc-700">
            <Button onClick={() => startSessionV2(true)}>Start Voice Chat</Button>
            <Button onClick={() => startSessionV2(false)}>Start Text Chat</Button>
          </div>
        )}
        <div ref={containerRef} className="relative w-full aspect-video overflow-hidden flex flex-col items-center justify-center">
          {sessionState !== StreamingAvatarSessionState.INACTIVE ? (
            <AvatarVideo ref={mediaStream} />
          ) : (
            <></>
          )}
          {/* <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-6 py-2 rounded-md text-lg font-medium">
            María Teresa Fuster
          </div> */}
          <button
            aria-label="Toggle Full Screen"
            onClick={toggleFullscreen}
            className="absolute bottom-4 right-4 bg-zinc-900 text-white px-3 py-1 rounded-md text-sm"
          >
            Full Screen
          </button>
          {sessionState === StreamingAvatarSessionState.CONNECTED && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
              {isSpeaking ? 'Avatar is speaking' : 'Avatar is listening'}
            </div>
          )}
        </div>
        {sessionState === StreamingAvatarSessionState.INACTIVE && (
          <div className="border-t border-zinc-700">
            <div
              className="w-full cursor-pointer select-none p-4 text-sm font-medium bg-zinc-800 text-white"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              {isSettingsOpen ? "▲ Settings" : "▼ Settings"}
            </div>
            {isSettingsOpen && (
              <div className="p-4">
                <AvatarConfig config={config} onConfigChange={setConfig} />
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col gap-6 items-center justify-center p-8 border-t border-zinc-700 w-full">
          {sessionState === StreamingAvatarSessionState.CONNECTED ? (
            <AvatarControls />
          ) : sessionState === StreamingAvatarSessionState.INACTIVE ? (
            <></>
          ) : (
            <LoadingIcon />
          )}
        </div>
      </div>
      {sessionState === StreamingAvatarSessionState.CONNECTED && (
        <MessageHistory />
      )}
    </div>
  );
}

export default function InteractiveAvatarWrapper() {
  return (
    <StreamingAvatarProvider basePath={process.env.NEXT_PUBLIC_BASE_API_URL}>
      <InteractiveAvatar />
    </StreamingAvatarProvider>
  );
}
