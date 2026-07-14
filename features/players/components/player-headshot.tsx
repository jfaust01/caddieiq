import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Player } from '@/features/players/types'
import { initials } from '@/features/players/utils/format'
import { cn } from '@/lib/utils'

interface PlayerHeadshotProps {
  player: Pick<Player, 'fullName' | 'headshotUrl'>
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

/**
 * Player headshot placeholder. Uses the real image when a URL is present and
 * falls back to initials otherwise.
 *
 * TODO(data): populate `headshotUrl` from the provider layer.
 */
export function PlayerHeadshot({
  player,
  size = 'default',
  className,
}: PlayerHeadshotProps) {
  return (
    <Avatar size={size} className={cn(className)}>
      {player.headshotUrl ? (
        <AvatarImage src={player.headshotUrl} alt={player.fullName} />
      ) : null}
      <AvatarFallback>{initials(player.fullName)}</AvatarFallback>
    </Avatar>
  )
}
