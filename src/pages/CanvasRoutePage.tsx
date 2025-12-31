import { useParams } from 'react-router-dom'
import StickerEditorPage from './StickerEditorPage'

const CanvasRoutePage = () => {
  const { designId } = useParams()
  return (
    <div className="h-screen">
      <StickerEditorPage designId={designId} />
    </div>
  )
}

export default CanvasRoutePage
