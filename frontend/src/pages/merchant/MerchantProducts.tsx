
// // src/pages/Merchant/MerchantProducts.tsx

// import React, { useState, useEffect } from 'react';
// import { useTranslation } from '../../hooks/useTranslation'; // 🌍 إضافة
// import apiService from '../../services/api';
// import { Product } from '../../types';
// import { Package, Plus, Edit, Trash2, Loader, Upload, X, FileUp, File, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

// // Toast Notification Component
// interface ToastProps {
//   message: string;
//   type: 'success' | 'error' | 'warning' | 'info';
//   onClose: () => void;
// }

// const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       onClose();
//     }, 5000);
//     return () => clearTimeout(timer);
//   }, [onClose]);

//   const colors = {
//     success: 'bg-green-500 border-green-600',
//     error: 'bg-red-500 border-red-600',
//     warning: 'bg-yellow-500 border-yellow-600',
//     info: 'bg-blue-500 border-blue-600',
//   };

//   const icons = {
//     success: <CheckCircle className="w-5 h-5" />,
//     error: <XCircle className="w-5 h-5" />,
//     warning: <AlertCircle className="w-5 h-5" />,
//     info: <AlertCircle className="w-5 h-5" />,
//   };

//   return (
//     <div className={`fixed top-4 right-4 z-[9999] ${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl border-2 flex items-center gap-3 max-w-md animate-slide-in`}>
//       {icons[type]}
//       <span className="flex-1 font-medium">{message}</span>
//       <button
//         onClick={onClose}
//         className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
//       >
//         <X className="w-4 h-4" />
//       </button>
//     </div>
//   );
// };

// const MerchantProducts: React.FC = () => {
//   const { t } = useTranslation(); // 🌍 استخدام الترجمة
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [editingProduct, setEditingProduct] = useState<Product | null>(null);

//   const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

//   const [formData, setFormData] = useState({
//     name: '',
//     description: '',
//     price: '',
//     imageUrl: '',
//     stock: '10',
//     isDigital: false,
//     digitalFileUrl: '',
//   });

//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string>('');
//   const [uploadingImage, setUploadingImage] = useState(false);

//   const [digitalFile, setDigitalFile] = useState<File | null>(null);
//   const [uploadingDigital, setUploadingDigital] = useState(false);

//   const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

//   const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
//   const MAX_DIGITAL_SIZE = 200 * 1024 * 1024;

//   useEffect(() => {
//     loadProducts();
//   }, []);

//   const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
//     setToast({ message, type });
//   };

//   const loadProducts = async () => {
//     try {
//       setLoading(true);
//       const res = await apiService.getMerchantProducts();
//       if (res.success) {
//         setProducts(res.data.products);
//       }
//     } catch (err: any) {
//       showToast(t.merchantProducts.failedToLoadProducts, 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (file.size > MAX_IMAGE_SIZE) {
//       showToast(`${t.merchantProducts.imageTooLarge} ${t.merchantProducts.maxSize}: 10MB. ${t.merchantProducts.yourFile}: ${(file.size / (1024 * 1024)).toFixed(2)}MB`, 'error');
//       e.target.value = '';
//       return;
//     }

//     setImageFile(file);
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setImagePreview(reader.result as string);
//     };
//     reader.readAsDataURL(file);
//   };

//   const handleDigitalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (file.size > MAX_DIGITAL_SIZE) {
//       showToast(`${t.merchantProducts.fileTooLarge} ${t.merchantProducts.max}: 200MB. ${t.merchantProducts.yourFile}: ${(file.size / (1024 * 1024)).toFixed(2)}MB`, 'error');
//       e.target.value = '';
//       return;
//     }

//     console.log('✅ File selected:', {
//       name: file.name,
//       size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
//       type: file.type
//     });

//     setDigitalFile(file);
//   };

//   const uploadImage = async (): Promise<string | null> => {
//     if (!imageFile) return null;

//     try {
//       setUploadingImage(true);
//       const formData = new FormData();
//       formData.append('image', imageFile);

//       const res = await apiService.uploadProductImage(formData);
//       if (res.success) {
//         showToast(t.merchantProducts.imageUploaded, 'success');
//         return res.url;
//       }
//       return null;
//     } catch (err: any) {
//       console.error('Image upload failed:', err);
//       showToast(err.response?.data?.message || t.merchantProducts.failedToUploadImage, 'error');
//       return null;
//     } finally {
//       setUploadingImage(false);
//     }
//   };

//   const uploadDigitalFile = async (): Promise<string | null> => {
//     if (!digitalFile) return null;

//     try {
//       setUploadingDigital(true);
      
//       console.log('📤 Uploading digital file:', {
//         name: digitalFile.name,
//         size: (digitalFile.size / (1024 * 1024)).toFixed(2) + ' MB',
//         type: digitalFile.type
//       });

//       const formData = new FormData();
//       formData.append('file', digitalFile);

