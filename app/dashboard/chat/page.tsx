"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import { getUserData } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Wifi, WifiOff, CornerUpLeft, Paperclip, X } from "lucide-react";
import { fetchChatUsers } from "@/lib/api";
import type { ChatUser } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { chatTranslations } from "./chat.translations";
import { FileUpload } from "@/components/FileUpload";
import type { FileWithPreview } from "@/types/files";
import { FileIcon } from "lucide-react";

interface Message {
  id: string;
  sender_fullname: string;
  receiver_fullname: string;
  sender_id: number;
  receiver_id: number;
  payload: string;
  files: FileWithPreview[];
  is_deleted: boolean;
  is_read: boolean;
  created_at: string;
  replied_to_id: string | null;
}

interface PendingMessage {
  receiver_id: number;
  payload: string;
  tempId: string;
  created_at: string;
  replied_to_id: string | null;
  files: FileWithPreview[];
}

const STORAGE_KEY = "chatMessages";

export default function ChatPage() {
  const {
    isConnected,
    emitNewMessageToRoom,
    emitGetClientChat,
    onNewMessageToChat,
    onUserJoined,
    onUserLeft,
    onCreatedMessage,
    onClientChats,
    onOnlineUsers,
    sendMessage,
  } = useSocket();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<(Message | PendingMessage)[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const currentUser = getUserData();
  const pageSize = 10;
  const { language } = useLanguage();
  const [lastSentMessage, setLastSentMessage] = useState<Message | null>(null);
  const [lastSentMessageId, setLastSentMessageId] = useState<string | null>(
    null
  );
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);

  const translate = useCallback(
    (key: keyof typeof chatTranslations.en) => {
      return chatTranslations[language][key] || key;
    },
    [language]
  );

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchChatUsers({
        skip: currentPage,
        limit: pageSize,
        order_direction: "DESC",
        order_by: "id",
        status: "active",
        ...(searchTerm && { search: searchTerm }),
      });
      setUsers(response.payload.data);
      setTotal(response.payload.total);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        variant: "destructive",
        title: translate("loadError"),
        description: translate("loadError"),
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, toast, translate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadUsers]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, []);

  const saveMessagesToStorage = useCallback(
    (userId: number, messages: Message[]) => {
      const storedData = localStorage.getItem(STORAGE_KEY);
      const chatData = storedData ? JSON.parse(storedData) : {};
      chatData[userId] = messages;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatData));
    },
    []
  );

  const loadMessagesFromStorage = useCallback((userId: number): Message[] => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const chatData = JSON.parse(storedData);
      return chatData[userId] || [];
    }
    return [];
  }, []);

  const getLastMessageId = useCallback((messages: Message[]): string | null => {
    if (messages.length === 0) return null;
    return messages[messages.length - 1].id;
  }, []);

  useEffect(() => {
    const handleOnlineUsers = (onlineUsersData: any[]) => {
      console.log("Received onlineUsers event:", onlineUsersData);
      const onlineUserIds = onlineUsersData.map((item) => item.user.id);
      setOnlineUsers(onlineUserIds);
    };

    const unsubscribeNewMessageToChat = onNewMessageToChat(
      (newMessages: Message[]) => {
        console.log("Received newMessageToChat event:", newMessages);
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          newMessages.forEach((newMsg) => {
            if (
              !updatedMessages.some(
                (existingMsg) => existingMsg.id === newMsg.id
              )
            ) {
              updatedMessages.push(newMsg);
            }
          });
          if (selectedUser) {
            saveMessagesToStorage(
              selectedUser.id,
              updatedMessages as Message[]
            );
          }
          return updatedMessages;
        });
        scrollToBottom();
      }
    );

    const unsubscribeCreatedMessage = onCreatedMessage((newMessages) => {
      console.log("Received createdMessage event:", newMessages);
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        newMessages.forEach((newMsg) => {
          if (
            !updatedMessages.some((existingMsg) => existingMsg.id === newMsg.id)
          ) {
            updatedMessages.push(newMsg);
          }
        });
        if (selectedUser) {
          saveMessagesToStorage(selectedUser.id, updatedMessages as Message[]);
        }
        return updatedMessages;
      });
      scrollToBottom();
    });

    const unsubscribeUserJoined = onUserJoined((user) => {
      console.log("Received userJoined event:", user);
      toast({
        title: translate("userJoined"),
        description: `${user.first_name} ${user.last_name} ${translate(
          "userJoined"
        ).toLowerCase()}`,
      });
    });

    const unsubscribeUserLeft = onUserLeft((user) => {
      console.log("Received userLeft event:", user);
      toast({
        title: translate("userLeft"),
        description: `${user.first_name} ${user.last_name} ${translate(
          "userLeft"
        ).toLowerCase()}`,
      });
    });

    onOnlineUsers(handleOnlineUsers);

    return () => {
      unsubscribeNewMessageToChat();
      unsubscribeUserJoined();
      unsubscribeUserLeft();
      unsubscribeCreatedMessage();
    };
  }, [
    onNewMessageToChat,
    onUserJoined,
    onUserLeft,
    onCreatedMessage,
    onOnlineUsers,
    selectedUser,
    toast,
    translate,
    scrollToBottom,
    saveMessagesToStorage,
  ]);

  useEffect(() => {
    if (selectedUser) {
      const cachedMessages = loadMessagesFromStorage(selectedUser.id);
      setMessages(cachedMessages);
      scrollToBottom();

      const lastMessageId = getLastMessageId(cachedMessages);
      if (lastMessageId) {
        setLastSentMessageId(lastMessageId);
        emitGetClientChat(selectedUser.id, Number.parseInt(lastMessageId));
      } else {
        setLastSentMessageId(null);
        emitGetClientChat(selectedUser.id);
      }

      const unsubscribeClientChats = onClientChats((history) => {
        console.log("Received conversation_history event:", history);
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, ...history];
          if (selectedUser) {
            saveMessagesToStorage(
              selectedUser.id,
              updatedMessages as Message[]
            );
          }
          return updatedMessages;
        });
        scrollToBottom();
      });

      return () => {
        unsubscribeClientChats();
      };
    }
  }, [
    selectedUser,
    emitGetClientChat,
    onClientChats,
    scrollToBottom,
    loadMessagesFromStorage,
    saveMessagesToStorage,
    getLastMessageId,
  ]);

  const handleSendMessage = async () => {
    if (!selectedUser || (!newMessage.trim() && selectedFiles.length === 0))
      return;

    sendMessage(
      selectedUser.id,
      newMessage,
      replyingTo ? replyingTo.id : null,
      selectedFiles
    );

    setNewMessage("");
    setReplyingTo(null);
    setSelectedFiles([]);
    scrollToBottom();
  };

  const formatDate = (dateString: string) => {
    try {
      let date: Date;
      if (
        typeof dateString === "string" &&
        dateString.length === 13 &&
        !isNaN(Number(dateString))
      ) {
        date = new Date(Number(dateString));
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      return new Intl.DateTimeFormat(language === "en" ? "en-US" : "ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (error) {
      console.error(
        "Error formatting date:",
        error,
        "Date string:",
        dateString
      );
      return "";
    }
  };

  const getInitials = (fullname: string) => {
    return fullname
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase();
  };

  const isUserOnline = (userId: number) => {
    return onlineUsers.some((onlineUser) => onlineUser === userId);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleFileSelect = (files: FileWithPreview[]) => {
    setSelectedFiles(files);
    setShowFileUpload(false);
  };

  const removeSelectedFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const renderMessage = (message: Message | PendingMessage, index: number) => {
    const isCurrentUser =
      "sender_id" in message ? message.sender_id === currentUser?.id : true;
    const isReply = message.replied_to_id !== null;
    const repliedMessage = isReply
      ? messages.find(
          (m) =>
            "id" in m &&
            message.replied_to_id !== null &&
            +m.id === +message.replied_to_id
        )
      : null;

    return (
      <div
        key={index}
        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`flex gap-2 items-end ${
            isCurrentUser ? "flex-row-reverse" : ""
          }`}
        >
          {!isCurrentUser && (
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {getInitials(
                  "sender_fullname" in message
                    ? message.sender_fullname
                    : "User"
                )}
              </AvatarFallback>
            </Avatar>
          )}
          <div
            className={`max-w-md rounded-2xl px-4 py-2 ${
              isCurrentUser ? "bg-blue-600 text-primary-foreground" : "bg-muted"
            } ${isReply ? "border-l-4 border-primary" : ""}`}
          >
            {isReply && (
              <div className="mb-2 p-2 bg-black/10 rounded text-xs">
                <div className="font-semibold">{translate("replyTo")}:</div>
                <div>
                  {repliedMessage
                    ? (repliedMessage as Message).payload.substring(0, 150)
                    : translate("messageNotFound")}
                  ...
                </div>
              </div>
            )}
            <div>{message.payload}</div>
            {message.files && message.files.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.files.map((file) => (
                  <div key={file.id} className="flex items-center space-x-2">
                    <FileIcon className="h-4 w-4" />
                    <span className="text-xs">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
            <div
              className={`text-xs mt-1 ${
                isCurrentUser
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground"
              }`}
            >
              {formatDate(message.created_at)}
            </div>
          </div>
          {!isCurrentUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReply(message as Message)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <CornerUpLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      <div className="fixed top-4 right-4 z-50">
        {isConnected ? (
          <Badge variant="secondary" className="gap-1">
            <Wifi className="h-3 w-3" />
            {translate("connected")}
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="gap-1 bg-yellow-100 text-yellow-700"
          >
            <WifiOff className="h-3 w-3" />
            {translate("reconnecting")}
          </Badge>
        )}
      </div>

      {/* Users List */}
      <Card className="w-80 flex flex-col">
        <CardHeader>
          <CardTitle>{translate("chats")}</CardTitle>
          <CardDescription>
            {translate("userList")} ({total})
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="p-4 border-b">
            <Input
              type="search"
              placeholder={translate("searchUsers")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="space-y-4 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {users
                  .filter((user) => user.id !== currentUser?.id)
                  .map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedUser?.id === user.id
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(
                              `${user.first_name} ${user.last_name}`
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            isUserOnline(user.id)
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {isUserOnline(user.id) ? (
                            <Badge variant="secondary" className="font-normal">
                              {translate("online")}
                            </Badge>
                          ) : (
                            translate("offline")
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Window */}
      {selectedUser ? (
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {getInitials(
                      `${selectedUser.first_name} ${selectedUser.last_name}`
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>
                    {selectedUser.first_name} {selectedUser.last_name}
                  </CardTitle>
                  <CardDescription>
                    {isUserOnline(selectedUser.id)
                      ? translate("online")
                      : translate("offline")}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent
            className="flex-1 p-4 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 13rem)" }}
            ref={messagesContainerRef}
          >
            <div className="space-y-4">
              {messages.map((message, index) => renderMessage(message, index))}
            </div>
          </CardContent>
          <div className="p-4 border-t">
            {replyingTo && (
              <div className="mb-2 p-2 bg-muted rounded-md flex justify-between items-center">
                <div className="text-sm">
                  {translate("replyingTo")}:{" "}
                  {replyingTo.payload.substring(0, 20)}...
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                >
                  <CornerUpLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
            {showFileUpload && (
              <div className="mb-4">
                <FileUpload onFileSelect={handleFileSelect} />
              </div>
            )}
            {selectedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedFiles.map((file) => (
                  <Badge
                    key={file.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <span className="truncate max-w-[100px]">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSelectedFile(file.id)}
                      className="p-0 h-4 w-4"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={translate("enterMessage")}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowFileUpload(!showFileUpload)}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                disabled={!newMessage.trim() && selectedFiles.length === 0}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      ) : (
        <Card className="flex-1 flex items-center justify-center">
          <CardContent className="text-center">
            <CardDescription>{translate("selectUser")}</CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

