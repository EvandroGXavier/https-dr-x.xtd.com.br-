import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Info, Search, Video, Phone } from 'lucide-react'

interface ChatHeaderProps {
  contactName: string
  contactImage?: string
  onToggleInfoPanel: () => void
}

export function ChatHeader({ contactName, contactImage, onToggleInfoPanel }: ChatHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <div className="flex items-center justify-between p-2 border-b h-16 flex-shrink-0">
      <div className="flex items-center gap-3 cursor-pointer" onClick={onToggleInfoPanel}>
        <Avatar>
          <AvatarImage src={contactImage} alt={contactName} />
          <AvatarFallback>{getInitials(contactName)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{contactName}</p>
          <p className="text-xs text-muted-foreground">online</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleInfoPanel}>
          <Info className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
