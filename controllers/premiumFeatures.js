const PDFDocument = require('pdfkit');
const stream = require('stream');

const User = require('../models/user');
const reportURL = require('../models/reportURL');
const userServices = require('../services/userServices')
const S3services = require('../services/S3services');

function formatCreatedAt(createdAtString) {
    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'Asia/Kolkata',
      hour12: false,
    };

    const formattedCreatedAt = new Intl.DateTimeFormat('en-US', options).format(new Date(createdAtString));

    return formattedCreatedAt;
}

const getUserLeaderboard = async(req, res) => {
    try {
        const getUserLeaderboard = await User.findAll({
            attributes: ['name', 'total_expense'],
            order: [['total_expense', 'DESC']]
        });
        console.log(getUserLeaderboard);
        res.json([...getUserLeaderboard.map((user) => user.dataValues)]);
    } catch(err) {
        res.status(500).json({success: false, message: 'Internal Server Error'});
    }
}

const downloadExpense = async(req, res) => {
    try {
        const expenses = await userServices.getExpenses(req);
        
        // Create a new PDF document
        const doc = new PDFDocument();
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(buffers);
            
            // Stream the PDF buffer to S3
            const pdfStream = new stream.PassThrough();
            pdfStream.end(pdfBuffer);
            const userId = req.user.id;
            const filename = `Expenses${userId}/${formatCreatedAt(new Date().toISOString())}.pdf`;
            const fileURL = await S3services.uploadToS3(pdfStream, filename);
            await reportURL.create({Url: fileURL, userId: req.user.id});
            
            res.status(200).json({ success: true, fileURL });
        });

        // Set table headers
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Amount', 50, 50);
        doc.text('Description', 150, 50);
        doc.text('CreatedAt', 300, 50)
        doc.text('Category', 450, 50);

        // Add expenses data to the PDF document
        doc.font('Helvetica').fontSize(10);
        let y = 70;
        expenses.forEach(expense => {
            doc.text(`${expense.amount}`, 50, y);
            doc.text(`${expense.description || ''}`, 150, y);
            doc.text(`${formatCreatedAt(expense.createdAt) || ''}`, 300, y);
            doc.text(`${expense.category || ''}`, 450, y);
            y += 20;
        });

        // Finalize the PDF document
        doc.end();
    } catch(err) {
        console.error('Error generating and uploading PDF:', err);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
}

const getReportFiles = async(req, res) => {
    try {
        const reportFiles = await reportURL.findAll({
            where: {
                userId: req.user.id
            },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json([...reportFiles.map((file) => file.dataValues)])
    } catch(err) {
        res.status(500).json({success: false, message: 'Internal Server Error'});
    }
}

module.exports = {
    getUserLeaderboard,
    downloadExpense,
    getReportFiles
}








// previous code


// const users = await User.findAll({
    // attributes: ['id', 'name', [sequelize.fn('sum', sequelize.col('expenses.amount')), 'total_expense']],
    // include: [
    //     {
    //         model: Expense,
    //         attributes: []
    //     }
    // ],
    // group: ['User.id'],
//     order: [['total_expense', 'DESC']]
// });
// const userAggregatedExpenses = await Expense.findAll({
//     attributes: ['userId', [sequelize.fn('sum', sequelize.col('expense.amount')), 'total_expense']],
//     group: ['userId']
// });

// const userAggregatedExpenses = {};

// expenses.forEach((expense) => {
//     if(userAggregatedExpenses[expense.userId]){
//         userAggregatedExpenses[expense.userId] += expense.amount;
//     } else {
//         userAggregatedExpenses[expense.userId] = expense.amount;
//     }
// });

// const userLeaderboardDetails = [];
// users.forEach((user) => {
//     userLeaderboardDetails.push({name: user.name, total_expense: expenses.total_expense || 0});
// });

// userLeaderboardDetails.sort((b, a) => a.total_expense - b.total_expense);
// console.log(userLeaderboardDetails);