//       const res = await apiService.uploadDigitalFile(formData);
      
//       console.log('✅ Upload response:', res);
      
//       if (res.success) {
//         showToast(`${t.merchantProducts.fileUploaded}: ${res.filename} (${res.size})`, 'success');
//         return res.url;
//       } else {
//         throw new Error(res.message || t.merchantProducts.uploadFailed);
//       }
//     } catch (err: any) {
//       console.error('❌ Digital file upload failed:', err);
      
//       let errorMessage = t.merchantProducts.failedToUploadFile;
//       if (err.response?.data?.message) {
//         errorMessage = err.response.data.message;
//       } else if (err.message) {
//         errorMessage = err.message;
//       }
      
//       showToast(errorMessage, 'error');
//       return null;
//     } finally {
//       setUploadingDigital(false);
//     }
//   };

//   const handleAddProduct = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!formData.name || !formData.price) {
//       showToast(t.merchantProducts.fillNameAndPrice, 'warning');
//       return;
//     }

//     if (formData.isDigital && !digitalFile && !formData.digitalFileUrl) {
//       showToast(t.merchantProducts.uploadDigitalFile, 'warning');
//       return;
//     }

//     try {
//       setLoading(true);

//       let imageUrl = formData.imageUrl;
//       if (imageFile) {
//         const uploadedUrl = await uploadImage();
//         if (uploadedUrl) imageUrl = uploadedUrl;
//       }

//       let digitalFileUrl = formData.digitalFileUrl;
//       if (formData.isDigital && digitalFile) {
//         const uploadedFileUrl = await uploadDigitalFile();
//         if (!uploadedFileUrl) {
//           showToast(t.merchantProducts.failedToUploadDigitalFile, 'error');
//           setLoading(false);
//           return;
//         }
//         digitalFileUrl = uploadedFileUrl;
//       }

//       const res = await apiService.addProduct({
//         name: formData.name,
//         description: formData.description,
//         price: parseFloat(formData.price),
//         imageUrl,
//         stock: parseInt(formData.stock) || 0,
//         isDigital: formData.isDigital,
//         digitalFileUrl,
//       });

//       if (res.success) {
//         showToast(res.message || t.merchantProducts.productAdded, 'success');
//         setShowAddModal(false);
//         resetForm();
//         loadProducts();
//       }
//     } catch (err: any) {
//       showToast(err.response?.data?.message || t.merchantProducts.failedToAddProduct, 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEditProduct = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!editingProduct) return;

//     if (formData.isDigital && !digitalFile && !formData.digitalFileUrl) {
//       showToast(t.merchantProducts.digitalMustHaveFile, 'warning');
//       return;
//     }

//     try {
//       setLoading(true);

//       let imageUrl = formData.imageUrl;
//       if (imageFile) {
//         const uploadedUrl = await uploadImage();
//         if (uploadedUrl) imageUrl = uploadedUrl;
//       }

//       let digitalFileUrl = formData.digitalFileUrl;
//       if (formData.isDigital && digitalFile) {
//         const uploadedFileUrl = await uploadDigitalFile();
//         if (uploadedFileUrl) digitalFileUrl = uploadedFileUrl;
//       }

//       const res = await apiService.updateProduct(editingProduct.id, {
//         name: formData.name,
//         description: formData.description,
//         price: parseFloat(formData.price),
//         imageUrl,
//         stock: parseInt(formData.stock) || 0,
//         isDigital: formData.isDigital,
//         digitalFileUrl,
//       });

//       if (res.success) {
//         showToast(res.message || t.merchantProducts.productUpdated, 'success');
//         setShowEditModal(false);
//         setEditingProduct(null);
//         resetForm();
//         loadProducts();
//       }
//     } catch (err: any) {
//       showToast(err.response?.data?.message || t.merchantProducts.failedToUpdateProduct, 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteProduct = async (productId: number, productName: string) => {
//     if (!window.confirm(`${t.merchantProducts.areYouSureDelete} "${productName}"?`)) {
//       return;
//     }

//     try {
//       setLoading(true);
//       const res = await apiService.deleteProduct(productId);
      
//       if (res.success) {
//         showToast(res.message || t.merchantProducts.productDeleted, 'success');
//         if (res.warning) {
//           setTimeout(() => {
//             showToast(res.warning, 'warning');
//           }, 2000);
//         }
//         loadProducts();
//       }
//     } catch (err: any) {
//       if (err.response?.status === 403 && err.response?.data?.details?.canForceDelete) {
//         const errorData = err.response.data;
//         const orderCount = errorData.details.orderCount;
        
//         const confirmMessage = `⚠️ ${t.merchantProducts.warningCannotDelete}

// ${t.merchantProducts.product}: "${productName}"
// ${t.merchantProducts.completedOrders}: ${orderCount}

