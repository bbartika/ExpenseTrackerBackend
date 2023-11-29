const sib = require("sib-api-v3-sdk");
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
require('dotenv').config();


const User = require('../models/users');
const Forgotpassword = require('../models/forgotpassword');

const forgotpassword = async (req, res) => {
    try {
        const { email } =  req.body;
        const user = await User.findOne({where : { email }});
        if(!user){
            return res.status(404).json({error:'User not found'});
        }
        
        const id = uuidv4();
        user.createForgotpassword({ 
            id: id, 
            active: true 
        });

        //creaate a Sendinblue email client
        const defaultClient = sib.ApiClient.instance;
        const apikey = defaultClient.authentications['api-key'];
        apikey.apikey = process.env.SENDINBLUE_API_KEY;
        const transEmailApi = new sib.TransactionalEmailsApi();

        const sender = {
            email: "bartikabiswas.it.20183052@gmail.com",
            name: "Bartika"
        }
        const receiver = [
            {
                email:{ email } 
            }
        ];
        //Send the password reset email
        await transEmailApi.sendTransacEmail({
            sender,
            to: receiver,
            subject:"Password Reset",
            html: `<a href="http://localhost:3000/password/resetpassword/${id}">Reset password</a>`,
        });

        res.status(200).json({ message: 'Link to reset password sent to your mail' });
    } catch (err){
        res.status(500).json({ error: err.message });
    }       
}


const resetpassword = (req, res) => {
    const id =  req.params.id;
    Forgotpassword.findOne({ where : { id }}).then(forgotpasswordrequest => {
        if(forgotpasswordrequest){
            forgotpasswordrequest.update({ active: false});
            res.status(200).send(`<html>
                                    <script>
                                        function formsubmitted(e){
                                            e.preventDefault();
                                            console.log('called')
                                        }
                                    </script> 

                                    <form action="/password/updatepassword/${id}" method="get">
                                        <label for="newpassword">Enter New password</label>
                                        <input name="newpassword" type="password" required></input>
                                        <button>reset password</button>
                                    </form>
                                </html>`
                                )
            res.end()

        }
    })
}
const updatepassword = (req, res) => {

    try {
        const { newpassword } = req.query;
        const { resetpasswordid } = req.params;
        Forgotpassword.findOne({ where : { id: resetpasswordid }}).then(resetpasswordrequest => {

            //which requested user created Fotrgotpassword db Table,whose userId is here referred
            //when particular user with email approaches for forgot password,then from required email 
            //we find that particular user's id from User db table,and updated password will be stored User table under that particular user's id 
            User.findOne({where: { id : resetpasswordrequest.userId}}).then(user => {
                // console.log('userDetails', user)
                if(user) {
                    //encrypt the password

                    const saltRounds = 10;
                    bcrypt.genSalt(saltRounds, function(err, salt) {
                        if(err){
                            console.log(err);
                            throw new Error(err);
                        }
                        bcrypt.hash(newpassword, salt, function(err, hash) {
                            // Store hash in your password DB.
                            if(err){
                                console.log(err);
                                throw new Error(err);
                            }
                            user.update({ password: hash }).then(() => {
                                res.status(201).json({message: 'Successfuly update the new password'})
                            })
                        });
                    });
            } else{
                return res.status(404).json({ error: 'No user Exists', success: false})
            }
            })
        })
    } catch(error){
        return res.status(403).json({ error, success: false } )
    }

}


module.exports = {
    forgotpassword,
    updatepassword,
    resetpassword
}


      
