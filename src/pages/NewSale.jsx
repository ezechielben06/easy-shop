import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSales } from "../hooks/useSales";
import { useProducts } from "../hooks/useProducts";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Package,
  Loader2,
  ShoppingBag,
  X,
  Minus,
  Check,
  CreditCard,
  Wallet,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

const NewSale = () => {
  const navigate = useNavigate();
  const { createSale } = useSales();
  const { products, loading: productsLoading, fetchProducts } = useProducts();

  const [saleItems, setSaleItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isCredit, setIsCredit] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.category &&
        p.category.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const addItem = (product) => {
    const existingItem = saleItems.find(
      (item) => item.productId === product.id,
    );

    if (existingItem) {
      if (existingItem.quantity + 1 > product.quantity) {
        toast.error("Stock insuffisant");
        return;
      }
      setSaleItems(
        saleItems.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.unitPrice,
              }
            : item,
        ),
      );
    } else {
      if (product.quantity <= 0) {
        toast.error("Produit en rupture de stock");
        return;
      }
      setSaleItems([
        ...saleItems,
        {
          productId: product.id,
          name: product.name,
          image_url: product.image_url,
          quantity: 1,
          unitPrice: product.price,
          totalPrice: product.price,
          availableStock: product.quantity,
          category: product.category,
        },
      ]);
    }
    setSearchTerm("");
    setShowSearchResults(false);
    inputRef.current?.focus();
    toast.success(`${product.name} ajouté`, { duration: 1500 });
  };

  const removeItem = (productId) => {
    setSaleItems(saleItems.filter((item) => item.productId !== productId));
  };

  const updateItemQuantity = (productId, newQuantity) => {
    const item = saleItems.find((i) => i.productId === productId);
    if (newQuantity > item.availableStock) {
      toast.error("Stock insuffisant");
      return;
    }
    if (newQuantity < 1) {
      removeItem(productId);
      return;
    }
    setSaleItems(
      saleItems.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice,
            }
          : item,
      ),
    );
  };

  const calculateTotal = () => {
    return saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSubmit = async () => {
    if (saleItems.length === 0) {
      toast.error("Ajoutez au moins un produit");
      return;
    }

    if (isCredit && !dueDate) {
      toast.error("Veuillez sélectionner une date d'échéance");
      return;
    }

    const total = calculateTotal();

    const saleData = {
      items: saleItems,
      totalAmount: total,
      grandTotal: total,
      isCredit: isCredit,
      dueDate: isCredit ? dueDate : null,
    };

    setLoading(true);
    const result = await createSale(saleData);
    setLoading(false);

    if (result) {
      navigate("/sales");
    }
  };

  const clearCart = () => {
    if (saleItems.length === 0) return;
    if (window.confirm("Vider le panier ?")) {
      setSaleItems([]);
    }
  };

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-28">
      {/* Header compact */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/sales")}
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white">
                Nouvelle vente
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {saleItems.length} article{saleItems.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {saleItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:text-red-600 font-medium px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Vider
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-3 max-w-2xl mx-auto">
        {/* Type de vente - compact */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 mb-3 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-1">
              Paiement :
            </span>
            <button
              onClick={() => setIsCredit(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !isCredit
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Wallet className="h-3.5 w-3.5" />
              Espèces
            </button>
            <button
              onClick={() => setIsCredit(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isCredit
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Crédit
            </button>
          </div>
          {isCredit && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Calendar className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input text-sm py-1.5 px-2 w-full"
                min={new Date().toISOString().split("T")[0]}
                placeholder="Échéance"
              />
            </div>
          )}
        </div>

        {/* Recherche */}
        <div ref={searchRef} className="relative z-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-3">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full py-3 px-2 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setShowSearchResults(false);
                    inputRef.current?.focus();
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Résultats de recherche */}
            {showSearchResults && searchTerm && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-60 overflow-y-auto"
                style={{ zIndex: 9999 }}
              >
                {productsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-6">
                    <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Aucun produit trouvé
                    </p>
                  </div>
                ) : (
                  <div>
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                          product.quantity <= 0
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() => product.quantity > 0 && addItem(product)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                {product.price.toLocaleString()} FCFA
                              </span>
                              <span className="text-gray-300 dark:text-gray-600">
                                |
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                Stock: {product.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          className={`text-xs py-1 px-2.5 rounded-lg font-medium transition-all flex-shrink-0 ml-2 ${
                            product.quantity <= 0
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
                          }`}
                          disabled={product.quantity <= 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            product.quantity > 0 && addItem(product);
                          }}
                        >
                          {product.quantity <= 0 ? "Rupture" : "Ajouter"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats rapides - compact */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-200 dark:border-gray-700 text-center shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Articles</p>
            <p className="text-base font-bold text-gray-900 dark:text-white">
              {saleItems.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-200 dark:border-gray-700 text-center shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-base font-bold text-blue-600 dark:text-blue-400">
              {total.toLocaleString()} FCFA
            </p>
          </div>
          <div
            className={`bg-white dark:bg-gray-800 rounded-xl p-2.5 border text-center shadow-sm ${
              isCredit
                ? "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Type</p>
            <p
              className={`text-xs font-bold ${
                isCredit ? "text-orange-500" : "text-emerald-500"
              }`}
            >
              {isCredit ? "📝 Crédit" : "💵 Espèces"}
            </p>
          </div>
        </div>

        {/* Panier - compact */}
        <div className="mt-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* En-tête panier */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Panier
                </h3>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  {saleItems.length}
                </span>
              </div>
              {saleItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Total:{" "}
                    <strong className="text-blue-600 dark:text-blue-400">
                      {total.toLocaleString()} FCFA
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {saleItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Panier vide</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Recherchez et ajoutez des produits
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-60 overflow-y-auto">
                  {saleItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {/* Image */}
                      <div className="flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Nom */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.unitPrice.toLocaleString()} FCFA
                        </p>
                      </div>

                      {/* Quantité + prix */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <button
                            onClick={() =>
                              updateItemQuantity(
                                item.productId,
                                item.quantity - 1,
                              )
                            }
                            className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-gray-600 rounded-l-lg transition-colors text-gray-600 dark:text-gray-300 text-base font-bold"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-bold text-xs text-gray-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateItemQuantity(
                                item.productId,
                                item.quantity + 1,
                              )
                            }
                            className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-gray-600 rounded-r-lg transition-colors text-gray-600 dark:text-gray-300 text-base font-bold"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-bold text-blue-600 dark:text-blue-400 text-xs min-w-[65px] text-right">
                          {item.totalPrice.toLocaleString()} FCFA
                        </span>

                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {total.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Barre de validation - fixe en bas */}
      <div className="fixed bottom-16 left-0 right-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="px-4 py-2.5 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {total.toLocaleString()} FCFA
              </p>
              {isCredit && (
                <p className="text-[10px] text-orange-500 truncate">
                  📝 Échéance:{" "}
                  {dueDate
                    ? new Date(dueDate).toLocaleDateString()
                    : "À définir"}
                </p>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={
                loading || saleItems.length === 0 || (isCredit && !dueDate)
              }
              className={`
                px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2
                transition-all duration-300 min-w-[120px]
                ${
                  saleItems.length > 0 && !(isCredit && !dueDate)
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg active:scale-[0.97]"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">En cours...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span className="text-xs">
                    {isCredit ? "Crédit" : "Valider"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSale;