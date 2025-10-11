import { useState } from 'react';
import Button from '../UI/Button';
import Modal from '../UI/Modal';

// iPhone presets from iPhone X to iPhone 17
const IPHONE_PRESETS = [
  // iPhone X Series
  {
    name: "iPhone X",
    category: "Smartphone",
    specs: "5.8\" Super Retina HD, A11 Bionic, Dual 12MP cameras",
    colors: ["Space Gray", "Silver"]
  },
  {
    name: "iPhone XR",
    category: "Smartphone", 
    specs: "6.1\" Liquid Retina HD, A12 Bionic, Single 12MP camera",
    colors: ["Black", "White", "Blue", "Yellow", "Coral", "Red"]
  },
  {
    name: "iPhone XS",
    category: "Smartphone",
    specs: "5.8\" Super Retina HD, A12 Bionic, Dual 12MP cameras",
    colors: ["Space Gray", "Silver", "Gold"]
  },
  {
    name: "iPhone XS Max",
    category: "Smartphone",
    specs: "6.5\" Super Retina HD, A12 Bionic, Dual 12MP cameras", 
    colors: ["Space Gray", "Silver", "Gold"]
  },

  // iPhone 11 Series
  {
    name: "iPhone 11",
    category: "Smartphone",
    specs: "6.1\" Liquid Retina HD, A13 Bionic, Dual 12MP cameras",
    colors: ["Black", "Green", "Yellow", "Purple", "Red", "White"]
  },
  {
    name: "iPhone 11 Pro",
    category: "Smartphone",
    specs: "5.8\" Super Retina XDR, A13 Bionic, Triple 12MP cameras",
    colors: ["Space Gray", "Silver", "Gold", "Midnight Green"]
  },
  {
    name: "iPhone 11 Pro Max", 
    category: "Smartphone",
    specs: "6.5\" Super Retina XDR, A13 Bionic, Triple 12MP cameras",
    colors: ["Space Gray", "Silver", "Gold", "Midnight Green"]
  },

  // iPhone 12 Series
  {
    name: "iPhone 12 mini",
    category: "Smartphone",
    specs: "5.4\" Super Retina XDR, A14 Bionic, Dual 12MP cameras",
    colors: ["Black", "White", "Red", "Green", "Blue", "Purple"]
  },
  {
    name: "iPhone 12",
    category: "Smartphone",
    specs: "6.1\" Super Retina XDR, A14 Bionic, Dual 12MP cameras", 
    colors: ["Black", "White", "Red", "Green", "Blue", "Purple"]
  },
  {
    name: "iPhone 12 Pro",
    category: "Smartphone",
    specs: "6.1\" Super Retina XDR, A14 Bionic, Triple 12MP cameras + LiDAR",
    colors: ["Graphite", "Silver", "Gold", "Pacific Blue"]
  },
  {
    name: "iPhone 12 Pro Max",
    category: "Smartphone", 
    specs: "6.7\" Super Retina XDR, A14 Bionic, Triple 12MP cameras + LiDAR",
    colors: ["Graphite", "Silver", "Gold", "Pacific Blue"]
  },

  // iPhone 13 Series
  {
    name: "iPhone 13 mini",
    category: "Smartphone",
    specs: "5.4\" Super Retina XDR, A15 Bionic, Dual 12MP cameras",
    colors: ["Pink", "Blue", "Midnight", "Starlight", "Red", "Green"]
  },
  {
    name: "iPhone 13",
    category: "Smartphone",
    specs: "6.1\" Super Retina XDR, A15 Bionic, Dual 12MP cameras",
    colors: ["Pink", "Blue", "Midnight", "Starlight", "Red", "Green"] 
  },
  {
    name: "iPhone 13 Pro",
    category: "Smartphone",
    specs: "6.1\" Super Retina XDR, A15 Bionic, Triple 12MP cameras + LiDAR",
    colors: ["Graphite", "Gold", "Silver", "Sierra Blue", "Alpine Green"]
  },
  {
    name: "iPhone 13 Pro Max",
    category: "Smartphone",
    specs: "6.7\" Super Retina XDR, A15 Bionic, Triple 12MP cameras + LiDAR", 
    colors: ["Graphite", "Gold", "Silver", "Sierra Blue", "Alpine Green"]
  },

  // iPhone 14 Series
  {
    name: "iPhone 14",
    category: "Smartphone",
    specs: "6.1\" Super Retina XDR, A15 Bionic, Dual 12MP cameras",
    colors: ["Blue", "Purple", "Midnight", "Starlight", "Red", "Yellow"]
  },
  {
    name: "iPhone 14 Plus",
    category: "Smartphone",
    specs: "6.7\" Super Retina XDR, A15 Bionic, Dual 12MP cameras",
    colors: ["Blue", "Purple", "Midnight", "Starlight", "Red", "Yellow"]
  },
  {
    name: "iPhone 14 Pro",
    category: "Smartphone", 
    specs: "6.1\" Super Retina XDR, A16 Bionic, Triple 48MP cameras + LiDAR",
    colors: ["Space Black", "Silver", "Gold", "Deep Purple"]
  },
  {
    name: "iPhone 14 Pro Max",
    category: "Smartphone",
    specs: "6.7\" Super Retina XDR, A16 Bionic, Triple 48MP cameras + LiDAR",
    colors: ["Space Black", "Silver", "Gold", "Deep Purple"]
  },

  // iPhone 15 Series
  {
    name: "iPhone 15",
    category: "Smartphone",
    specs: "6.1\" Super Retina XDR, A16 Bionic, Dual 48MP cameras, USB-C",
    colors: ["Pink", "Yellow", "Green", "Blue", "Black"]
  },
  {
    name: "iPhone 15 Plus",
    category: "Smartphone", 
    specs: "6.7\" Super Retina XDR, A16 Bionic, Dual 48MP cameras, USB-C",
    colors: ["Pink", "Yellow", "Green", "Blue", "Black"]
  },
  {
    name: "iPhone 15 Pro",
    category: "Smartphone",
    specs: "6.1\" Super Retina XDR, A17 Pro, Triple 48MP cameras, Titanium, Action Button",
    colors: ["Black Titanium", "White Titanium", "Blue Titanium", "Natural Titanium"]
  },
  {
    name: "iPhone 15 Pro Max",
    category: "Smartphone",
    specs: "6.7\" Super Retina XDR, A17 Pro, Triple 48MP cameras, Titanium, Action Button", 
    colors: ["Black Titanium", "White Titanium", "Blue Titanium", "Natural Titanium"]
  },

  // iPhone 16 Series (Projected)
  {
    name: "iPhone 16",
    category: "Smartphone",
    specs: "6.1\" Super Retina XDR, A18 Bionic, Dual 48MP cameras, USB-C",
    colors: ["Red", "Blue", "Green", "Yellow", "Pink", "Black", "White"]
  },
  {
    name: "iPhone 16 Plus",
    category: "Smartphone",
    specs: "6.7\" Super Retina XDR, A18 Bionic, Dual 48MP cameras, USB-C",
    colors: ["Red", "Blue", "Green", "Yellow", "Pink", "Black", "White"]
  },
  {
    name: "iPhone 16 Pro",
    category: "Smartphone", 
    specs: "6.3\" Super Retina XDR, A18 Pro, Triple 48MP cameras, Titanium, Capture Button",
    colors: ["Space Black", "Silver", "Gold", "Deep Purple"]
  },
  {
    name: "iPhone 16 Pro Max",
    category: "Smartphone",
    specs: "6.9\" Super Retina XDR, A18 Pro, Triple 48MP cameras, Titanium, Capture Button",
    colors: ["Space Black", "Silver", "Gold", "Deep Purple"]
  },

  // iPhone 17 Series (Projected)
  {
    name: "iPhone 17",
    category: "Smartphone",
    specs: "6.1\" Super Retina XDR, A19 Bionic, Advanced AI features, USB-C",
    colors: ["Cosmic Black", "Stellar White", "Nebula Blue", "Solar Red"]
  },
  {
    name: "iPhone 17 Plus",
    category: "Smartphone",
    specs: "6.7\" Super Retina XDR, A19 Bionic, Advanced AI features, USB-C", 
    colors: ["Cosmic Black", "Stellar White", "Nebula Blue", "Solar Red"]
  },
  {
    name: "iPhone 17 Pro",
    category: "Smartphone",
    specs: "6.3\" Super Retina XDR, A19 Pro, Advanced computational photography, Titanium",
    colors: ["Titanium Black", "Titanium White", "Titanium Gold", "Titanium Blue"]
  },
  {
    name: "iPhone 17 Pro Max",
    category: "Smartphone",
    specs: "6.9\" Super Retina XDR, A19 Pro, Advanced computational photography, Titanium",
    colors: ["Titanium Black", "Titanium White", "Titanium Gold", "Titanium Blue"]
  }
];

