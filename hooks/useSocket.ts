"use client";

import { useState, useEffect, useCallback } from "react";
import io, { type Socket } from "socket.io-client";
import StorageService from "@/lib/storage";
import { useToast } from "@/components/ui/use-toast";

type Message = {
  id: string;
  sender_fullname: string;
  receiver_fullname: string;
  sender_id: number;
  receiver_id: number;
  payload: string;
  files: any[];
  is_deleted: boolean;
  is_read: boolean;
  created_at: string;
  replied_to_id: string | null;
};

type PendingMessage = {
  receiver_id: number;
  payload: string;
  tempId: string;
  created_at: string;
  replied_to_id: string | null;
  files: any[];
};

type FileWithPreview = {
  id: string;
};

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const token = StorageService.getItem("accessToken");
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
      query: {
        authorization: token ?? undefined,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket?.on("connect", () => {
      console.log("Socket: Connected to socket server");
      setIsConnected(true);
    });

    newSocket?.on("disconnect", (reason: string) => {
      console.log(`Socket: Disconnected from socket server. Reason: ${reason}`);
      setIsConnected(false);
      if (reason === "io server disconnect") {
        newSocket.connect();
      }
    });

    newSocket?.on("connect_error", (error: Error) => {
      console.error(`Socket: Connection error: ${error.message}`);
      setIsConnected(false);
    });

    newSocket?.on("errors", (data) => {
      console.log(`Socket: Error received: ${JSON.stringify(data)}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket?.close();
    };
  }, []);

  // Functions related to chat in mail details

  const emitGetRoomMembers = useCallback(
    (reference: string, mailId: number) => {
      if (socket && isConnected) {
        console.log(
          `Socket: Emitting getRoomMembers - reference: ${reference}, mailId: ${mailId}`
        );
        socket.emit("getRoomMembers", {
          reference,
          mail_id: mailId,
        });
      }
    },
    [socket, isConnected]
  );

  const emitNewMessageToRoom = useCallback(
    (data: {
      receiver_id: number;
      payload: string;
      reference: string;
      mail_id: number;
    }) => {
      if (socket && isConnected) {
        console.log(
          `Socket: Emitting newMessageToRoom - ${JSON.stringify(data)}`
        );
        socket.emit("newMessageToRoom", data);
      }
    },
    [socket, isConnected]
  );

  const onRoomMembers = useCallback(
    (callback: (members: number[]) => void) => {
      if (socket) {
        console.log("Socket: Setting up listener for roomMembers event");
        socket.on("roomMembers", (members) => {
          console.log(
            `Socket: Received roomMembers event - ${JSON.stringify(members)}`
          );
          callback(members);
        });
      }
      return () => {
        if (socket) {
          console.log("Socket: Removing listener for roomMembers event");
          socket.off("roomMembers", callback);
        }
      };
    },
    [socket]
  );

  const onUserJoined = useCallback(
    (callback: (user: any) => void) => {
      if (socket) {
        console.log("Socket: Setting up listener for userJoined event");
        socket.on("userJoined", (user) => {
          console.log(
            `Socket: Received userJoined event - ${JSON.stringify(user)}`
          );
          callback(user);
        });
      }
      return () => {
        if (socket) {
          console.log("Socket: Removing listener for userJoined event");
          socket.off("userJoined", callback);
        }
      };
    },
    [socket]
  );

  const onUserLeft = useCallback(
    (callback: (user: any) => void) => {
      if (socket) {
        console.log("Socket: Setting up listener for userLeft event");
        socket.on("userLeft", (user) => {
          console.log(
            `Socket: Received userLeft event - ${JSON.stringify(user)}`
          );
          callback(user);
        });
      }
      return () => {
        if (socket) {
          console.log("Socket: Removing listener for userLeft event");
          socket.off("userLeft", callback);
        }
      };
    },
    [socket]
  );

  // Functions related to general chat

  const emitGetClientChat = useCallback(
    (clientId: number, lastMessageId?: number) => {
      if (socket && isConnected) {
        const payload = { client_id: clientId };
        if (lastMessageId !== undefined) {
          payload.last_id = lastMessageId;
        }
        console.log(
          `Socket: Emitting getClientChat - ${JSON.stringify(payload)}`
        );
        socket.emit("getClientChat", payload);
      }
    },
    [socket, isConnected]
  );

  const onNewMessageToChat = useCallback(
    (callback: (messages: any[]) => void) => {
      if (socket) {
        console.log("Socket: Setting up listener for newMessageToChat event");
        socket.on("newMessageToChat", (messages) => {
          console.log(
            `Socket: Received newMessageToChat event - ${JSON.stringify(
              messages
            )}`
          );
          callback(messages);
        });
      }
      return () => {
        if (socket) {
          console.log("Socket: Removing listener for newMessageToChat event");
          socket.off("newMessageToChat", callback);
        }
      };
    },
    [socket]
  );

  const onCreatedMessage = useCallback(
    (callback: (messages: any[]) => void) => {
      if (socket) {
        console.log("Socket: Setting up listener for createdMessage event");
        socket.on("createdMessage", (messages) => {
          console.log(
            `Socket: Received createdMessage event - ${JSON.stringify(
              messages
            )}`
          );
          callback(messages);
        });
      }
      return () => {
        if (socket) {
          console.log("Socket: Removing listener for createdMessage event");
          socket.off("createdMessage", callback);
        }
      };
    },
    [socket]
  );

  const onClientChats = useCallback(
    (callback: (history: any[]) => void) => {
      if (socket) {
        console.log("Socket: Setting up listener for clientChats event");
        socket.on("clientChats", (history) => {
          console.log(
            `Socket: Received clientChats event - ${JSON.stringify(history)}`
          );
          callback(history);
        });
      }
      return () => {
        if (socket) {
          console.log("Socket: Removing listener for clientChats event");
          socket.off("clientChats", callback);
        }
      };
    },
    [socket]
  );

  const onOnlineUsers = useCallback(
    (callback: (onlineUsers: any[]) => void) => {
      if (socket) {
        console.log("Socket: Setting up listener for onlineUsers event");
        socket.on("onlineUsers", (onlineUsers) => {
          console.log(
            `Socket: Received onlineUsers event - ${JSON.stringify(
              onlineUsers
            )}`
          );
          callback(onlineUsers);
        });
      }
      return () => {
        if (socket) {
          console.log("Socket: Removing listener for onlineUsers event");
          socket.off("onlineUsers", callback);
        }
      };
    },
    [socket]
  );

  const sendMessage = useCallback(
    (
      receiverId: number,
      payload: string,
      repliedToId: string | null = null,
      files: FileWithPreview[] = []
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        if (socket && isConnected) {
          console.log("Emitting newMessageToChat event:", {
            receiver_id: receiverId,
            payload,
            replied_to_id: repliedToId,
            file_ids: files.map((file) => file.id),
          });
          socket.emit(
            "newMessageToChat",
            {
              receiver_id: receiverId,
              payload,
              replied_to_id: repliedToId,
              file_ids: files.map((file) => file.id),
            },
            (response: { success: boolean }) => {
              resolve(response.success);
            }
          );
        } else {
          resolve(false);
        }
      });
    },
    [isConnected, socket]
  );

  return {
    socket,
    isConnected,
    // Functions related to chat in mail details
    emitGetRoomMembers,
    emitNewMessageToRoom,
    onRoomMembers,
    onUserJoined,
    onUserLeft,
    // Functions related to general chat
    emitGetClientChat,
    onNewMessageToChat,
    onCreatedMessage,
    onClientChats,
    onOnlineUsers,
    sendMessage,
  };
}
