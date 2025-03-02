"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, PaperclipIcon, Users, X } from "lucide-react";
import { motion } from "framer-motion";
import { ErrorBoundary } from "react-error-boundary";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSocket } from "@/hooks/useSocket";
import { translate } from "@/app/dashboard/mails/mail.translations";
import { getUserData } from "@/lib/auth";
import { formatDateCompact } from "@/lib/utils";
import type { InternalMailDetail, ResponsibilitiesResponse } from "@/lib/types";
import { fetchResponsibilitiesWithPermissions, downloadFile } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { CompactFileUpload } from "@/components/CompactFileUpload";

interface ExtendedChatMessage extends ChatMessage {
  members?:
    | Array<{ id: number; first_name: string; last_name: string }>
    | string;
  files?: Array<{ name: string }>;
}

interface InternalMailChatProps {
  mail: InternalMailDetail;
  currentResponsibilityId: number;
}

export function InternalMailChat({
  mail,
  currentResponsibilityId,
}: InternalMailChatProps) {
  const { language } = useLanguage();
  const [chatMessages, setChatMessages] = useState<ExtendedChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const userData = getUserData();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const {
    socket,
    isConnected,
    emitNewMessageToRoom,
    emitRoomMessages,
    onRoomMessage,
  } = useSocket();
  const [uploadedFiles, setUploadedFiles] = useState<
    { id: number; name: string }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (isConnected && mail) {
      emitRoomMessages({
        reference: "internal",
        mail_id: mail.id,
      });
    }
  }, [isConnected, emitRoomMessages, mail]);

  useEffect(() => {
    const unsubscribe = onRoomMessage((data: ChatMessage | ChatMessage[]) => {
      console.log("Received new message:", data);
      if (Array.isArray(data)) {
        setChatMessages((prev) => [...prev, ...data]);
      } else {
        setChatMessages((prev) => [...prev, data]);
      }
    });

    return unsubscribe;
  }, [onRoomMessage]);

  useEffect(() => {
    async function loadUsers() {
      if (!currentResponsibilityId) return;
      try {
        const response: ResponsibilitiesResponse =
          await fetchResponsibilitiesWithPermissions({
            skip: currentPage,
            limit: pageSize,
            order_direction: "DESC",
            order_by: "id",
            search: searchTerm,
            current_responsibility_id: currentResponsibilityId,
            lang: language,
          });
        setAllUsers(response.payload ?? []);
        setTotal(response.payload?.length ?? 0);
      } catch (error) {
        console.error("Error loading users:", error);
      }
    }

    loadUsers();
  }, [currentPage, searchTerm, language, currentResponsibilityId]);

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendMessage = () => {
    console.log("Sending message:", {
      messageText,
      selectedUsers,
      uploadedFiles,
    });
    if (messageText.trim() && mail) {
      const messageData: any = {
        payload: messageText,
        reference: "internal",
        mail_id: mail.id,
      };

      if (selectedUsers.length > 0) {
        messageData.member_ids = selectedUsers;
      }

      if (uploadedFiles.length > 0) {
        messageData.file_ids = uploadedFiles.map((file) => file.id);
      }

      socket?.emit("newMessageToRoom", messageData);
      setMessageText("");
      setSelectedUsers([]);
      setUploadedFiles([]);

      if (messagesContainerRef.current) {
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop =
              messagesContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    }
  };

  const handleFileUpload = (fileIds: number[]) => {
    console.log("Handling file upload:", fileIds);
    const newFiles = fileIds.map((id) => ({ id, name: `File ${id}` }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: number) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      <Card className="flex-grow flex flex-col overflow-hidden">
        <CardHeader className="bg-muted">
          <CardTitle>{translate("mails.detail.chat", language)}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0">
          <ErrorBoundary
            fallback={
              <div className="p-4">
                There was an error loading the chat. Please try again later.
              </div>
            }
          >
            <div className="flex flex-col h-full">
              <div
                ref={messagesContainerRef}
                className="flex-grow overflow-y-auto p-4"
                style={{ scrollBehavior: "smooth" }}
              >
                {chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    className={`mb-4 flex ${
                      msg.creator_id === userData?.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`max-w-[80%] overflow-hidden rounded-lg border ${
                        msg.creator_id === userData?.id
                          ? "bg-blue-50 border-blue-100"
                          : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="text-lg font-bold text-blue-900 leading-none mb-2">
                              {msg.fullname.toUpperCase()}
                            </div>
                            {(() => {
                              if (
                                Array.isArray(msg.members) &&
                                msg.members.length > 0
                              ) {
                                return (
                                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                    <Users className="h-3.5 w-3.5" />
                                    <span className="font-medium">
                                      {msg.members
                                        .map(
                                          (member) =>
                                            `${member.first_name} ${member.last_name}`
                                        )
                                        .join(", ")}
                                    </span>
                                  </div>
                                );
                              } else if (
                                Array.isArray(msg.members) &&
                                msg.members.length === 0
                              ) {
                                return null;
                              } else if (typeof msg.members === "string") {
                                return null;
                              } else {
                                return null;
                              }
                            })()}
                          </div>
                          <div className="text-xs text-slate-500 whitespace-nowrap">
                            {formatDateCompact(
                              Number(msg.created_at),
                              language
                            )}
                          </div>
                        </div>
                        <div className="bg-white rounded-md p-3 shadow-sm">
                          <p className="text-slate-900">{msg.payload}</p>
                        </div>
                        {msg.files && msg.files.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {msg.files.map((file, index) => (
                              <button
                                key={index}
                                onClick={() => downloadFile(file.id)}
                                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                <PaperclipIcon className="h-3.5 w-3.5" />
                                {file.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="h-[120px] p-4 border-t bg-background">
                {uploadedFiles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center bg-slate-100 rounded-full px-3 py-1 text-sm"
                      >
                        <span className="mr-2 truncate max-w-[150px]">
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center space-x-2 mb-2">
                  <Input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={translate(
                      "mails.detail.typeMessage",
                      language
                    )}
                    className="flex-grow"
                    onKeyPress={(e) =>
                      e.key === "Enter" && !isUploading && handleSendMessage()
                    }
                  />
                  <CompactFileUpload
                    onUploadSuccess={(fileIds) => {
                      console.log("Files uploaded successfully:", fileIds);
                      handleFileUpload(fileIds);
                    }}
                    onUploadStart={() => {
                      console.log("File upload started");
                      setIsUploading(true);
                    }}
                    onUploadEnd={() => {
                      console.log("File upload ended");
                      setIsUploading(false);
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={isUploading}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">
                      {translate("mails.detail.sendMessage", language)}
                    </span>
                  </Button>
                </div>
                {selectedUsers.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {translate("detail.selectedUsers", language)}:{" "}
                    {selectedUsers.length}
                  </div>
                )}
              </div>
            </div>
          </ErrorBoundary>
        </CardContent>
      </Card>
      <Card className="w-1/3 flex flex-col overflow-hidden">
        <CardHeader className="bg-muted">
          <CardTitle>{translate("mails.detail.users", language)}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-0 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-4 space-y-4">
              {allUsers.map((userResp) => (
                <motion.div
                  key={userResp.id}
                  className="flex items-center p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleUserSelection(userResp.id)}
                >
                  <Checkbox
                    checked={selectedUsers.includes(userResp.id)}
                    onCheckedChange={() => toggleUserSelection(userResp.id)}
                    className="mr-2"
                  />
                  <Avatar className="mr-3">
                    <AvatarImage
                      src={`https://api.dicebear.com/6.x/initials/svg?seed=${userResp.user.first_name} ${userResp.user.last_name}`}
                    />
                    <AvatarFallback>
                      {userResp.user.first_name?.[0]}
                      {userResp.user.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-medium block">
                      {userResp.user.first_name} {userResp.user.last_name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {userResp.names.find((n) => n.lang === language)?.name ||
                        userResp.slug}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