export default function ProductsTable({ products, onAdd, onEdit, onDelete }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    price: '',
    cost: '',
    stock: '',
    category: 'Smartphone',
    minStock: '5',
    specs: '',
    color: ''
  });

  // Get available colors for selected preset
  const availableColors = selectedPreset 
    ? IPHONE_PRESETS.find(iphone => iphone.name === selectedPreset)?.colors || []
    : [];

  // Handle preset selection
  const handlePresetSelect = (presetName) => {
    const preset = IPHONE_PRESETS.find(iphone => iphone.name === presetName);
    if (preset) {
      setNewProduct({
        ...newProduct,
        name: preset.name,
        category: preset.category,
        specs: preset.specs
      });
      setSelectedPreset(presetName);
      setSelectedColor('');
    }
  };

  // Handle color selection
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setNewProduct({
      ...newProduct,
      color: color,
      sku: `${selectedPreset.replace(/\s+/g, '')}_${color.replace(/\s+/g, '')}`.toUpperCase()
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await onAdd(newProduct);
      setShowAddModal(false);
      setNewProduct({
        name: '',
        sku: '',
        price: '',
        cost: '',
        stock: '',
        category: 'Smartphone',
        minStock: '5',
        specs: '',
        color: ''
      });
      setSelectedPreset('');
      setSelectedColor('');
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await onEdit(editingProduct.id, editingProduct);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await onDelete(deleteProduct.id);
      setDeleteProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const getStockStatus = (stock, minStock = 10) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (stock <= minStock) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-50' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-50' };
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Product List</h2>
          <Button onClick={() => setShowAddModal(true)}>
            + Add Product
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => {
                const stockStatus = getStockStatus(product.stock, product.minStock);
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.category}</div>
                      {product.color && (
                        <div className="text-xs text-gray-400">Color: {product.color}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ₦{product.price?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.stock}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingProduct({...product})}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteProduct(product)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedPreset('');
          setSelectedColor('');
          setNewProduct({
            name: '',
            sku: '',
            price: '',
            cost: '',
            stock: '',
            category: 'Smartphone',
            minStock: '5',
            specs: '',
            color: ''
          });
        }}
        title="Add New Product"
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-6">
          {/* iPhone Preset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select iPhone Model
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an iPhone model...</option>
              {IPHONE_PRESETS.map((iphone, index) => (
                <option key={index} value={iphone.name}>
                  {iphone.name}
                </option>
              ))}
            </select>
            {selectedPreset && (
              <p className="text-sm text-gray-600 mt-2">
                {IPHONE_PRESETS.find(iphone => iphone.name === selectedPreset)?.specs}
              </p>
            )}
          </div>

          {/* Color Selection */}
          {availableColors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Color
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableColors.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                      selectedColor === color
                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., iPhone 15 Pro Max"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                required
                value={newProduct.sku}
                onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., IP15PM_BLUE"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₦) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost (₦) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={newProduct.cost}
                onChange={(e) => setNewProduct({...newProduct, cost: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock *
              </label>
              <input
                type="number"
                required
                value={newProduct.stock}
                onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Stock Level
              </label>
              <input
                type="number"
                value={newProduct.minStock}
                onChange={(e) => setNewProduct({...newProduct, minStock: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specifications
            </label>
            <textarea
              value={newProduct.specs}
              onChange={(e) => setNewProduct({...newProduct, specs: e.target.value})}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Product specifications and features..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="text"
              value={newProduct.color}
              onChange={(e) => setNewProduct({...newProduct, color: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Product color"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                setSelectedPreset('');
                setSelectedColor('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Edit Product"
        size="lg"
      >
        {editingProduct && (
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.sku}
                  onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingProduct.cost}
                  onChange={(e) => setEditingProduct({...editingProduct, cost: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  required
                  value={editingProduct.stock}
                  onChange={(e) => setEditingProduct({...editingProduct, stock: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editingProduct.category || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Stock Level
                </label>
                <input
                  type="number"
                  value={editingProduct.minStock || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, minStock: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specifications
              </label>
              <textarea
                value={editingProduct.specs || ''}
                onChange={(e) => setEditingProduct({...editingProduct, specs: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Product specifications and features..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="text"
                value={editingProduct.color || ''}
                onChange={(e) => setEditingProduct({...editingProduct, color: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Product color"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingProduct(null)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Update Product
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        title="Delete Product"
      >
        {deleteProduct && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete <strong>"{deleteProduct.name}"</strong>? 
              This action cannot be undone.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-700 text-sm">
                ⚠️ This will permanently remove the product from your inventory.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setDeleteProduct(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
              >
                Delete Product
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}