// ${t.merchantProducts.importantInformation}:
// ✅ ${t.merchantProducts.customersWillKeep}
//    (${t.merchantProducts.fileSavedInHistory})

// ❌ ${t.merchantProducts.howeverIfDelete}:
//    • ${t.merchantProducts.productNameDeleted}
//    • ${t.merchantProducts.loseSalesHistory}
//    • ${t.merchantProducts.analyticsAffected}

// 💡 ${t.merchantProducts.recommendedAlternative}:
//    • ${t.merchantProducts.setStockToZero}
//    • ${t.merchantProducts.orEditDescription}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ${t.merchantProducts.stillWantDelete}

// ⚠️ ${t.merchantProducts.typeDeleteToConfirm}:`;

//         const userInput = window.prompt(confirmMessage);
        
//         if (userInput === 'DELETE') {
//           try {
//             setLoading(true);
//             const forceRes = await apiService.deleteProduct(productId, true);
            
//             if (forceRes.success) {
//               showToast(t.merchantProducts.productDeletedForced, 'success');
//               if (forceRes.warning) {
//                 setTimeout(() => {
//                   showToast(forceRes.warning, 'warning');
//                 }, 2000);
//               }
//               loadProducts();
//             }
//           } catch (forceErr: any) {
//             showToast(forceErr.response?.data?.message || t.merchantProducts.failedToDeleteProduct, 'error');
//           } finally {
//             setLoading(false);
//           }
//         } else {
//           showToast(t.merchantProducts.deleteCancelled, 'info');
//         }
//       } else {
//         showToast(err.response?.data?.message || t.merchantProducts.failedToDeleteProduct, 'error');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const openEditModal = (product: Product) => {
//     setEditingProduct(product);
//     setFormData({
//       name: product.name,
//       description: product.description,
//       price: product.price.toString(),
//       imageUrl: product.image_url || '',
//       stock: product.stock.toString(),
//       isDigital: product.is_digital || false,
//       digitalFileUrl: product.digital_file_url || '',
//     });
//     setImagePreview(product.image_url ? getImageUrl(product.image_url) : '');
//     setShowEditModal(true);
//   };

//   const resetForm = () => {
//     setFormData({
//       name: '',
//       description: '',
//       price: '',
//       imageUrl: '',
//       stock: '10',
//       isDigital: false,
//       digitalFileUrl: '',
//     });
//     setImageFile(null);
//     setDigitalFile(null);
//     setImagePreview('');
//   };

//   const closeModal = () => {
//     if (uploadingImage || uploadingDigital) {
//       if (!window.confirm(t.merchantProducts.uploadInProgress)) {
//         return;
//       }
//     }
//     setShowAddModal(false);
//     setShowEditModal(false);
//     setEditingProduct(null);
//     resetForm();
//   };

//   const getImageUrl = (url: string | null | undefined): string => {
//     if (!url) return '';
//     if (url.startsWith('http') || url.startsWith('data:')) return url;
//     return `${API_URL}${url}`;
//   };

//   const formatFileSize = (bytes: number): string => {
//     if (bytes < 1024) return bytes + ' B';
//     if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
//     return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
//   };

//   if (loading && products.length === 0) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
//         <div className="text-center">
//           <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
//           <p className="text-gray-600 font-medium">{t.merchantProducts.loadingProducts}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-4 sm:py-8 px-2 sm:px-4">
//       <div className="max-w-7xl mx-auto">
//         {/* Toast Notification */}
//         {toast && (
//           <Toast
//             message={toast.message}
//             type={toast.type}
//             onClose={() => setToast(null)}
//           />
//         )}

//         {/* Header */}
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
//           <div>
//             <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
//               {t.merchantProducts.myProducts}
//             </h1>
//             <p className="text-gray-600 mt-1 text-sm sm:text-base">{t.merchantProducts.manageInventory}</p>
//           </div>
//           <button
//             onClick={() => setShowAddModal(true)}
//             className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
//           >
//             <Plus className="w-5 h-5" />
//             {t.merchantProducts.addProduct}
//           </button>
//         </div>

//         {/* Products Grid */}
//         {products.length === 0 ? (
//           <div className="text-center py-12 sm:py-16 bg-white rounded-2xl shadow-md">
//             <Package className="w-16 sm:w-20 h-16 sm:h-20 text-gray-300 mx-auto mb-4" />
//             <p className="text-gray-500 text-base sm:text-lg mb-4">{t.merchantProducts.noProductsYet}</p>
//             <button
//               onClick={() => setShowAddModal(true)}
//               className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
//             >
//               {t.merchantProducts.addFirstProduct}
//             </button>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
//             {products.map((product) => (
//               <div
//                 key={product.id}
//                 className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all relative"
//               >
//                 {product.is_digital && (
//                   <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
//                     <File className="w-3 h-3" />
//                     {t.merchantProducts.digital}
//                   </div>
//                 )}

