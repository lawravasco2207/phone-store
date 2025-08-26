import { Catalog } from '../utils/mockData'
import { useCart } from '../components/CartContext'
import { formatPrice } from '../utils/format'
import { Link } from 'react-router-dom'

export default function CartPage() {
  const { items, setQty, remove, clear } = useCart()
  const rows = items.map((i) => ({ item: i, product: Catalog.PRODUCTS.find(p => p.id === i.id)! })).filter(r => r.product)
  const subtotal = rows.reduce((sum, r) => sum + r.item.qty * r.product.price, 0)

  if (rows.length === 0) {
    return (
      <section className="text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
  <p className="mt-2 text-gray-600">Browse our catalog and add some products to your cart.</p>
  <Link to="/products" className="mt-6 inline-block btn-primary">Shop products</Link>
      </section>
    )
  }

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Make table horizontally scrollable on mobile to avoid cramped columns */}
    <div className="lg:col-span-2 overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="min-w-full text-sm">
      <thead className="bg-[var(--brand-primary-50)]/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Item</th>
              <th className="px-4 py-3 text-left font-semibold">Price</th>
              <th className="px-4 py-3 text-left font-semibold">Qty</th>
              <th className="px-4 py-3 text-left font-semibold">Total</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ item, product }) => (
              <tr key={product.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={product.thumbnail} alt={product.name} className="h-12 w-12 rounded object-cover" />
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{formatPrice(product.price)}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={item.qty}
                    onChange={(e) => setQty(product.id, Number(e.target.value))}
          className="w-20 input px-2 py-1"
                  />
                </td>
                <td className="px-4 py-3 font-semibold">{formatPrice(product.price * item.qty)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => remove(product.id)}
          className="btn-outline px-3 py-1.5"
                  >Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <aside className="space-y-4">
    <div className="rounded-lg border border-[var(--border)] p-4">
          <h2 className="font-medium">Summary</h2>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-semibold">{formatPrice(subtotal)}</span>
          </div>
          <div className="mt-4 flex gap-2">
      <Link to="/checkout" className="flex-1 btn-primary text-center">Checkout</Link>
      <button onClick={clear} className="btn-outline">Clear</button>
          </div>
        </div>
      </aside>
    </section>
  )
}
