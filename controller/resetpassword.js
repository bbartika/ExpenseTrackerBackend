
 require mailer, UUID token and hashing libraries
 const Brevo = require('sib-api-v3-sdk');  //require('@getbrevo/brevo')
 const {v4:uuidv4} = require('uuid');       
 const bcrypt = require('bcrypt'); 
 const path = require('path');        

 const Resetpassword = require('../models/password-model');
 const User = require('../models/user-model')

 require('dotenv').config();                       //access environment variables
 const brevoAPIKey = process.env.BREVO_API_KEY;

 //API to send mail for forgot password
 const forgotPasswordMail = async(req, res) =>{
     try{
         const user = await User.findOne({where:{email:req.body.email}});
        
         if(!user) return res.status(400).json({status:"Fail", message:"Email not found"});

         const id = uuidv4();
         Resetpassword.create({id, userId: user.id, active:true});

         //create a brevo instance
        const defaultClient = await Brevo.ApiClient.instance;
         var apiKey = defaultClient.authentications['api-key']; //isapi-key an argument?
         apiKey.apiKey = brevoAPIKey;
         const transEmailApi = new Brevo.TransactionalEmailsApi();

         await Promise.all([apiKey, transEmailApi]);

         const path = `http://localhost:3000/password/forgotPassword/${id}`;

       const sender = {
       email: "arvidce@gmail.com",
       name: "Code Keshri",
       };
       const receivers = [req.body];

       await transEmailApi.sendTransacEmail({
       sender,
       to: receivers,
       subject: "Reset Password",
       textContent: "Click here to reset your password",
       htmlContent: `<a href="${path}">Click Here</a> to reset your password!`,
       });

      res .status(200).json({ status: "Success", message: "Password reset email sent successfully!" });
    
     } catch (error) {
        console.error(error)
       }
     
 };





 const createNewPassword = async(req, res) =>{

   try{
   const createPasswordUUID = await Resetpassword.findOne({where:{id: req.params.id}})
  if(!createPasswordUUID)return res.status(400).json({status:"failed", message:"Invalid Link"})
  
   const passwordPath = path.join(__dirname,'..','views', 'password.html');
   return res.status(200).sendFile(passwordPath);

   }catch(err){
     console.log(err)
  }

 }





 const postNewPassword = async(req, res) =>{
  const { id } = req.params;
   const {password, confirmpassword} = req.body;      //can we get that id thru body too?  //is it necessary to check password and confirmpasswords are same here also, already have checked in frontend
   const t = await sequelize.transaction();
  
   try{
     const row = await Resetpassword.findOne({where:{id: id}}, {transaction: t});

     if(!row.active){
       await t.commit();
      return res.status(400).send({status: "Failed", message: "Expired Link"});
     }

     const hashedPassword = bcrypt.hashSync(password, 10);

     const updatedPassword = Resetpassword.update({active:false}, {where:{id:id}}, {transaction: t})

     const updatedUser = User.update({password: hashedPassword}, {where:{id: row.userId}}, {transaction: t})

     await Promise.all([updatedPassword, updatedUser]);
     await t.commit();
     res.status(200).send({status:"Success", message: "Password updated successfully"});

   }catch(err){
     t.rollback();
     console.log(err);
   }


 }

   
 module.exports = {
   forgotPasswordMail,
   createNewPassword,
   postNewPassword
}

