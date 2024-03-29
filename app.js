const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const sequelize = require('./utils/database');
const userRoutes = require('./routes/user');
const expenseRoutes = require('./routes/expense');
const purchaseRoutes = require('./routes/purchase');
const premiumFeaturesRoutes = require('./routes/premiumFeatures');
const passwordRoutes = require('./routes/resetpassword');
const user = require('./models/user');
const expense = require('./models/expense');
const order = require('./models/orders');
const forgotpassword = require('./models/forgotpassword');
const reportURL = require('./models/reportURL');

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    {flags: 'a'}
);

const app = express();

app.use(cors());

app.use(morgan('combined', {stream: accessLogStream}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/api/user', userRoutes);
app.use('/api/user', expenseRoutes);
app.use('/api/user', purchaseRoutes);
app.use('/api/premium', premiumFeaturesRoutes);
app.use('/api/password', passwordRoutes);

app.use((req, res) => {
    res.sendFile(path.join(__dirname, `public/${req.url}`))
})
 
user.hasMany(expense);
expense.belongsTo(user);

user.hasMany(order);
order.belongsTo(user);

user.hasMany(forgotpassword);
forgotpassword.belongsTo(user);

user.hasMany(reportURL);
reportURL.belongsTo(user);

sequelize
    .sync({force: false})
    .then((res) => {
        app.listen(PORT);
    })
    .catch((err) => {
        console.log(err);
    })