const Sequelize = require('sequelize')

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     database: 'nodetutorial',
//     password: 'apple@17'
// });

const sequelize = new Sequelize('node-expense', 'root', '1234',{
    dialect: 'mysql',
    host: 'localhost'
})

module.exports = sequelize;
