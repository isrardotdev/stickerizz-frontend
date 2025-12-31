import { useParams, useSearchParams } from 'react-router-dom'
import StickerEditorPage from './StickerEditorPage'

const CanvasRoutePage = () => {
  const { designId } = useParams()
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('templateId') ?? undefined
  return (
    <div className="h-screen">
      <StickerEditorPage designId={designId} templateId={templateId} />
    </div>
  )
}

export default CanvasRoutePage
