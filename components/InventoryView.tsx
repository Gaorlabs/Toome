import React, { useState } from 'react';
import { 
  Box, Search, Filter, Plus, ArrowUpRight, TrendingDown, Clock, 
  AlertTriangle, Edit, Trash, Check, CheckCircle2, CircleDollarSign, Eye, Info
} from 'lucide-react';
import { Product, UserSession } from '../types';

interface InventoryViewProps {
  products: Product[];
  session: UserSession;
  onUpdateStock: (productId: string, newStock: number, cost: number, price: number) => void;
  onAddProduct: (newProduct: Product) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  session,
  onUpdateStock,
  onAddProduct
}) => {
  const isAdmin = session.role === 'ADMIN';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Edit stock modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editStockVal, setEditStockVal] = useState(0);
  const [editCostVal, setEditCostVal] = useState(0);
  const [editPriceVal, setEditPriceVal] = useState(0);

  // Detail product modal state
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);

  // New product form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('Abarrotes');
  const [newCost, setNewCost] = useState(1.0);
  const [newPrice, setNewPrice] = useState(2.0);
  const [newStock, setNewStock] = useState(50);
  const [newMinStock, setNewMinStock] = useState(10);
  const [newUnit, setNewUnit] = useState('Unidad');

  // General KPIs from inventory
  const totalStockItems = products.reduce((sum, p) => sum + p.stock, 0);
  const totalKardexValuation = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEditClick = (p: Product) => {
    if (!isAdmin) {
      alert("Acceso denegado: Solo el Administrador puede editar el catálogo de productos.");
      return;
    }
    setEditingProduct(p);
    setEditStockVal(p.stock);
    setEditCostVal(p.cost);
    setEditPriceVal(p.salePrice);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateStock(editingProduct.id, Number(editStockVal), Number(editCostVal), Number(editPriceVal));
      setEditingProduct(null);
    }
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newName.trim()) {
      alert("Por favor rellene el SKU y Nombre del producto.");
      return;
    }

    const prodObj: Product = {
      id: `P${Math.floor(100 + Math.random() * 900)}`,
      sku: newSku,
      name: newName,
      category: newCat,
      cost: Number(newCost),
      salePrice: Number(newPrice),
      stock: Number(newStock),
      minStock: Number(newMinStock),
      unit: newUnit
    };

    onAddProduct(prodObj);

    // reset forms
    setNewSku('');
    setNewName('');
    setNewCost(1.0);
    setNewPrice(2.0);
    setNewStock(50);
    setNewMinStock(10);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h5 className="text-[10px] font-bold text-[#017E84] tracking-widest uppercase mb-1 flex items-center gap-1.5">
            <Box size={13} /> CONTROL DE SUCURSAL / ALMACÉN
          </h5>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Kardex Total de Inventario
          </h1>
          <p className="text-xs text-slate-400">Inspeccione el stock de mercadería disponible, valorice existencias en almacén y reabastezca unidades críticas.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#017E84] hover:bg-[#006064] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all self-start sm:self-center"
          >
            <Plus size={15} />
            <span>Agregar Producto</span>
          </button>
        )}
      </div>

      {/* Summary KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {isAdmin ? (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet flex justify-between items-center h-24 animate-fade-in">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Unidades Totales</p>
                <h3 className="text-2xl font-black text-slate-800">{totalStockItems} u.</h3>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                <Box size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet flex justify-between items-center h-24 animate-fade-in">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Capital Valorizado (Costo)</p>
                <h3 className="text-2xl font-black text-[#017E84]">S/ {totalKardexValuation.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl text-[#017E84]">
                <CircleDollarSign size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-spreadsheet flex justify-between items-center h-24 animate-fade-in">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Línea Crítica (Bajo Stock)</p>
                <h3 className="text-2xl font-black text-rose-500">{lowStockCount} ítems</h3>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-rose-500">
                <AlertTriangle size={22} className={lowStockCount > 0 ? 'animate-bounce' : ''} />
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-1 md:col-span-3 bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-spreadsheet flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
            <div className="space-y-1">
              <p className="text-[10px] text-amber-700 uppercase font-black tracking-wider flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-500 animate-pulse" /> ALERTA DE REPOSICIÓN MÓVIL
              </p>
              <h3 className="text-xl font-black text-slate-800">
                {lowStockCount} {lowStockCount === 1 ? 'Producto está' : 'Productos están'} en Línea Crítica (Bajo Stock)
              </h3>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                Revise estos artículos con poca disponibilidad en el catálogo. Sugiera sustitutos o alerte al cliente sobre próximas compras para asegurar su abastecimiento preventa.
              </p>
            </div>
            <div className="p-3 bg-white border border-amber-200 shadow-sm rounded-2xl text-amber-600 shrink-0 self-stretch md:self-auto flex items-center justify-center gap-2">
              <span className="text-lg font-black text-amber-700">{lowStockCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Bajo Mínimo</span>
            </div>
          </div>
        )}

      </div>

      {/* Search and Category Filtering bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-spreadsheet flex flex-col md:flex-row justify-between gap-4">
        
        {/* Search Input field */}
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por SKU or descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl focus:outline-none focus:bg-white block w-full pl-10 p-2.5 font-medium"
          />
        </div>

        {/* Quick category filter selector */}
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Categoría:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold px-3 py-2 outline-none text-slate-700 cursor-pointer"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="Abarrotes">Abarrotes</option>
            <option value="Bebidas">Bebidas</option>
            <option value="Lácteos">Lácteos</option>
            <option value="Limpieza">Limpieza</option>
            <option value="Farmacia">Farmacia</option>
          </select>
        </div>

      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-spreadsheet overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">SKU Cod.</th>
                <th className="py-3 px-6">Producto</th>
                <th className="py-3 px-6">Categoría</th>
                <th className="py-3 px-6 text-center">Medida / Empaque</th>
                {isAdmin && <th className="py-3 px-6 text-right">Costo Unit.</th>}
                <th className="py-3 px-6 text-right text-teal-800">Precio x Mayor</th>
                <th className="py-3 px-6 text-right">Precio x Menor</th>
                <th className="py-3 px-6 text-center">Stock Disp.</th>
                {isAdmin && <th className="py-3 px-6 text-right">Valuación Almacén</th>}
                <th className="py-3 px-6 text-center">Alertas</th>
                <th className="py-3 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isCritical = p.stock <= p.minStock;
                const valuation = p.stock * p.cost;
                // Wholesale price calculated with a standard 10% discount
                const wholesalePrice = p.salePrice * 0.90;

                return (
                  <tr 
                    key={p.id} 
                    className="hover:bg-teal-50/20 hover:text-slate-900 transition-colors cursor-pointer"
                    onClick={() => setSelectedDetailProduct(p)}
                    title="Haga click para ver detalles del producto"
                  >
                    <td className="py-3.5 px-6 font-mono text-xs font-bold text-slate-400">{p.sku}</td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-slate-800 block text-xs group-hover:text-[#017E84]">{p.name}</span>
                    </td>
                    <td className="py-3.5 px-6 text-xxs font-bold text-slate-400">{p.category}</td>
                    <td className="py-3.5 px-6 text-center text-slate-500 font-medium text-xs">{p.unit}</td>
                    {isAdmin && <td className="py-3.5 px-6 text-right text-slate-500 font-medium text-xs font-mono">S/ {p.cost.toFixed(2)}</td>}
                    <td className="py-3.5 px-6 text-right text-teal-700 font-black text-xs font-mono">S/ {wholesalePrice.toFixed(2)}</td>
                    <td className="py-3.5 px-6 text-right text-slate-950 font-extrabold text-xs font-mono">S/ {p.salePrice.toFixed(2)}</td>
                    <td className={`py-3.5 px-6 text-center font-extrabold text-xs ${isCritical ? 'text-rose-500 bg-rose-50/20' : 'text-slate-800'}`}>
                      {p.stock}
                    </td>
                    {isAdmin && <td className="py-3.5 px-6 text-right font-black text-slate-700 text-xs font-mono">S/ {valuation.toFixed(2)}</td>}
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        isCritical 
                          ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {isCritical ? 'Falta Stock' : 'Disponible'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailProduct(p)}
                          className="p-1 px-2.5 bg-slate-50 hover:bg-[#017E84]/10 hover:text-[#017E84] text-slate-500 rounded-lg text-xxs font-bold transition-all flex items-center gap-1"
                        >
                          <Eye size={11} />
                          <span>Ver</span>
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleEditClick(p)}
                            className="p-1 px-2.5 bg-slate-100 hover:bg-[#017E84] hover:text-white text-slate-700 rounded-lg text-xxs font-bold transition-all flex items-center gap-1"
                          >
                            <Edit size={11} />
                            <span>Editar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 italic">
                    Ningún producto disponible en catálogo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL FOR PRODUCT COST / PRICE AND STOCK COUNT */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <form 
            onSubmit={handleSaveEdit}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl max-w-sm w-full space-y-4 animate-slide-up"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Editar Stock Físico</h3>
              <button 
                type="button" 
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold block">{editingProduct.sku}</span>
              <span className="text-xs font-bold text-slate-800 leading-tight block">{editingProduct.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-2 text-xs">
              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-500">Costo Unit. (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editCostVal}
                  onChange={(e) => setEditCostVal(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-500">Precio Venta (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPriceVal}
                  onChange={(e) => setEditPriceVal(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-500 uppercase block">Actualizar Stock físico actual</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editStockVal}
                  onChange={(e) => setEditStockVal(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-center font-bold text-slate-800"
                />
                <span className="text-xs font-semibold text-slate-400 shrink-0">{editingProduct.unit}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="w-1/2 py-2 border border-slate-200 text-slate-500 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 bg-[#017E84] text-white hover:bg-[#006064] font-bold rounded-xl text-xs shadow-md"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD NEW PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <form 
            onSubmit={handleAddProductSubmit}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl max-w-md w-full space-y-4 animate-slide-up"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Agregar Nuevo Producto</h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-500">Código SKU</label>
                <input
                  type="text"
                  placeholder="Ej. AL-9031"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-500">Nombre Comercial</label>
                <input
                  type="text"
                  placeholder="Ej. Harina Fina 1kg"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-500">Categoría</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl cursor-pointer"
                >
                  <option value="Abarrotes">Abarrotes</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Lácteos">Lácteos</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Farmacia">Farmacia</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-500">Medida / Unidad</label>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl cursor-pointer"
                >
                  <option value="Unidad">Unidad</option>
                  <option value="Saco">Saco</option>
                  <option value="Botella">Botella</option>
                  <option value="Paquete x6">Paquete x6</option>
                  <option value="Caja x12">Caja x12</option>
                  <option value="Plancha x24">Plancha x24</option>
                  <option value="Caja">Caja</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-500">Costo Unit. (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newCost}
                  onChange={(e) => setNewCost(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-500">Precio Venta (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-500">Stock Inicial</label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-500">Mínimo de Alerta</label>
                <input
                  type="number"
                  value={newMinStock}
                  onChange={(e) => setNewMinStock(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-1/2 py-2.5 border border-slate-200 text-slate-500 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 bg-[#017E84] text-white hover:bg-[#006064] font-bold rounded-xl text-xs shadow-md"
              >
                Añadir al Kardex
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRODUCT DETAILS MODAL (ACCESSIBLE TO SELLERS & ADMINS) */}
      {selectedDetailProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl max-w-sm w-full space-y-5 animate-slide-up relative">
            
            <button 
              type="button" 
              onClick={() => setSelectedDetailProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl leading-none transition-colors"
            >
              &times;
            </button>

            <div className="space-y-1.5">
              <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-wider">
                {selectedDetailProduct.category}
              </span>
              <h3 className="text-base font-extrabold text-slate-800 leading-tight pr-6">
                {selectedDetailProduct.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                SKU DE CATÁLOGO: <span className="font-extrabold">{selectedDetailProduct.sku}</span>
              </p>
            </div>

            {/* Price list details */}
            <div className="space-y-2">
              <span className="text-[9px] text-slate-450 uppercase font-black tracking-wider block">PRECIOS DE VENTA SUGERIDOS</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100 space-y-1">
                  <span className="text-[9px] text-teal-700 font-extrabold uppercase block tracking-wider">Por Mayor</span>
                  <span className="text-lg font-black text-teal-850 block font-mono">
                    S/ {(selectedDetailProduct.salePrice * 0.90).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-teal-600 font-medium block leading-tight">
                    (Desde un Caj./Plac.)
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider">Por Menor</span>
                  <span className="text-lg font-black text-slate-800 block font-mono">
                    S/ {selectedDetailProduct.salePrice.toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium block leading-tight">
                    (Venta unitaria)
                  </span>
                </div>
              </div>
            </div>

            {/* Physical Warehouse stock count & availability */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">STOCK DISPONIBLE</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  selectedDetailProduct.stock <= selectedDetailProduct.minStock 
                    ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {selectedDetailProduct.stock <= selectedDetailProduct.minStock ? 'Bajo Alerta' : 'Saludable'}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-black ${
                  selectedDetailProduct.stock <= selectedDetailProduct.minStock ? 'text-rose-500' : 'text-[#017E84]'
                }`}>
                  {selectedDetailProduct.stock}
                </span>
                <span className="text-xs font-bold text-slate-450 uppercase tracking-widest">{selectedDetailProduct.unit}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xxs font-semibold text-slate-500 leading-relaxed flex gap-1.5">
                <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {selectedDetailProduct.stock <= selectedDetailProduct.minStock 
                    ? 'Stock crítico regulado. No comprometa grandes despachos sin consultar disponibilidad de reabastecimiento en la central.' 
                    : 'Stock equilibrado en sucursal. Apto para entrega directa e inmediata en la ruta programada.'}
                </span>
              </div>
            </div>

            {/* Admin metrics hidden contextually for standard preventive sales reps */}
            {isAdmin && (
              <div className="bg-[#017E84]/5 p-3.5 rounded-xl border border-teal-100/40 space-y-2">
                <span className="text-[9px] text-[#017E84] font-black uppercase tracking-wider block">INFORMACIÓN INTERNA (ADMINISTRADOR)</span>
                <div className="grid grid-cols-2 gap-3 text-xxs">
                  <div>
                    <span className="text-slate-450 block font-bold">Costo Unitario:</span>
                    <strong className="text-slate-700 font-mono text-xs">S/ {selectedDetailProduct.cost.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-450 block font-bold">Valuación Almacén:</span>
                    <strong className="text-slate-700 font-mono text-xs">S/ {(selectedDetailProduct.stock * selectedDetailProduct.cost).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setSelectedDetailProduct(null)}
                className="w-full py-2.5 bg-[#017E84] text-white hover:bg-[#006064] rounded-xl text-xs font-extrabold transition-all uppercase tracking-wider shadow-md"
              >
                Volver al Listado
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
