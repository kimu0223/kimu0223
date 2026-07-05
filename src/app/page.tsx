export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-5xl">⚽</span>
      <h1 className="text-4xl font-bold tracking-tight">PitchNote</h1>
      <p className="text-lg text-gray-600">
        サッカー指導者のためのプラットフォーム。
        <br />
        AIが指導案づくりを手伝い、現場の知見をみんなで共有する。
      </p>
      <div className="flex gap-4">
        <span className="rounded-full bg-green-600 px-6 py-3 font-semibold text-white">
          ⚽ AIに練習メニューを相談
        </span>
        <span className="rounded-full border border-gray-300 px-6 py-3 font-semibold">
          ✍️ 知見を記事にする
        </span>
      </div>
      <p className="text-sm text-gray-400">
        セットアップ手順は README.md を参照してください
      </p>
    </main>
  );
}
