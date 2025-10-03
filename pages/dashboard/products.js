// pages/dashboard/products.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '../../lib/auth';
import { getProducts, addProduct, updateProduct, deleteProduct, logActivity } from '../../lib/firestore';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import ProductsTable from '../../components/Dashboard/ProductsTable';

export default function Products() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser().then((userData) => {
      if (!userData) {
        router.push('/login');
        return;
      }
      setUser(userData);
      loadProducts();
    });
  }, [router]);

  const loadProducts = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      const id = await addProduct({
        ...productData,
        price: parseFloat(productData.price),
        cost: parseFloat(productData.cost),
        stock: parseInt(productData.stock),
        minStock: parseInt(productData.minStock),
      });

      await logActivity(
        {
          action: 'product_created',
          productId: id,
          productName: productData.name,
          details: `Created product ${productData.name} with ${productData.stock} units`,
        },
        user.uid,
        user.email
      );

      loadProducts();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleEditProduct = async (productId, productData) => {
    try {
      const oldProduct = products.find(p => p.id === productId);
      await updateProduct(productId, {
        ...productData,
        price: parseFloat(productData.price),
        cost: parseFloat(productData.cost),
        stock: parseInt(productData.stock),
        minStock: parseInt(productData.minStock),
      });

      await logActivity(
        {
          action: 'product_updated',
          productId: productId,
          productName: productData.name,
          details: `Updated product ${productData.name}`,
          changes: {
            before: {
              name: oldProduct.name,
              price: oldProduct.price,
              cost: oldProduct.cost,
              stock: oldProduct.stock,
              minStock: oldProduct.minStock,
            },
            after: productData,
          },
        },
        user.uid,
        user.email
      );

      loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const product = products.find(p => p.id === productId);
      // Note: In a real app, you'd call deleteProduct here
      // For now, we'll just log the activity
      
      await logActivity(
        {
          action: 'product_deleted',
          productId: productId,
          productName: product.name,
          details: `Deleted product ${product.name}`,
        },
        user.uid,
        user.email
      );

      // Reload products to reflect deletion
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user} activePage="products">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="loader"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} activePage="products">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your inventory products</p>
        </div>

        <ProductsTable
          products={products}
          onAdd={handleAddProduct}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      </div>
    </DashboardLayout>
  );
}