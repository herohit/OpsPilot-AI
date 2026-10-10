import { ArrowLeft, CircleAlert } from 'lucide-react'
import { Link } from 'react-router'
import LoginImg from '../assets/login.png'

const PageNotFound = () => {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#030817] text-white">
      <div aria-hidden="true" className="absolute inset-0 md:left-[35%]">
        <img src={LoginImg} alt="" className="h-full w-full object-cover object-[62%_center] opacity-65 md:object-contain md:object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030817] via-[#030817]/75 to-[#030817]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030817]/50 via-transparent to-[#030817]/20" />
      </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col px-6 py-7 sm:px-10 md:px-14 md:py-9">
        <header className="flex items-center gap-3">
          <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-600">
            <span className="absolute h-1 w-11 rotate-[-45deg] bg-[#06112c]" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <span className="text-xl font-semibold">OpsPilot</span>
        </header>

        <section className="flex flex-1 items-center py-16">
          <div className="max-w-xl">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-blue-200">
              <CircleAlert aria-hidden="true" className="h-4 w-4" />
              <span>Page not found</span>
            </div>
            <p className="text-7xl font-bold leading-none text-white sm:text-8xl">404</p>
            <h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">This route is off the map.</h1>
            <p className="mt-3 max-w-md text-base leading-7 text-slate-300">
              The page may have moved, or the address may be incorrect. Let&apos;s get you back to OpsPilot.
            </p>
            <Link to="/login" className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-[#030817]">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Return to sign in
            </Link>
          </div>
        </section>

        <footer className="text-xs text-slate-400">OpsPilot infrastructure management</footer>
      </div>
    </main>
  )
}

export default PageNotFound;