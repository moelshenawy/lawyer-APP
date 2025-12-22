// ChatAIWrapper.jsx
import React from "react";
import MobileChatPage from "./MobilePage";

export default function ChatAIWrapper({ onClose }) {
  return (
    <div className="fixed bottom-20 right-5 w-[380px] max-h-[80vh] bg-white shadow-xl rounded-2xl overflow-hidden z-[9999] border border-gray-200">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 bg-gray-100 hover:bg-gray-200 rounded-full p-1"
      >
        ✕
      </button>

      <MobileChatPage isPopup />
    </div>
  );
}
