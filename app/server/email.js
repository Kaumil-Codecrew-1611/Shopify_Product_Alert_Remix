// utils/email.js
// import prisma from './db.server';
// import nodemailer from 'nodemailer';
import generateEmailTemplate from './utils/emailHtml';
import fetchProductWithVariant from './utils/fetchData.js';
export async function sendEmails({ shop, accessToken, emailConfig }) {
    try {
        const productsData = await fetchProductWithVariant(shop, accessToken)
        let products = productsData.filteredData
        // if (products.length === 0) return;
        const htmlContent = generateEmailTemplate(products)
        // const transporter = nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //         user: process.env.EMAIL_ADD,
        //         pass: process.env.EMAIL_PASS,
        //     },
        // });
        // const nameProducts = products.map(item => item.name)
        // const stringOfProjects = nameProducts.join(', ')
        // console.log(emailConfig.email, "emailConfig.email")
        // const mailOptions = {
        //     from: process.env.EMAIL_ADD,
        //     to: emailConfig.email,
        //     subject: 'Product Update',
        //     text: `Product ${stringOfProjects} needs your attention.`,
        //     html: htmlContent
        // };
        // // await transporter.sendMail(mailOptions);
        // console.log("Mail send successfully")
        // await prisma.product.updateMany({
        //     where: { id: { in: products.map(product => product.id) } },
        //     data: { isEmailSent: true, sendMailAt: new Date() },
        // });
    } catch (err) {
        console.log(err, "Error in sending mail")
    }
}
