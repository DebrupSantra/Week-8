import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthStore } from "../store/authStore";
import type { TaskRealtimeEvent } from "../types/api";
import { useToastStore } from "../store/toastStore";

const websocketUrl =
  import.meta.env.VITE_WS_URL ?? new URL("/ws", window.location.origin).toString();

export function useTaskRealtime(onEvent: (event: TaskRealtimeEvent) => void) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    if (!accessToken) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(websocketUrl),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => undefined,
      onConnect: () => {
        client.subscribe("/user/queue/tasks", (message) => {
          try {
            const event = JSON.parse(message.body) as TaskRealtimeEvent;
            if (!event.type || !event.taskId || !event.occurredAt) {
              throw new Error("The server sent an invalid task event.");
            }
            onEvent(event);
          } catch (error) {
            console.error("Could not process a task notification.", error);
            showToast("A live task update could not be displayed.", "error");
          }
        });
      },
      onStompError: (frame) => {
        showToast(frame.headers.message ?? "The live connection was rejected.", "error");
      },
    });

    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [accessToken, onEvent, showToast]);
}
