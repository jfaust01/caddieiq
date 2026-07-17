import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CourseCharacteristicsProps {
  characteristics: string[]
}

export function CourseCharacteristics({ characteristics }: CourseCharacteristicsProps) {
  if (!characteristics || characteristics.length === 0) return null

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold mb-4">Course Characteristics</h3>
      <div className="flex flex-wrap gap-2">
        {characteristics.map((char) => (
          <Badge key={char} variant="secondary" className="font-medium">
            {char}
          </Badge>
        ))}
      </div>
    </Card>
  )
}
