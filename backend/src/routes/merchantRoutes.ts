
import { Router } from 'express';
import merchantController from '../controllers/merchantController';
import { authenticateToken } from '../middleware/authMiddleware';
import multer from 'multer';
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl } from '../config/supabase';
import path from 'path';
import crypto from 'crypto';

const router = Router();

router.use(authenticateToken);


const storage = multer.memoryStorage();


const imageUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed (JPEG, JPG, PNG, GIF, WEBP)'));
    }
  },
});
const digitalUpload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const blockedTypes = /exe|bat|cmd|sh|app|dmg|pkg/i;
    
    if (blockedTypes.test(ext)) {
      console.log('❌ Blocked dangerous file type:', ext);
      cb(new Error(`Executable files not allowed: ${ext}`));
    } else {
      console.log('✅ File type accepted:', ext);
      cb(null, true);
    }
  },
});


router.post('/create', merchantController.createMerchant.bind(merchantController));
router.get('/profile', merchantController.getMerchant.bind(merchantController));


router.post(
  '/products/upload',
  imageUpload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No image uploaded' 
        });
      }

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

   
      const fileExt = path.extname(req.file.originalname);
      const timestamp = Date.now();
      const randomHex = crypto.randomBytes(8).toString('hex');
      const fileName = `${userId}/${timestamp}-${randomHex}${fileExt}`;

      console.log('📤 Uploading image to Supabase:', {
        fileName,
        size: (req.file.size / 1024).toFixed(2) + ' KB',
        mimetype: req.file.mimetype
      });

      const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKETS.PRODUCT_IMAGES)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        return res.status(500).json({
          success: false,
          message: error.message || 'Failed to upload image'
        });
      }

      const publicUrl = getPublicUrl(STORAGE_BUCKETS.PRODUCT_IMAGES, fileName);

      console.log('✅ Image uploaded successfully:', publicUrl);

      res.json({
        success: true,
        url: publicUrl,
        fileName: req.file.originalname,
        message: 'Image uploaded successfully'
      });

    } catch (error: any) {
      console.error('❌ Image upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload image'
      });
    }
  }
);


router.post(
  '/products/upload-digital',
  (req, res, next) => {
    console.log('📤 Digital file upload request received');
    
    digitalUpload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error('❌ Multer error:', err);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 200MB.'
          });
        }
        
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      } else if (err) {
        console.error('❌ Upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'Failed to upload file'
        });
      }
      
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        console.log('❌ No file in request');
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded. Please select a file.' 
        });
      }

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

   
      const fileExt = path.extname(req.file.originalname);
      const baseName = path.basename(req.file.originalname, fileExt);
      const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
      const timestamp = Date.now();
      const randomHex = crypto.randomBytes(8).toString('hex');
      const fileName = `${userId}/${timestamp}-${randomHex}-${safeName}${fileExt}`;

      console.log('📤 Uploading digital file to Supabase:', {
        fileName,
        originalName: req.file.originalname,
        size: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB',
        mimetype: req.file.mimetype
      });

      const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKETS.DIGITAL_PRODUCTS)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        return res.status(500).json({
          success: false,
          message: error.message || 'Failed to upload file'
        });
      }

      console.log('✅ Digital file uploaded successfully to Supabase');

   
      res.json({
        success: true,
        url: fileName, 
        fileName: req.file.originalname,
        size: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: req.file.mimetype,
        message: 'File uploaded successfully!'
      });

    } catch (error: any) {
      console.error('❌ Digital upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload file'
      });
    }
  }
);

router.post('/products', merchantController.addProduct.bind(merchantController));
router.get('/products', merchantController.getProducts.bind(merchantController));
router.put('/products/:id', merchantController.updateProduct.bind(merchantController));
router.delete('/products/:id', merchantController.deleteProduct.bind(merchantController));


router.get('/orders', merchantController.getOrders.bind(merchantController));
router.put('/orders/:id/status', merchantController.updateOrderStatus.bind(merchantController));

export default router;