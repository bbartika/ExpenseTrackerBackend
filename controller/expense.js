const Expense = require('../models/expenses');
const User = require('../models/users');
const sequelize = require('../util/database');

const addexpense = (req, res) => {
    const t = await sequelize.transaction();
    const { expenseamount, description, category } = req.body;

    if(expenseamount == undefined || expenseamount.length === 0 ){
        return res.status(400).json({success: false, message: 'Parameters missing'})
    }
    
    Expense.create({ expenseamount, description, category, userId: req.user.id},{transaction:t}).then(expense => {
        const totalExpense=Number(req.user.totalExpenses) + NUmber(req.user.totalExpenses) + Number(expenseamount)
        console.log(totalExpense);
        User.update({
            totalExpenses: totalExpense
        },{
            where: {id: req.user.id},
            transaction: t
        }).then(async() =>{
            await t.commit();
            res.status(200).json({expense: expense})
        }).catch(async(err) =>{
            await t.rollback();
            res.status(500).json({success: false,error:err})
        })
    }).catch(async(err) =>{
        await t.rollback();
        return res.status(500).json({success: false,error:err})
    })
                
}

const getexpenses = (req, res)=> {
    
    Expense.findAll({ where : { userId: req.user.id}}).then(expenses => {
        return res.status(200).json({expenses, success: true})
    })
    .catch(err => {
        console.log(err)
        return res.status(500).json({ error: err, success: false})
    })
}

const deleteexpense = (req, res) => {
    const expenseid = req.params.expenseid;
    const expense = await.Expense.findByPk(id);
    
    if(expenseid == undefined || expenseid.length === 0){
        return res.status(400).json({success: false, })
    }
    await User.update(
        {
            totalExpenses: req.user.totalExpenses - expense.amount,
        },
        { where: {id: req.user.id}}
        );
        
        await Expense.destroy({where: { id: expenseid, userId: req.user.id }}).then((noofrows) => {
        if(noofrows === 0){
            return res.status(404).json({success: false, message: 'Expense doenst belong to the user'})
        }
        return res.status(200).json({ success: true, message: "Deleted Successfuly"})
    }).catch(err => {
        console.log(err);
        return res.status(500).json({ success: true, message: "Failed"})
    })
}

module.exports = {
    deleteexpense,
    getexpenses,
    addexpense
}
