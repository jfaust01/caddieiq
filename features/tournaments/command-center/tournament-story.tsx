import type { TournamentStory as TournamentStoryData } from "@/lib/command-center"

/**
 * Tournament Story widget — an auto-generated narrative overview. Each section
 * is assembled only from verified engine values, so the story degrades to an
 * honest empty state rather than asserting anything unbacked.
 */
export function TournamentStory({ story }: { story: TournamentStoryData }) {
  if (story.paragraphs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        The tournament story is generated from imported intelligence. It will fill in as field,
        conditions, market, and model data become available.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {story.paragraphs.map((paragraph) => (
        <div key={paragraph.id} className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {paragraph.heading}
          </h3>
          <p className="text-sm leading-relaxed text-foreground text-pretty">{paragraph.body}</p>
        </div>
      ))}
    </div>
  )
}
