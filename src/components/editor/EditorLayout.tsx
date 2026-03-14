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
    <div className="flex h-full w-full overflow-hidden bg-transparent max-[1100px]:flex-col">
      <aside className="w-72 shrink-0 border-r border-slate-200 bg-white/92 p-4 max-[1100px]:w-full max-[1100px]:border-b max-[1100px]:border-r-0">
        {toolbar}
      </aside>
      <div className="flex flex-1 flex-col bg-transparent">
        {topBar ? (
          <div className="border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur">
            {topBar}
          </div>
        ) : null}
        <div className="relative flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(247,243,252,0.96))]">
          {children}
        </div>
      </div>
      {rightPanel ? (
        <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white/92 max-[1100px]:w-full max-[1100px]:border-l-0 max-[1100px]:border-t">
          {rightPanel}
        </aside>
      ) : null}
    </div>
  )
}

export default EditorLayout
