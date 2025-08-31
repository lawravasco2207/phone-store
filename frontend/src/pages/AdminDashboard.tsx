import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'
import { api, type Product } from '../utils/api'
import { formatPrice } from '../utils/format'
import { useToast } from '../components/AlertToast'

// Simple mock data generation for charts; in real app, fetch from backend/analytics
const mockSales = [3200, 4800, 2600, 5400, 6100, 7000, 8400, 7900, 9200, 8800, 9600, 11000]
const mockCategories = [
  { name: 'Smartphones', value: 38 },
  { name: 'Tablets', value: 26 },
  { name: 'Accessories', value: 14 },
  { name: 'Laptops', value: 12 },
  { name: 'Audio', value: 10 },
]

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const { show } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'ingestion' | 'sellers'>('dashboard')
  const [ingestionJobs, setIngestionJobs] = useState<any[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvUploadProgress, setCsvUploadProgress] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [csvUploadError, setCsvUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const response = await api.getProducts({ limit: 10 })
        if (response.success && response.data) {
          setProducts(response.data.products || [])
        } else {
          setProducts([])
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [isAdmin])
  
  // Fetch ingestion jobs
  useEffect(() => {
    if (!isAdmin || activeTab !== 'ingestion') return
    
    const fetchJobs = async () => {
      setLoadingJobs(true)
      try {
        const response = await fetch('/api/admin/ingestion-jobs', {
          credentials: 'include'
        })
        const data = await response.json()
        
        if (data.success && data.data?.jobs) {
          setIngestionJobs(data.data.jobs)
        }
      } catch (error) {
        console.error('Failed to fetch ingestion jobs:', error)
      } finally {
        setLoadingJobs(false)
      }
    }
    
    fetchJobs()
  }, [isAdmin, activeTab])
  
  // Handle CSV file selection
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0])
    }
  }
  
  // Handle CSV upload
  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!csvFile) {
      setCsvUploadError('Please select a CSV file')
      return
    }
    
    setCsvUploadProgress('uploading')
    setCsvUploadError(null)
    
    try {
      const formData = new FormData()
      formData.append('csv', csvFile)
      formData.append('hasHeader', 'true')
      
      const response = await fetch('/api/admin/products/csv-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCsvUploadProgress('success')
        show({ variant: 'success', message: 'CSV uploaded successfully!' })
        
        // Add the new job to the list
        setIngestionJobs(prev => [data.data, ...prev])
        
        // Switch to ingestion tab to show progress
        setActiveTab('ingestion')
      } else {
        setCsvUploadProgress('error')
        setCsvUploadError(data.error || 'Upload failed')
        show({ variant: 'error', message: data.error || 'Upload failed' })
      }
    } catch (err) {
      setCsvUploadProgress('error')
      setCsvUploadError('Error uploading file')
      show({ variant: 'error', message: 'Error uploading file' })
    }
  }

  if (!user) {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-center py-12 text-gray-600">Please sign in to access the admin dashboard.</p>
      </section>
    )
  }

  if (!isAdmin) {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-center py-12 text-gray-600">Access denied. Admin privileges required.</p>
      </section>
    )
  }

  const totalRevenue = mockSales.reduce((a, b) => a + b, 0)

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Manage products and view analytics.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateProduct(true)}
            className="btn-primary"
          >
            Add Product
          </button>
          <button
            onClick={() => setActiveTab('ingestion')}
            className="btn-outline"
          >
            Import Products
          </button>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'dashboard' ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'products' ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'ingestion' ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('ingestion')}
        >
          Ingestion Jobs
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPI title="Monthly revenue (mock)" value={formatPrice(mockSales.at(-1)!)} trend="↑ 7% WoW" />
            <KPI title="Total revenue YTD" value={formatPrice(totalRevenue)} trend="↑ 19% YoY" />
            <KPI title="Orders" value={String(2743)} trend="↑ 3% WoW" />
            <KPI title="Products" value={String(products?.length || 0)} trend="→ Stable" />
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

          {/* Products Management */}
          <div className="rounded-lg border border-[var(--border)] p-4">
            <h2 className="font-medium">Recent Products</h2>
            {loading ? (
              <p className="mt-3 text-gray-600">Loading products...</p>
            ) : products && products.length > 0 ? (
              <div className="mt-3 space-y-3">
                {products.map((product) => (
                  <ProductRow key={product.id} product={product} onUpdate={() => {
                    // Refresh products after update
                    api.getProducts({ limit: 10 }).then(response => {
                      if (response.success && response.data) {
                        setProducts(response.data.products || [])
                      }
                    })
                  }} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-gray-600">No products found.</p>
            )}
          </div>
        </>
      )}
      
      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="rounded-lg border border-[var(--border)] p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">All Products</h2>
            <button
              onClick={() => setShowCreateProduct(true)}
              className="btn-primary text-sm"
            >
              Add Product
            </button>
          </div>
          
          {loading ? (
            <p className="mt-3 text-gray-600">Loading products...</p>
          ) : products && products.length > 0 ? (
            <div className="mt-3 space-y-3">
              {products.map((product) => (
                <ProductRow key={product.id} product={product} onUpdate={() => {
                  // Refresh products after update
                  api.getProducts({ limit: 10 }).then(response => {
                    if (response.success && response.data) {
                      setProducts(response.data.products || [])
                    }
                  })
                }} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-gray-600">No products found.</p>
          )}
        </div>
      )}
      
      {/* Ingestion Jobs Tab */}
      {activeTab === 'ingestion' && (
        <>
          {/* CSV Upload Form */}
          <div className="rounded-lg border border-[var(--border)] p-4 mb-4">
            <h2 className="font-medium mb-4">Import Products via CSV</h2>
            
            <form onSubmit={handleCsvUpload} className="mb-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[var(--brand-primary-50)] file:text-[var(--brand-primary)]
                    hover:file:bg-[var(--brand-primary-100)]"
                />
                <p className="mt-1 text-sm text-gray-500">
                  File should have headers and include product name, price, description, etc.
                </p>
              </div>
              
              {csvUploadError && (
                <div className="mb-4 text-sm text-red-600">
                  Error: {csvUploadError}
                </div>
              )}
              
              <button
                type="submit"
                disabled={!csvFile || csvUploadProgress === 'uploading'}
                className="btn-primary disabled:opacity-50"
              >
                {csvUploadProgress === 'uploading' ? 'Uploading...' : 'Upload and Process'}
              </button>
              
              {csvUploadProgress === 'success' && (
                <p className="mt-2 text-sm text-green-600">
                  Upload successful! Processing has started.
                </p>
              )}
            </form>
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">CSV Format Guidelines:</h4>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>First row should contain column headers</li>
                <li>Required columns: name, price</li>
                <li>Optional columns: description, category, brand, sku, barcode, image_url</li>
                <li>For variants: include variant_sku, variant_price, option1_name, option1_value</li>
                <li>For inventory: include quantity, safety_stock</li>
              </ul>
            </div>
          </div>
          
          {/* Ingestion Jobs List */}
          <div className="rounded-lg border border-[var(--border)] p-4">
            <h2 className="font-medium mb-4">Recent Ingestion Jobs</h2>
            
            {loadingJobs ? (
              <p className="text-gray-600">Loading jobs...</p>
            ) : ingestionJobs.length === 0 ? (
              <p className="text-gray-600">No ingestion jobs found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ingestionJobs.map((job) => (
                      <tr key={job.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{job.id}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          <span className="capitalize">{job.type}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            job.status === 'done' ? 'bg-green-100 text-green-800' :
                            job.status === 'failed' ? 'bg-red-100 text-red-800' :
                            job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {job.stats ? (
                            <div>
                              <span className="text-green-600">{job.stats.created || 0} created</span>,{' '}
                              <span className="text-blue-600">{job.stats.updated || 0} updated</span>,{' '}
                              <span className="text-red-600">{job.stats.failed || 0} failed</span>
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Product Modal */}
      {showCreateProduct && (
        <CreateProductModal
          onClose={() => setShowCreateProduct(false)}
          onSuccess={() => {
            setShowCreateProduct(false)
            // Refresh products
            api.getProducts({ limit: 10 }).then(response => {
              if (response.success && response.data) {
                setProducts(response.data.products || [])
              }
            })
          }}
        />
      )}
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

function ProductRow({ product, onUpdate }: { product: Product; onUpdate: () => void }) {
  const { show } = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(product?.name || '')
  const [price, setPrice] = useState((product?.price || 0).toString())
  const [category, setCategory] = useState(product?.category || '')
  const [description, setDescription] = useState(product?.description || '')
  const [updating, setUpdating] = useState(false)

  const handleUpdate = async () => {
    if (!product?.id) {
      show({ variant: 'error', message: 'Product ID is missing' })
      return
    }
    
    setUpdating(true)
    try {
      const response = await api.updateProduct(product.id, {
        name,
        price: parseFloat(price),
        category,
        description,
      })
      
      if (response.success) {
        show({ variant: 'success', message: 'Product updated successfully' })
        setEditing(false)
        onUpdate()
      } else {
        show({ variant: 'error', message: response.error || 'Failed to update product' })
      }
    } catch (error) {
      show({ variant: 'error', message: 'Failed to update product' })
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return
    if (!product?.id) {
      show({ variant: 'error', message: 'Product ID is missing' })
      return
    }
    
    try {
      const response = await api.deleteProduct(product.id)
      if (response.success) {
        show({ variant: 'success', message: 'Product deleted successfully' })
        onUpdate()
      } else {
        show({ variant: 'error', message: response.error || 'Failed to delete product' })
      }
    } catch (error) {
      show({ variant: 'error', message: 'Failed to delete product' })
    }
  }

  if (editing) {
    return (
      <div className="border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input mt-1 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input mt-1 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input mt-1 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input mt-1 w-full"
              rows={2}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="btn-primary disabled:opacity-50"
          >
            {updating ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="btn-outline"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b">
      <div className="flex-1">
        <p className="font-medium leading-tight">{product?.name || 'Unnamed Product'}</p>
        <p className="text-sm text-gray-500">{product?.category || 'Uncategorized'}</p>
        <p className="text-sm font-semibold">{formatPrice(product?.price || 0)}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function CreateProductModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState('')
  const [creating, setCreating] = useState(false)
  const { show } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const imageUrls = images.split('\n').map(url => url.trim()).filter(Boolean)
      const response = await api.createProduct({
        name,
        price: parseFloat(price),
        category,
        description,
        images: imageUrls.length > 0 ? imageUrls : undefined,
      })

      if (response.success) {
        show({ variant: 'success', message: 'Product created successfully' })
        onSuccess()
      } else {
        show({ variant: 'error', message: response.error || 'Failed to create product' })
      }
    } catch (error) {
      show({ variant: 'error', message: 'Failed to create product' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 mx-2 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create Product</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input mt-1 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="input mt-1 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="input mt-1 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input mt-1 w-full"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Images (one URL per line)</label>
            <textarea
              value={images}
              onChange={(e) => setImages(e.target.value)}
              placeholder="https://example.com/image1.jpg"
              className="input mt-1 w-full"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