//                 <div className="h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
//                   {product.image_url ? (
//                     <img
//                       src={getImageUrl(product.image_url)}
//                       alt={product.name}
//                       className="w-full h-full object-cover"
//                     />
//                   ) : (
//                     <Package className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400" />
//                   )}
//                 </div>

//                 <div className="p-3 sm:p-4">
//                   <h3 className="font-bold text-base sm:text-lg mb-2 text-gray-800 line-clamp-1">{product.name}</h3>
//                   <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2 min-h-[32px] sm:min-h-[40px]">
//                     {product.description}
//                   </p>

//                   <div className="flex justify-between items-center mb-3 sm:mb-4">
//                     <span className="text-xl sm:text-2xl font-bold text-blue-600">{product.price} PS</span>
//                     <span className="text-xs sm:text-sm text-gray-500">
//                       {t.merchantProducts.stock}: {product.stock}
//                       {product.is_digital && (
//                         <span className="ml-1 text-blue-600 font-medium">📥</span>
//                       )}
//                     </span>
//                   </div>

//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => openEditModal(product)}
//                       className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
//                     >
//                       <Edit className="w-4 h-4" />
//                       <span className="hidden sm:inline">{t.merchantProducts.edit}</span>
//                     </button>
//                     <button
//                       onClick={() => handleDeleteProduct(product.id, product.name)}
//                       className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                       <span className="hidden sm:inline">{t.merchantProducts.delete}</span>
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Add/Edit Product Modal */}
//         {(showAddModal || showEditModal) && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
//             <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
//               <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 sm:p-6 text-white sticky top-0 z-10">
//                 <div className="flex justify-between items-center">
//                   <h2 className="text-xl sm:text-2xl font-bold">
//                     {showEditModal ? t.merchantProducts.editProduct : t.merchantProducts.createNewProduct}
//                   </h2>
//                   <button
//                     onClick={closeModal}
//                     className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
//                   >
//                     <X className="w-5 sm:w-6 h-5 sm:h-6" />
//                   </button>
//                 </div>
//               </div>

//               <form onSubmit={showEditModal ? handleEditProduct : handleAddProduct} className="p-4 sm:p-6">
//                 {/* Product Name */}
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     {t.merchantProducts.productName} *
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.name}
//                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder={t.merchantProducts.enterProductName}
//                     required
//                   />
//                 </div>

//                 {/* Description */}
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     {t.merchantProducts.description}
//                   </label>
//                   <textarea
//                     value={formData.description}
//                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                     rows={3}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder={t.merchantProducts.describeProduct}
//                   />
//                 </div>

//                 {/* Price */}
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     {t.merchantProducts.price} *
//                   </label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     min="0"
//                     value={formData.price}
//                     onChange={(e) => setFormData({ ...formData, price: e.target.value })}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder={t.merchantProducts.enterPrice}
//                     required
//                   />
//                 </div>

//                 {/* Stock Quantity */}
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     {t.merchantProducts.stockQuantity} *
//                   </label>
//                   <input
//                     type="number"
//                     min="0"
//                     value={formData.stock}
//                     onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder={t.merchantProducts.enterStockQuantity}
//                     required
//                   />
//                   <p className="text-xs text-gray-500 mt-1">
//                     {t.merchantProducts.setNumberAvailable}
//                   </p>
//                 </div>

//                 {/* Digital Product Toggle */}
//                 <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
//                   <label className="flex items-center cursor-pointer">
//                     <input
//                       type="checkbox"
//                       checked={formData.isDigital}
//                       onChange={(e) => setFormData({ ...formData, isDigital: e.target.checked })}
//                       className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
//                     />
//                     <span className="ml-3 text-sm font-medium text-gray-700">
//                       {t.merchantProducts.digitalFileDownloadable}
//                     </span>
//                   </label>
//                 </div>

//                 {/* Digital File Upload */}
//                 {formData.isDigital && (
//                   <div className="mb-4">
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       {t.merchantProducts.digitalFile} * ({t.merchantProducts.max} 200MB)
//                     </label>
//                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
//                       <p className="text-xs text-blue-800 font-medium mb-2">
//                         ✅ {t.merchantProducts.accepted}: {t.merchantProducts.acceptedFormats}
//                       </p>
//                       <p className="text-xs text-blue-700">
//                         📦 {t.merchantProducts.archives} • 📄 {t.merchantProducts.documents} • 🎵 {t.merchantProducts.audio} • 🎬 {t.merchantProducts.video} • 📊 {t.merchantProducts.spreadsheets}
//                       </p>
//                     </div>
                    
