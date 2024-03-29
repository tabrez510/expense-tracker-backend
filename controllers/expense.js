const Expense = require('../models/expense');
const User = require('../models/user');
const sequelize = require('../utils/database');

exports.createExpense = async (req, res) => {
    const t = await sequelize.transaction();

    try{
        const {amount, description, category} = req.body;
        const expense = await Expense.create({amount, description, category, userId: req.user.id}, {transaction: t});
        const total_expense = Number(req.user.total_expense) + Number(amount);
        await User.update({total_expense}, {
            where: {
                id: req.user.id
            },
            transaction: t
        });
        await t.commit();
        res.json({success: true, ...expense.dataValues});
    } catch(err) {
        await t.rollback();
        console.log(err);
        res.status(500).json({success: false, message: 'Internal Srver Error'});
    }
}

exports.getExpenseById = async (req, res) => {
    const expenseId = req.params.id;
    try {
        const expense = await Expense.findOne({ where: { id: expenseId, userId: req.user.id } });
        if(expense){
            res.json({success: true, ...expense.dataValues});
        } else {
            res.status(404).json({success: false, message: 'Expense Not Found'});
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({success: false, message: 'Internal Server Error'});
    }
}

exports.getExpenses = async (req, res) => {
    try {
        const page = +req.query.page || 1;
        const items_per_page = +req.query.items_per_page || 5;
        let totalItems = await Expense.count({
            where: {
                userId: req.user.id
            }
        });
        const expenses = await Expense.findAll({ 
            where: { 
                userId: req.user.id
            },
            order: [['createdAt', 'DESC']],
            offset: (page-1)*items_per_page,
            limit: items_per_page
        });
        res.json({
            expenses: expenses,
            currentPage: page,
            hasNextPage: items_per_page * page < totalItems,
            nextPage: page + 1,
            hasPreviousPage: page > 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems/items_per_page)
        });
    } catch(err) {
        console.log(err);
        res.json({success: false, message: 'Internal Server Error'});
    }
}

exports.updateExpense = async (req, res) => {
    const expenseId = Number(req.params.id);
    const { amount, description, category } = req.body;
    const t = await sequelize.transaction();

    try {
        const {dataValues: {amount: oldAmount}} = await Expense.findOne({
            where: {
                id: expenseId,
                userId: req.user.id
            }
        })    
        const [rowCount] = await Expense.update(
            { amount, description, category },
            {
                where: {
                    id: expenseId,
                    userId: req.user.id,
                },
                transaction: t
            }
        );

        if (rowCount > 0) {
            const total_expense = Number(req.user.total_expense) - Number(oldAmount) + Number(amount);
            await User.update({total_expense}, {
                where: {
                    id: req.user.id
                },
                transaction: t
            });
            await t.commit();
            res.json({ success: true, ...{ id: expenseId, amount, description, category } });
        } else {
            await t.rollback();
            res.status(404).json({ success: false, message: 'Expense Not Found' });
        }
    } catch (err) {
        await t.rollback();
        console.log(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.deleteExpense = async (req, res) => {
    const expenseId = req.params.id;
    const t = await sequelize.transaction();

    try {
        const expenseById = await Expense.findOne({ where: { id: expenseId, userId: req.user.id }});
        const deletedRows = await Expense.destroy({
            where: {
                id: expenseId,
                userId: req.user.id,
            },
            transaction: t
        });

        if (deletedRows > 0) {
            const total_expense = Number(req.user.total_expense) - Number(expenseById.amount);
            await User.update({total_expense}, {
                where: {
                    id: req.user.id,
                },
                transaction: t
            });
            await t.commit();
            res.json({ success: true, ...expenseById.dataValues });
        } else {
            await t.rollback();
            res.status(404).json({ success: false, message: 'Expense Not Found' });
        }
    } catch (err) {
        await t.rollback();
        console.log(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

