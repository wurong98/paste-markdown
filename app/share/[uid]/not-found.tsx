import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-6">🔗</p>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
        分享已过期或不存在
      </h1>
      <p className="text-slate-500 mb-8">
        该链接可能已过期，或从未存在。
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
      >
        ← 新建分享
      </Link>
    </div>
  )
}
