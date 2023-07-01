const express = require('express');
const router = express.Router();
const loginController = require('./controllers/loginController');
const orderController = require('./controllers/ordersController');
const productController = require('./controllers/productController');
const {authenticateToken, authenticateTokenAndAdminUser}  = require('./middleware');
const path = require('path');
const order = require("./models/order");
const dotenv = require("dotenv");



dotenv.config();


// login route
router.post('/api/login', loginController.login);
// admin route
router.post('/api/admin', loginController.authenticateAdmin);

// order routes
router.post('/api/order', authenticateToken, orderController.createOrder);
router.get('/api/orders', authenticateTokenAndAdminUser, orderController.getOrders);
router.post('/api/verify-order', authenticateToken, orderController.verifyOrder);

// products
router.get('/api/products', authenticateToken, productController.handleProducts);

// product by id
router.get('/api/product/:id', authenticateToken, productController.handleProductById);

/**
 * Email html preview
 * order id: 6422a155587765e8e00209ca
 * Uncomment to enable this route
 */
// router.get( '/html/email_preview/', function( req, res ){
    
//     if( process.env.NODE_ENV == 'production' ){
//         res.status(403).json({ message: 'unauthorized' });
//     }

//     order.findOne({ _id: '6422a155587765e8e00209ca' }, (err, order) => {
//         if (err) {
//             return res.status(500).json({ message: err.message });
//         }

//         let template = req.query.type !== undefined && req.query.type == 'customer'
//             ? 'customer'
//             : 'admin';

//         res.render( `email/${template}-new-order`, {order: order } );
//     });

// });
// end email html preview


// Register Users
// const registerController = require('./controllers/registerController');
// router.get('/register-users/', registerController.registerUsers);


// fallback route to our Angular Application
// Replace the path with the actuall path
// The angular router will take it on from there
router.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, './dist', 'index.html'));
});


module.exports = router;