import { useCallback } from 'react'
import Konva from 'konva'
import type { RefObject } from 'react'
import type { KonvaEventObject } from 'konva/lib/Node'

const SCALE_BY = 1.05
const MIN_SCALE = 0.2
const MAX_SCALE = 5

export const useStageZoomPan = (stageRef: RefObject<Konva.Stage | null>) => {
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()
      const stage = stageRef.current
      if (!stage) return

      const oldScale = stage.scaleX()
      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const direction = e.evt.deltaY > 0 ? -1 : 1
      const nextScale = direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, nextScale))

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      }

      stage.scale({ x: newScale, y: newScale })
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      }
      stage.position(newPos)
      stage.batchDraw()
    },
    [stageRef]
  )

  return { handleWheel }
}
