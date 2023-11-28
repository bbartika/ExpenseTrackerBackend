const Razorpay = require('razorpay');
const Order = require('../models/orders')
const userController = require('./user')


const purchasepremium =async (req, res) => {
    try {
        var rzp = new Razorpay({
            key_id: 'rzp_test_WuARwl5TqUuk5f',//RAZORPAY API KEY ID
            key_secret: 'SFRC3vmeSYyCjoIfxqnXpeV5'//RAZORPAY SECRET KEY
        })
        const amount = 2500;

        rzp.orders.create({amount, currency: "INR"}, (err, order) => {
        //AT FIRST rezorpay order has been created
            if(err) {
                throw new Error(JSON.stringify(err))
            }
        //THEN requested user's order has been created in the Order Table     
            req.user.createOrder({ orderid: order.id, status: 'PENDING'}).then(() => {
                return res.status(201).json({ order, key_id :  rzp.key_id});

            }).catch(err => {
                throw new Error(err)
            })
        })
    } catch(err){
        console.log(err);
        res.status(403).json({ message: 'Sometghing went wrong', error: err})
    }
}

 const updateTransactionStatus = async (req, res ) => {
    try {
        const userId = req.user.id;
        const { payment_id, order_id} = req.body;
        const order  = await Order.findOne({where : {orderid : order_id}}) //2 //IN Order table order id always be unique if same user created multiple orders but each and every time new and unique order id will be generated against the same user.
        const promise1 =  order.update({ paymentid: payment_id, status: 'SUCCESSFUL'}) 
        const promise2 =  req.user.update({ ispremiumuser: true }) 

        Promise.all([promise1, promise2]).then(()=> {
            return res.status(202).json({sucess: true, message: "Transaction Successful",token:userController.generateAccessToken(userId,undefined, true) });
                                                                                          //this token again used only for refresh issue of the page,because at the login time token naturally passed, containing user id, ispremiumuser,but in refresh page time how the user's details wlll show again correctly
                                                                                          //the user's actual details need to pass as token which containg userid,ispremiumuser during update transaction through backend 
        }).catch((error ) => {
            throw new Error(error)
        })

        
                
    } catch (err) {
        console.log(err);
        res.status(403).json({ error : err, message: 'Sometghing went wrong' })

    }
}

module.exports = {
    purchasepremium,
    updateTransactionStatus
}
