import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Instance {
  id: string
  name: string
}

interface Thread {
  id: string
  name: string
  profilePictureUrl?: string
  lastMessageAt: string
}

interface ConversationListProps {
  instances: Instance[]
  selectedInstanceId?: string
  onInstanceChange: (instanceId: string) => void
  threads: Thread[]
  selectedThreadId?: string
  onThreadSelect: (threadId: string) => void
}

export function ConversationList({
  instances,
  selectedInstanceId,
  onInstanceChange,
  threads,
  selectedThreadId,
  onThreadSelect,
}: ConversationListProps) {
  const selectedInstanceName = instances.find(i => i.id === selectedInstanceId)?.name;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-2 pt-2 flex-shrink-0">
        <div className="mb-2">
          <label className="text-xs text-muted-foreground mb-1 block">Instância</label>
          {selectedInstanceName ? (
            <div className="p-2 border rounded bg-muted/50 font-medium text-sm">
              {selectedInstanceName}
            </div>
          ) : (
            <select
              value={selectedInstanceId || ''}
              onChange={(e) => onInstanceChange(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Selecione uma instância</option>
              {instances.map((instance) => (
                <option key={instance.id} value={instance.id}>
                  {instance.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <Input placeholder="Pesquisar conversa..." className="my-2" />
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
              selectedThreadId === thread.id ? 'bg-muted' : 'hover:bg-muted/50'
            }`}
            onClick={() => onThreadSelect(thread.id)}
          >
            <Avatar>
              <AvatarImage src={thread.profilePictureUrl} />
              <AvatarFallback>{thread.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold truncate">{thread.name}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(thread.lastMessageAt).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
