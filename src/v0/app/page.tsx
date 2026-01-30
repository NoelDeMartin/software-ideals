import { PWAProvider } from '@/components/pwa-provider'
import { TodoContainer } from '@/components/todo/todo-container'

export default function Home() {
  return (
    <PWAProvider>
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-lg px-4 py-8 h-screen flex flex-col">
          <TodoContainer />
        </div>
      </main>
    </PWAProvider>
  )
}
