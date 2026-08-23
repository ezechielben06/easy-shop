import { Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <main className="container mx-auto px-4 py-4 max-w-2xl">
      <Outlet />
    </main>
  )
}

export default Layout