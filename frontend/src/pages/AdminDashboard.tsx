import { Catalog } from '../utils/mockData'
import { formatPrice } from '../utils/format'

// Simple mock data generation for charts; in real app, fetch from backend/analytics
const mockSales = [3200, 4800, 2600, 5400, 6100, 7000, 8400, 7900, 9200, 8800, 9600, 11000]
const mockCategories = [
  { name: 'Best for Gaming', value: 38 },
  { name: 'Video Streaming', value: 26 },
  { name: 'Budget-Friendly', value: 14 },
  { name: 'Best Camera', value: 12 },
  { name: 'Long Battery', value: 10 },
]

export default function AdminDashboard() {
  const totalRevenue = mockSales.reduce((a, b) => a + b, 0)
  const popular = Catalog.PRODUCTS.slice(0, 3)
  const top12 = [...Catalog.PRODUCTS].sort((a,b)=>b.popularity-a.popularity).slice(0,12)

  return (
  <section className="space-y-6 sm:space-y-8">
      <header>
    <h1 className="text-xl font-semibold sm:text-2xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Mock analytics and KPIs for stakeholders.</p>
      </header>

      {/* KPI cards */}
  <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI title="Monthly revenue (mock)" value={formatPrice(mockSales.at(-1)!)} trend="↑ 7% WoW" />
        <KPI title="Total revenue YTD" value={formatPrice(totalRevenue)} trend="↑ 19% YoY" />
        <KPI title="Orders" value={String(2743)} trend="↑ 3% WoW" />
        <KPI title="Conversion" value="2.4%" trend="→ Stable" />
      </div>

      {/* Sparkline style bar chart (CSS only) */}
  <div className="rounded-lg border border-[var(--border)] p-4">
        <h2 className="font-medium">Revenue last 12 months</h2>
        <div className="mt-3 flex items-end gap-1">
          {mockSales.map((v, i) => (
            <div key={i} className="flex-1">
              <div
        className="w-full rounded-t bg-[var(--brand-primary)]"
                style={{ height: `${Math.max(8, (v / Math.max(...mockSales)) * 160)}px` }}
                title={`$${v}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown (stacked bars) */}
      <div className="rounded-lg border border-[var(--border)] p-4">
        <h2 className="font-medium">Category breakdown</h2>
        <div className="mt-3 h-6 w-full overflow-hidden rounded bg-gray-100">
          <div className="flex h-full w-full">
            {mockCategories.map((c, i) => (
              <div
                key={c.name}
                className="h-full"
                style={{ width: `${c.value}%`, backgroundColor: ['#2563eb','#16a34a','#f59e0b','#dc2626','#7c3aed'][i] }}
                title={`${c.name} ${c.value}%`}
              />
            ))}
          </div>
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {mockCategories.map((c, i) => (
            <li key={c.name} className="flex items-center gap-2 text-sm">
              <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: ['#2563eb','#16a34a','#f59e0b','#dc2626','#7c3aed'][i] }} />
              <span className="text-gray-700">{c.name}</span>
              <span className="ml-auto font-medium">{c.value}%</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Popularity heatmap (CSS only) */}
      <div className="rounded-lg border border-[var(--border)] p-4">
        <h2 className="font-medium">Product popularity heatmap</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {top12.map(p => (
            <div key={p.id} className="rounded p-2 text-xs" style={{ backgroundColor: `rgba(79,70,229,${Math.max(0.1, p.popularity/100)})`, color: 'white' }} title={`${p.name} • ${p.popularity}`}>
              <div className="line-clamp-2">{p.name}</div>
              <div className="mt-1 font-semibold">{p.popularity}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular products */}
  <div className="rounded-lg border border-[var(--border)] p-4">
        <h2 className="font-medium">Popular products</h2>
        <ul className="mt-3 divide-y">
          {popular.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <img src={p.thumbnail} alt={p.name} className="h-12 w-12 rounded object-cover" />
              <div className="flex-1">
                <p className="font-medium leading-tight">{p.name}</p>
                <p className="text-xs text-gray-500">{p.brand}</p>
              </div>
              <div className="text-sm font-semibold">{formatPrice(p.price)}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function KPI({ title, value, trend }: { title: string; value: string; trend: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-4">
      <p className="text-xs text-gray-600">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-emerald-700">{trend}</p>
    </div>
  )
}
