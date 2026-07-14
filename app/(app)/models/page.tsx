import { redirect } from 'next/navigation'

/**
 * The Models workspace moved to the Model Lab (`/model-lab`). Keep this route as
 * a redirect so existing links continue to work.
 */
export default function ModelsPage() {
  redirect('/model-lab')
}
