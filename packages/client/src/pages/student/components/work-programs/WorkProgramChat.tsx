import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { GET_WORK_PROGRAM_MESSAGES, SEND_WORK_PROGRAM_MESSAGE, WORK_PROGRAM_MESSAGE_ADDED } from "@/graphql/student";
import { useAuth } from "../../../../contexts/AuthContext";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card, CardContent } from "../../../../components/ui/card";
import { format } from "date-fns";
import { Send, User as UserIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface WorkProgramChatProps {
  workProgramId: string;
}

export function WorkProgramChat({ workProgramId }: WorkProgramChatProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, loading, subscribeToMore } = useQuery(GET_WORK_PROGRAM_MESSAGES, {
    variables: { workProgramId },
  });

  const [sendMessage, { loading: sending }] = useMutation(SEND_WORK_PROGRAM_MESSAGE);

  useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: WORK_PROGRAM_MESSAGE_ADDED,
      variables: { workProgramId },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const newMessage = subscriptionData.data.workProgramMessageAdded;
        
        // Avoid duplicate messages
        if (prev.workProgramMessages.some((m: any) => m.id === newMessage.id)) {
          return prev;
        }

        return {
          ...prev,
          workProgramMessages: [...prev.workProgramMessages, newMessage],
        };
      },
    });

    return () => unsubscribe();
  }, [subscribeToMore, workProgramId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    try {
      await sendMessage({
        variables: {
          workProgramId,
          content: message,
        },
      });
      setMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const messages = data?.workProgramMessages || [];

  return (
    <Card className="h-[500px] flex flex-col">
      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No messages yet. Start the discussion!</p>
            </div>
          ) : (
            messages.map((m: any) => {
              const isMe = m.sender.id === user?.id || m.sender.id === user?._id;
              return (
                <div
                  key={m.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="flex-shrink-0 mt-1">
                      {m.sender.picture ? (
                        <img 
                          src={m.sender.picture} 
                          alt={m.sender.name} 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {isMe ? "You" : m.sender.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(m.createdAt), "HH:mm")}
                        </span>
                      </div>
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm ${
                          isMe
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-muted text-gray-800 rounded-tl-none"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !message.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