//                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
//                       <input
//                         type="file"
//                         onChange={handleDigitalFileChange}
//                         className="hidden"
//                         id="digitalFileInput"
//                       />
//                       <label
//                         htmlFor="digitalFileInput"
//                         className="flex flex-col items-center cursor-pointer"
//                       >
//                         {digitalFile || formData.digitalFileUrl ? (
//                           <div className="text-center w-full">
//                             <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg mb-2 inline-flex items-center gap-2">
//                               <File className="w-5 h-5" />
//                               <span className="font-medium">{t.merchantProducts.fileSelected}</span>
//                             </div>
//                             <p className="text-sm text-gray-800 font-medium mb-1 break-all">
//                               {digitalFile ? digitalFile.name : t.merchantProducts.fileUploaded}
//                             </p>
//                             {digitalFile && (
//                               <p className="text-xs text-gray-600 mb-2">
//                                 {formatFileSize(digitalFile.size)}
//                               </p>
//                             )}
//                             <button
//                               type="button"
//                               onClick={(e) => {
//                                 e.preventDefault();
//                                 setDigitalFile(null);
//                                 setFormData({ ...formData, digitalFileUrl: '' });
//                                 const input = document.getElementById('digitalFileInput') as HTMLInputElement;
//                                 if (input) input.value = '';
//                               }}
//                               className="text-sm text-red-600 hover:text-red-800 underline"
//                             >
//                               {t.merchantProducts.removeFile}
//                             </button>
//                           </div>
//                         ) : (
//                           <>
//                             <FileUp className="w-12 h-12 text-gray-400 mb-2" />
//                             <span className="text-sm text-gray-600 mb-1">
//                               {t.merchantProducts.clickToUploadFile}
//                             </span>
//                             <span className="text-xs text-gray-500">
//                               {t.merchantProducts.allFileTypesAccepted}
//                             </span>
//                           </>
//                         )}
//                       </label>
//                     </div>
//                   </div>
//                 )}

//                 {/* Product Image */}
//                 <div className="mb-6">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     {t.merchantProducts.productImage} ({t.merchantProducts.max} 10MB)
//                   </label>
//                   <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
//                     {imagePreview ? (
//                       <div className="relative">
//                         <img
//                           src={imagePreview}
//                           alt={t.merchantProducts.preview}
//                           className="w-full h-48 object-cover rounded-lg"
//                         />
//                         <button
//                           type="button"
//                           onClick={() => {
//                             setImageFile(null);
//                             setImagePreview('');
//                             setFormData({ ...formData, imageUrl: '' });
//                           }}
//                           className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
//                         >
//                           <X className="w-4 h-4" />
//                         </button>
//                       </div>
//                     ) : (
//                       <>
//                         <input
//                           type="file"
//                           accept="image/*"
//                           onChange={handleImageChange}
//                           className="hidden"
//                           id="imageInput"
//                         />
//                         <label
//                           htmlFor="imageInput"
//                           className="flex flex-col items-center cursor-pointer"
//                         >
//                           <Upload className="w-12 h-12 text-gray-400 mb-2" />
//                           <span className="text-sm text-gray-600">{t.merchantProducts.clickToUploadImage}</span>
//                           <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WEBP</span>
//                         </label>
//                       </>
//                     )}
//                   </div>
//                 </div>

//                 {/* Submit Buttons */}
//                 <div className="flex flex-col sm:flex-row gap-3">
//                   <button
//                     type="button"
//                     onClick={closeModal}
//                     disabled={loading || uploadingImage || uploadingDigital}
//                     className="flex-1 py-3 sm:py-4 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     {t.merchantProducts.cancel}
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={loading || uploadingImage || uploadingDigital}
//                     className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 sm:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     {loading || uploadingImage || uploadingDigital ? (
//                       <span className="flex items-center justify-center gap-2">
//                         <Loader className="w-5 h-5 animate-spin" />
//                         {uploadingDigital ? t.merchantProducts.uploadingFile : uploadingImage ? t.merchantProducts.uploadingImage : t.merchantProducts.processing}
//                       </span>
//                     ) : (
//                       showEditModal ? t.merchantProducts.updateProduct : t.merchantProducts.addProduct
//                     )}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* CSS for animations */}
//       <style>{`
//         @keyframes slide-in {
//           from {
//             transform: translateX(100%);
//             opacity: 0;
//           }
//           to {
//             transform: translateX(0);
//             opacity: 1;
//           }
//         }
//         .animate-slide-in {
//           animation: slide-in 0.3s ease-out;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default MerchantProducts;



// src/pages/Merchant/MerchantProducts.tsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import apiService from '../../services/api';
import { Product } from '../../types';
import {
  Package, Plus, Edit, Trash2, Loader, Upload, X,
  FileUp, File, CheckCircle, AlertCircle, XCircle, Share2, Copy, ImageOff,
} from 'lucide-react';

