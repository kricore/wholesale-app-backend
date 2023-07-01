const Order = require("../models/order");
const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");
const Product = require("../models/product");

const renderTemplate = ( file, data = {} ) => {
    let filename =  `./views/${file}.ejs`,
        template = fs.readFileSync( filename, 'utf-8' );

    return ejs.render( template, data, {
        filename: filename,
    });
}

const sendConfirmationEmailToClient = (order, result) => {
  let userEmail = order.user;

  if (!userEmail) return;
    let mailOptions = {
      to: userEmail,
      subject: "New Wholesale Order",
      html: renderTemplate( 'email/customer-new-order', { order: order } ),
      replyTo: process.env.EMAIL_NOTIFICATION_ADMIN_EMAIL,
    }

  sendEmailForNotification(mailOptions);

};

/**
 * Send an email to confirm an order
 *
 * @param {*} order
 */
const sendConfirmationEmail = (order) => {

    let userEmail = order.user;

    if (!userEmail) return;

    let bcc = process.env.EMAIL_NOTIFICATION_ADMIN_EMAIL_BCC ? process.env.EMAIL_NOTIFICATION_ADMIN_EMAIL_BCC.split( ',' ) : null,
        mailOptions = {
          to: process.env.EMAIL_NOTIFICATION_ADMIN_EMAIL,
          subject: "New Wholesale Order Recieved",
          html: renderTemplate( 'email/admin-new-order', { order: order } ),
          replyTo: userEmail,
        };

    if( bcc ){
      mailOptions.bcc = bcc;
    }

    sendEmailForNotification(mailOptions);
};

/**
 * Send the actual email to the client or the seller
 *
 * @param {object} mailOptions
 */
const sendEmailForNotification = async (mailOptions) => {

  mailOptions = Object.assign( {}, mailOptions, {
    from: `Wholesale Afroditi Simita <${process.env.EMAIL_NOTIFICATION_ADMIN_EMAIL}>`,
    host: "smtp.eu.mailgun.org",
    port: 465,
    secure: true,
    logger: true,
    debug: true,
    auth: {
      user: process.env.EMAIL_NOTIFICATION_SMTP_USER,
      pass: process.env.EMAIL_NOTIFICATION_SMTP_PASS,
    },
    dkim: {
      domainName: process.env.EMAIL_NOTIFICATION_DKIM_DOMAIN,
      keySelector:  process.env.EMAIL_NOTIFICATION_DKIM_SELECTOR,
      privateKey:  process.env.EMAIL_NOTIFICATION_DKIM_PRIVATE_KEY,
    }
  });

  const transporter = nodemailer.createTransport( mailOptions );
 
  transporter.sendMail( mailOptions, (err, info) => {

    if(err){
      console.log('Email error: ' + err);
    }else{
      console.log("Email sent: " + info.response);
    }

  });

};

/**
 * Create the order and store it in the database
 *
 * @param {*} req
 * @param {*} res
 */
exports.createOrder = (req, res) => {
  // Populated at the frontend using .ts models
  // All typechecking is done there
  // and at the mongo backend
  const order = new Order({...req.body});

  order.save((err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error placing order");
    } else {
      // Send confirmation email
      sendConfirmationEmailToClient(order, result);
      sendConfirmationEmail(order);
      res.send(result);
    }
  });
};

/**
 * Create the order and store it in the database
 *
 * @param {*} req
 * @param {*} res
 */
exports.getOrders = async (req, res) => {
  // Populated at the frontend using .ts models
  // All typechecking is done there
  // and at the mongo backend
  const orders = await Order.find();
  res.send(orders);
};

/**
 * Verify the order
 * Get the items from the mongodb and then cross-chetk the price
 *
 * @param {*} req
 * @param {*} res
 */
exports.verifyOrder = async (req, res) => {
  const offendingItems = [];
  const { items } = req.body; 
  for(const item of items) {
    // The item was added to the cart so there is a cached copy
    // in the database.
    // Invalid items were removed during the cart's loading
    const cachedItem = await Product.findOne({id: item.pId.toString()});
    if(cachedItem){
      const variant = cachedItem.variants.find(v => v.id === item.id.toString());
      if(variant.price !== item.price){
        const newItem = {};
        newItem.id = item.guid;
        newItem.oldPrice = item.price;
        newItem.newPrice = variant.price;
        offendingItems.push(newItem);
      }
    }
  }
  res.send({
    items: offendingItems
  });
}