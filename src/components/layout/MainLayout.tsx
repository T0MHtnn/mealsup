import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  return (
    <div className="flex flex-col h-screen">
      <nav className="bg-emerald-600 text-white p-4">
        <h1 className="text-2xl font-bold">🍳 MealsUp</h1>
      </nav>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