// ── Toast ────────────────────────────────────────────────
interface ToastProps { message: string; type: 'success' | 'error' | 'warning' | 'info'; onClose: () => void; }
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500', info: 'bg-blue-500' };
  const icons = { success: <CheckCircle className="w-5 h-5" />, error: <XCircle className="w-5 h-5" />, warning: <AlertCircle className="w-5 h-5" />, info: <AlertCircle className="w-5 h-5" /> };
  return (
    <div className={`fixed top-4 right-4 z-[9999] ${colors[type]} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-xs sm:max-w-md animate-slide-in`}>
      {icons[type]}
      <span className="flex-1 font-medium text-sm sm:text-base">{message}</span>
      <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 p-1 rounded flex-shrink-0"><X className="w-4 h-4" /></button>
    </div>
  );
};

// ── Copy Toast ───────────────────────────────────────────
const CopyToast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 2000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-medium whitespace-nowrap">
      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      {message}
    </div>
  );
};

const MerchantProducts: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [copyToast, setCopyToast] = useState('');

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', imageUrl: '',
    stock: '10', isDigital: false, digitalFileUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [uploadingDigital, setUploadingDigital] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || window.location.origin;
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
  const MAX_DIGITAL_SIZE = 200 * 1024 * 1024;

  useEffect(() => { loadProducts(); }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => setToast({ message, type });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await apiService.getMerchantProducts();
      if (res.success) setProducts(res.data.products);
    } catch { showToast(t.merchantProducts.failedToLoadProducts, 'error'); }
    finally { setLoading(false); }
  };

  // ── Share product link ────────────────────────────────
  const handleShareProduct = async (productId: number, productName: string) => {
    const url = `${window.location.origin}/product/${productId}`;
    try {
      if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        await navigator.share({ title: productName, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopyToast(t.merchantProducts.productLinkCopied);
      }
    } catch {
      try { await navigator.clipboard.writeText(url); setCopyToast(t.merchantProducts.productLinkCopied); } catch {}
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      showToast(`${t.merchantProducts.imageTooLarge} ${t.merchantProducts.maxSize}: 10MB`, 'error');
      e.target.value = ''; return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDigitalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > MAX_DIGITAL_SIZE) {
      showToast(`${t.merchantProducts.fileTooLarge} ${t.merchantProducts.max}: 200MB`, 'error');
      e.target.value = ''; return;
    }
    setDigitalFile(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    try {
      setUploadingImage(true);
      const fd = new FormData(); fd.append('image', imageFile);
      const res = await apiService.uploadProductImage(fd);
      if (res.success) { showToast(t.merchantProducts.imageUploaded, 'success'); return res.url; }
      return null;
    } catch (err: any) { showToast(err.response?.data?.message || t.merchantProducts.failedToUploadImage, 'error'); return null; }
    finally { setUploadingImage(false); }
  };

  const uploadDigitalFile = async (): Promise<string | null> => {
    if (!digitalFile) return null;
    try {
      setUploadingDigital(true);
      const fd = new FormData(); fd.append('file', digitalFile);
      const res = await apiService.uploadDigitalFile(fd);
      if (res.success) { showToast(`${t.merchantProducts.fileUploaded}: ${res.filename}`, 'success'); return res.url; }
      throw new Error(res.message || t.merchantProducts.uploadFailed);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || t.merchantProducts.failedToUploadFile, 'error');
      return null;
    } finally { setUploadingDigital(false); }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) { showToast(t.merchantProducts.fillNameAndPrice, 'warning'); return; }
    if (formData.isDigital && !digitalFile && !formData.digitalFileUrl) { showToast(t.merchantProducts.uploadDigitalFile, 'warning'); return; }
    try {
      setLoading(true);
      let imageUrl = formData.imageUrl;
      if (imageFile) { const u = await uploadImage(); if (u) imageUrl = u; }
      let digitalFileUrl = formData.digitalFileUrl;
      if (formData.isDigital && digitalFile) {
        const u = await uploadDigitalFile();
        if (!u) { showToast(t.merchantProducts.failedToUploadDigitalFile, 'error'); setLoading(false); return; }
        digitalFileUrl = u;
      }
      const res = await apiService.addProduct({ name: formData.name, description: formData.description, price: parseFloat(formData.price), imageUrl, stock: parseInt(formData.stock) || 0, isDigital: formData.isDigital, digitalFileUrl });
      if (res.success) { showToast(res.message || t.merchantProducts.productAdded, 'success'); setShowAddModal(false); resetForm(); loadProducts(); }
    } catch (err: any) { showToast(err.response?.data?.message || t.merchantProducts.failedToAddProduct, 'error'); }
    finally { setLoading(false); }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (formData.isDigital && !digitalFile && !formData.digitalFileUrl) { showToast(t.merchantProducts.digitalMustHaveFile, 'warning'); return; }
    try {
      setLoading(true);
      let imageUrl = formData.imageUrl;
      if (imageFile) { const u = await uploadImage(); if (u) imageUrl = u; }
      let digitalFileUrl = formData.digitalFileUrl;
      if (formData.isDigital && digitalFile) { const u = await uploadDigitalFile(); if (u) digitalFileUrl = u; }
      const res = await apiService.updateProduct(editingProduct.id, { name: formData.name, description: formData.description, price: parseFloat(formData.price), imageUrl, stock: parseInt(formData.stock) || 0, isDigital: formData.isDigital, digitalFileUrl });
      if (res.success) { showToast(res.message || t.merchantProducts.productUpdated, 'success'); setShowEditModal(false); setEditingProduct(null); resetForm(); loadProducts(); }
    } catch (err: any) { showToast(err.response?.data?.message || t.merchantProducts.failedToUpdateProduct, 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!window.confirm(`${t.merchantProducts.areYouSureDelete} "${productName}"?`)) return;
    try {
      setLoading(true);
      const res = await apiService.deleteProduct(productId);
      if (res.success) {
        showToast(res.message || t.merchantProducts.productDeleted, 'success');
        if (res.warning) setTimeout(() => showToast(res.warning, 'warning'), 2000);
        loadProducts();
      }
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.details?.canForceDelete) {
        const orderCount = err.response.data.details.orderCount;
        const confirmMsg = `⚠️ ${t.merchantProducts.warningCannotDelete}\n\n"${productName}"\n${t.merchantProducts.completedOrders}: ${orderCount}\n\n${t.merchantProducts.stillWantDelete}\n\n${t.merchantProducts.typeDeleteToConfirm}:`;
        const input = window.prompt(confirmMsg);
        if (input === 'DELETE') {
          try {
            setLoading(true);
            const fr = await apiService.deleteProduct(productId, true);
            if (fr.success) { showToast(t.merchantProducts.productDeletedForced, 'success'); if (fr.warning) setTimeout(() => showToast(fr.warning, 'warning'), 2000); loadProducts(); }
          } catch (fe: any) { showToast(fe.response?.data?.message || t.merchantProducts.failedToDeleteProduct, 'error'); }
          finally { setLoading(false); }
        } else { showToast(t.merchantProducts.deleteCancelled, 'info'); }
      } else { showToast(err.response?.data?.message || t.merchantProducts.failedToDeleteProduct, 'error'); }
    } finally { setLoading(false); }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ name: product.name, description: product.description, price: product.price.toString(), imageUrl: product.image_url || '', stock: product.stock.toString(), isDigital: product.is_digital || false, digitalFileUrl: product.digital_file_url || '' });
    setImagePreview(product.image_url ? getImageUrl(product.image_url) : '');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', imageUrl: '', stock: '10', isDigital: false, digitalFileUrl: '' });
    setImageFile(null); setDigitalFile(null); setImagePreview('');
  };

  const closeModal = () => {
    if ((uploadingImage || uploadingDigital) && !window.confirm(t.merchantProducts.uploadInProgress)) return;
    setShowAddModal(false); setShowEditModal(false); setEditingProduct(null); resetForm();
  };

  const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_URL}${url}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ── Remove image helper ───────────────────────────────
  const removeImage = () => {
    setImageFile(null); setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    const input = document.getElementById('imageInput') as HTMLInputElement;
    if (input) input.value = '';
  };

  if (loading && products.length === 0) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">{t.merchantProducts.loadingProducts}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-4 sm:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {copyToast && <CopyToast message={copyToast} onClose={() => setCopyToast('')} />}

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t.merchantProducts.myProducts}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">{t.merchantProducts.manageInventory}</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />{t.merchantProducts.addProduct}
          </button>
        </div>

        {/* ── Products Grid ── */}
        {products.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-2xl shadow-md">
            <Package className="w-16 sm:w-20 h-16 sm:h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-base sm:text-lg mb-4">{t.merchantProducts.noProductsYet}</p>
            <button onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
              {t.merchantProducts.addFirstProduct}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all relative flex flex-col">
                {product.is_digital && (
                  <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <File className="w-3 h-3" />
                    <span className="hidden sm:inline">{t.merchantProducts.digital}</span>
                  </div>
                )}
                <div className="h-36 sm:h-44 lg:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={getImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-10 h-10 sm:w-14 sm:h-14 text-gray-400" />
                  )}
                </div>
                <div className="p-3 sm:p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-sm sm:text-base lg:text-lg mb-1.5 text-gray-800 line-clamp-1">{product.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2 flex-1 leading-relaxed">{product.description}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{product.price} PS</span>
                    <span className="text-xs text-gray-500">{t.merchantProducts.stock}: {product.stock}</span>
                  </div>
                  <div className="flex gap-2">
                    {/* Share/copy product link */}
                    <button onClick={() => handleShareProduct(product.id, product.name)}
                      className="flex-shrink-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 p-2 rounded-lg transition-colors border border-emerald-200"
                      title={t.merchantProducts.shareProduct}>
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEditModal(product)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{t.merchantProducts.edit}</span>
                      <span className="sm:hidden">✏️</span>
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm border border-red-200">
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{t.merchantProducts.delete}</span>
                      <span className="sm:hidden">🗑</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════ ADD / EDIT MODAL ══════════ */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overflow-hidden">
            <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh]">

              {/* Sticky header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 sm:p-6 text-white flex-shrink-0 rounded-t-3xl sm:rounded-t-2xl">
                <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4 sm:hidden" />
                <div className="flex justify-between items-center">
                  <h2 className="text-lg sm:text-2xl font-bold">
                    {showEditModal ? t.merchantProducts.editProduct : t.merchantProducts.createNewProduct}
                  </h2>
                  <button onClick={closeModal} className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors">
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1">
                <form onSubmit={showEditModal ? handleEditProduct : handleAddProduct} className="p-4 sm:p-6 space-y-4">

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.merchantProducts.productName} *</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder={t.merchantProducts.enterProductName} />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.merchantProducts.description}</label>
                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder={t.merchantProducts.describeProduct} />
                  </div>

                  {/* Price + Stock row */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.merchantProducts.price} *</label>
                      <input type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.merchantProducts.stockQuantity} *</label>
                      <input type="number" min="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="10" />
                    </div>
                  </div>

                  {/* Digital toggle */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <label className="flex items-center cursor-pointer gap-3">
                      <input type="checkbox" checked={formData.isDigital} onChange={e => setFormData({ ...formData, isDigital: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                      <span className="text-sm font-medium text-gray-700">{t.merchantProducts.digitalFileDownloadable}</span>
                    </label>
                  </div>

                  {/* Digital file upload */}
                  {formData.isDigital && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.merchantProducts.digitalFile} * ({t.merchantProducts.max} 200MB)
                      </label>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
                        <p className="text-xs text-blue-700">{t.merchantProducts.acceptedFormats}</p>
                      </div>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 transition-colors">
                        <input type="file" onChange={handleDigitalFileChange} className="hidden" id="digitalFileInput" />
                        <label htmlFor="digitalFileInput" className="flex flex-col items-center cursor-pointer">
                          {digitalFile || formData.digitalFileUrl ? (
                            <div className="text-center w-full">
                              <div className="bg-green-100 text-green-700 px-3 py-2 rounded-lg mb-2 inline-flex items-center gap-2 text-sm">
                                <File className="w-4 h-4" /><span className="font-medium">{t.merchantProducts.fileSelected}</span>
                              </div>
                              <p className="text-sm text-gray-800 font-medium break-all">{digitalFile ? digitalFile.name : t.merchantProducts.fileUploaded}</p>
                              {digitalFile && <p className="text-xs text-gray-500 mt-1">{formatFileSize(digitalFile.size)}</p>}
                              <button type="button" onClick={e => { e.preventDefault(); setDigitalFile(null); setFormData(p => ({ ...p, digitalFileUrl: '' })); const i = document.getElementById('digitalFileInput') as HTMLInputElement; if (i) i.value = ''; }}
                                className="mt-2 text-xs text-red-600 hover:text-red-800 underline">
                                {t.merchantProducts.removeFile}
                              </button>
                            </div>
                          ) : (
                            <><FileUp className="w-10 h-10 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600">{t.merchantProducts.clickToUploadFile}</span>
                            <span className="text-xs text-gray-400 mt-1">{t.merchantProducts.allFileTypesAccepted}</span></>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Product image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.merchantProducts.productImage} ({t.merchantProducts.max} 10MB)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden hover:border-blue-400 transition-colors">
                      {imagePreview ? (
                        <div className="relative">
                          <img src={imagePreview} alt={t.merchantProducts.preview} className="w-full h-44 sm:h-52 object-cover" />
                          {/* Delete image button */}
                          <button type="button" onClick={removeImage}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl shadow-lg transition-colors flex items-center gap-1.5 text-xs font-semibold">
                            <ImageOff className="w-4 h-4" />
                            <span className="hidden sm:inline">{t.merchantProducts.removeImage}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-6">
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="imageInput" />
                          <label htmlFor="imageInput" className="flex flex-col items-center cursor-pointer">
                            <Upload className="w-10 h-10 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600">{t.merchantProducts.clickToUploadImage}</span>
                            <span className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, WEBP</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pb-2">
                    <button type="button" onClick={closeModal} disabled={loading || uploadingImage || uploadingDigital}
                      className="flex-1 py-3 sm:py-4 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors disabled:opacity-50 text-sm sm:text-base">
                      {t.merchantProducts.cancel}
                    </button>
                    <button type="submit" disabled={loading || uploadingImage || uploadingDigital}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 sm:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 text-sm sm:text-base">
                      {(loading || uploadingImage || uploadingDigital) ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-5 h-5 animate-spin" />
                          {uploadingDigital ? t.merchantProducts.uploadingFile : uploadingImage ? t.merchantProducts.uploadingImage : t.merchantProducts.processing}
                        </span>
                      ) : showEditModal ? t.merchantProducts.updateProduct : t.merchantProducts.addProduct}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default MerchantProducts;