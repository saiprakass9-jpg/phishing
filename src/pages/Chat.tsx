import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Send, Bot, User, ArrowLeft, Loader2, MessageSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export default function Chat() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: t('chat.welcome'),
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      // Send the message to our backend which will handle the GenAI request
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
        signal: abortControllerRef.current?.signal
      });

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const data = await res.json();
      const text = data.text || t('chat.error.response');

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      // Ignore abort errors
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: t('chat.error.generic'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Only turn off loading if we haven't started a new request (though in this simple logic, we just turn it off)
      // If aborted, handleStop already set isLoading(false), but setting it here again is safe.
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-indigo-100 p-2 rounded-full">
                <Bot className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">{t('chat.title')}</h1>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  {t('chat.status')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-grow overflow-y-auto p-4 relative">
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex gap-4",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                msg.role === 'user' ? "bg-slate-100 border border-slate-200" : "bg-gradient-to-br from-indigo-600 to-violet-600"
              )}>
                {msg.role === 'user' ? (
                  <User className="h-5 w-5 text-slate-600" />
                ) : (
                  <Bot className="h-5 w-5 text-white" />
                )}
              </div>
              
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={cn(
                  "max-w-[80%] rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md",
                  msg.role === 'user' 
                    ? "bg-white text-slate-900 rounded-tr-none border border-slate-100" 
                    : "bg-indigo-600 text-white rounded-tl-none bg-gradient-to-br from-indigo-600 to-violet-600"
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <span className={cn(
                  "text-[10px] mt-2 block opacity-70",
                  msg.role === 'user' ? "text-right" : "text-left"
                )}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="bg-indigo-50 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 p-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto relative">
          {isLoading && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-10">
              <Button 
                variant="secondary" 
                onClick={handleStop} 
                className="shadow-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-full px-6"
              >
                <Square className="h-4 w-4 mr-2 fill-slate-700" /> {t('chat.stop')}
              </Button>
            </div>
          )}
          
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.placeholder')}
              className="flex-grow h-12 rounded-full px-6 border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </footer>
    </div>
  );
}
