import { useEffect, useRef } from 'react';
import ChatMessage from '@/components/ChatMessage';
import type { ChatMessage as TChatMessage } from '@/types';

interface ChatMessagesProps {
  messages: TChatMessage[];
  onWelcomeSend: (query: string) => void;
  isSidebarOpen: boolean;
  onOpenSource?: (source: import('@/types').Source) => void;
}

export function ChatMessages({ messages, onWelcomeSend, isSidebarOpen, onOpenSource }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isEmpty = messages.length === 0;

  if (isEmpty) {
    return <WelcomeScreen onSend={onWelcomeSend} />;
  }

  return (
    <div className="flex-1 overflow-y-auto w-full select-text">
      <div
        className={[
          'mx-auto flex w-full flex-col gap-8 pt-8 pb-8 px-4',
          isSidebarOpen ? 'max-w-3xl' : 'max-w-3xl lg:max-w-none lg:px-8 xl:px-10',
        ].join(' ')}
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onOpenSource={onOpenSource} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
const EXAMPLE_QUESTIONS = [
  'Was ist das AppSkript?',
  'Was sind unsere Coding Guidelines?',
  'Erkläre den Unterschied zwischen synchronen und asynchronen Tasks.',
  'Wie verwende ich die JobRouter JavaScript API in einem Dialog?',
];

function WelcomeScreen({ onSend }: { onSend: (q: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-10">
      <div className="text-center space-y-4">
        <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center overflow-hidden">
          <img src="/logo.svg" alt="WS Copilot" className="w-25 h-25" />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#756b62]">
          Digitalisierung einfach gemacht
        </p>
        <h1 className="max-w-2xl text-4xl font-light tracking-[-0.04em] text-[#2f2b26] sm:text-5xl">
          Klarer arbeiten mit Ihrer Wissensbasis.
        </h1>
        <p className="mx-auto max-w-lg text-sm leading-6 text-[#756b62]">
          Stelle Fragen zu deiner Plattform-Dokumentation, Coding Guidelines oder lass dir Code
          generieren.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
        {EXAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSend(q)}
            className="ci-panel text-left rounded-2xl p-4 text-sm leading-6 text-[#756b62] transition-all hover:border-[#f3aa7f]/40 hover:text-[#2f2b26] hover:shadow-[0_4px_16px_rgba(243,170,127,0.12),0_12px_36px_rgba(47,43,38,0.08)]"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
