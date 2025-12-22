import React from "react";
import ChatHeader from "./ChatHeader";
import ChatBody from "./ChatBody";
import ChatQuickReplies from "./ChatQuickReplies";
import ChatFooter from "./ChatFooter";

export default function ChatWindow({
  // controller
  chat,
  // required components
  AudioPlayer,
  VoiceRecorderBar,

  // header behavior
  onLeftClick,
  title,
}) {
  return (
    <>
      <ChatHeader
        title={title}
        onLeftClick={onLeftClick}
        showStartButton={chat.showStartButton}
        onStartNewChat={chat.startNewChat}
      />

      <ChatBody
        bodyRef={chat.bodyRef}
        messages={chat.messages}
        showHistoryButton={chat.showHistoryButton}
        hasLoadedMore={chat.hasLoadedMore}
        loadingHistory={chat.loadingHistory}
        onLoadHistory={chat.loadHistory}
        AudioPlayer={AudioPlayer}
      />

      <ChatQuickReplies
        quickReplies={chat.quickReplies}
        onSend={chat.handleSend}
      />

      <ChatFooter
        input={chat.input}
        setInput={chat.setInput}
        onSend={chat.handleSend}
        onMicClick={chat.handleMicClick}
        showRecorder={chat.showRecorder}
        setShowRecorder={chat.setShowRecorder}
        VoiceRecorderBar={VoiceRecorderBar}
      />
    </>
  );
}
