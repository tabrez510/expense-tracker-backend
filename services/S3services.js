const AWS = require('aws-sdk');

function uploadToS3 (data, filename){

    let s3Bucket = new AWS.S3({
        accessKeyId: process.env.IAM_USER_KEY,
        secretAccessKey: process.env.IAM_USER_SECRET,
    })

    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: filename,
        Body: data,
        ContentType: 'application/pdf',
        ACL: 'public-read'
    };
    return new Promise((resolve, reject) => {
        s3Bucket.upload(params, (err, data) => {
            if (err) {
                console.error('Error uploading to S3:', err);
                reject(err);
            } else {
                console.log('Uploaded to S3 successfully:', data);
                resolve(data.Location);
            }
        });
    });
}

module.exports = {
    uploadToS3
}