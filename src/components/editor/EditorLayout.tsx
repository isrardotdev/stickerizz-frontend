import type { ReactNode } from 'react'

type EditorLayoutProps = {
  toolbar: ReactNode
  topBar?: ReactNode
  rightPanel?: ReactNode
  children: ReactNode
}

const EditorLayout = ({
  toolbar,
  topBar,
  rightPanel,
  children,
}: EditorLayoutProps) => {
  return (
    <div className="editor-layout">
      <aside className="editor-toolbar">{toolbar}</aside>
      <div className="editor-main">
        {topBar ? <div className="editor-topbar">{topBar}</div> : null}
        <div className="editor-workspace">{children}</div>
      </div>
      {rightPanel ? <aside className="editor-right-panel">{rightPanel}</aside> : null}
    </div>
  )
}

export default EditorLayout
