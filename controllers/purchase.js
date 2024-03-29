const Razorpay = require('razorpay');
const Order = require('../models/orders');
const userControllers = require('./user');

const purchasepremium = async (req, res) => {
    try {
        var rzp = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        })
        const amount = 5000;

        rzp.orders.create({amount, currency: "INR"}, async(err, order) => {
            if(err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
            }

            try {
                await req.user.createOrder({orderId: order.id, status: 'PENDING'});
                return res.status(201).json({order, key_id: rzp.key_id});
            } catch(err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });


    } catch(err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const updateTransactionStatus = async(req, res) => {
    try {
        const userId = req.user.id;
        const name = req.user.name;
        const { payment_id, order_id} = req.body;
        const order = await Order.findOne({where: {orderId: order_id}});
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (payment_id) {
            await Promise.all([
                order.update({ paymentId: payment_id, status: 'SUCCESSFUL' }),
                req.user.update({ isPremiumUser: true })
            ]);

            return res.status(202).json({ success: true, message: 'Transaction Successful', token: userControllers.generatedWebToken(userId, name, true) });
        } else {
            await order.update({ status: 'FAILED' });
            return res.status(400).json({ success: false, message: 'Transaction Failed' });
        }


    } catch(err){
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

module.exports = {
    purchasepremium,
    updateTransactionStatus
}