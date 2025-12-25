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
    <div className="flex h-full w-full overflow-hidden max-[900px]:flex-col">
      <aside className="w-[260px] min-w-[260px] border-r border-slate-800 bg-slate-900 p-4 max-[900px]:w-full max-[900px]:min-w-full max-[900px]:border-b max-[900px]:border-r-0">
        {toolbar}
      </aside>
      <div className="flex flex-1 flex-col bg-slate-950">
        {topBar ? (
          <div className="flex h-11 items-center border-b border-slate-800 bg-slate-900/70 px-4 text-sm tracking-wide text-slate-300">
            {topBar}
          </div>
        ) : null}
        <div className="relative flex-1 overflow-hidden">{children}</div>
      </div>
      {rightPanel ? (
        <aside className="flex w-[240px] min-w-[240px] flex-col border-l border-slate-800 bg-slate-900 max-[900px]:w-full max-[900px]:min-w-full max-[900px]:border-l-0 max-[900px]:border-t">
          {rightPanel}
        </aside>
      ) : null}
    </div>
  )
}

export default EditorLayout
