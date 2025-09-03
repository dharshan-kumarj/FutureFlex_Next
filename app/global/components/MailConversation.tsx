"use client";

import React, { useState } from "react";
import {
  Archive,
  Trash2,
  Star,
  Reply,
  ReplyAll,
  Forward,
  MoreHorizontal,
  ArrowLeft,
  Paperclip,
  Download,
  FileText,
  Image,
  Send,
  Bold,
  Italic,
  Underline,
  Link
} from "lucide-react";

// Types
export type Attachment = {
  id: number;
  name: string;
  size: string;
  type: 'pdf' | 'image' | 'doc';
};

export type Message = {
  id: number;
  sender: string;
  senderName: string;
  recipient: string;
  recipientName: string;
  timestamp: string;
  body: string;
  attachments: Attachment[];
  isFromMe: boolean;
};

const getAttachmentIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileText className="w-4 h-4 text-red-500" />;
    case 'image':
      return <Image className="w-4 h-4 text-blue-500" />;
    default:
      return <FileText className="w-4 h-4 text-blue-500" />;
  }
};

function MailConversation({ initialConversation }: { initialConversation: Message[] }) {
  const [conversation] = useState<Message[]>(initialConversation);
  const [replyText, setReplyText] = useState<string>("");
  const [isReplying, setIsReplying] = useState(false);

  const subject = "Quarterly Report Discussion";
  const participants = "John Doe, Me";

  const handleReply = () => {
    if (!replyText.trim()) return;
    setReplyText("");
    setIsReplying(false);
  };

  return (
    <>
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Archive className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Trash2 className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Star className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">1 of 1</span>
          <button className="p-2 hover:bg-gray-100 rounded">
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Email Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-normal text-gray-900 mb-2">{subject}</h1>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {conversation.length} messages
          </div>
          <div className="text-sm text-gray-600">
            {participants}
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {conversation.map((message, idx) => (
          <React.Fragment key={message.id}>
            <div className="group">
              {/* Message Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                    message.isFromMe ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {message.senderName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {message.senderName}
                      <span className="font-normal text-gray-600 ml-2">
                        &lt;{message.sender}&gt;
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      to {message.recipientName} &lt;{message.recipient}&gt;
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{message.timestamp}</span>
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded">
                    <Star className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded">
                    <Reply className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Message Body */}
              <div className="ml-13 mb-4">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {message.body}
                </div>

                {/* Attachments */}
                {message.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {message.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          {getAttachmentIcon(attachment.type)}
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {attachment.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {attachment.size}
                            </div>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-gray-200 rounded">
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {idx < conversation.length - 1 && (
              <hr className="my-4 border-gray-200" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Reply Section */}
      <div className="border-t border-gray-200 bg-white">
        {!isReplying ? (
          <div className="px-6 py-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsReplying(true)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Reply className="w-4 h-4" />
                <span>Reply</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <ReplyAll className="w-4 h-4" />
                <span>Reply all</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <Forward className="w-4 h-4" />
                <span>Forward</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 border-t-2 border-blue-500">
            {/* Reply Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Reply to John Doe &lt;john.doe@company.com&gt;
              </div>
              <button
                onClick={() => setIsReplying(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {/* Formatting Toolbar */}
            <div className="flex items-center space-x-1 mb-4 pb-2 border-b border-gray-200">
              <button className="p-2 hover:bg-gray-100 rounded">
                <Bold className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded">
                <Italic className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded">
                <Underline className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded">
                <Link className="w-4 h-4 text-gray-600" />
              </button>
              <div className="border-l border-gray-300 h-6 mx-2"></div>
              <button className="p-2 hover:bg-gray-100 rounded">
                <Paperclip className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Reply Textarea */}
            <textarea
              className="w-full min-h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={6}
              placeholder="Type your message..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />

            {/* Send Button */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="w-4 h-4" />
                  <span>Attach files</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default MailConversation;
