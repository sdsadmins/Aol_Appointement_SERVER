const nodemailer = require('nodemailer');

exports.sendMailer = async (toMail, subject, body) => {
    try {
        // Create transporter object with SMTP server details
        const transporter = nodemailer.createTransport({
            host: process.env.ACCOUNT_SMTP_HOST || 'smtp.hostinger.com',
            port: parseInt(process.env.ACCOUNT_SMTP_PORT || '587'),
            auth: {
                user: process.env.ACCOUNT_EMAIL || 'divine@findmypik.com',
                pass: process.env.ACCOUNT_PASSWD || 'Abjgd##1008',
            }
        });

        // Send email
        const result = await transporter.sendMail({
            from: process.env.ACCOUNT_EMAIL || 'divine@findmypik.com',
            to: toMail,
            subject: subject,
            html: body
        });
        console.log('Email sent successfully:', result);
        
        return result;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error; // Rethrow the error for further handling
    }
};

exports.sendEmail = async (user) => {
    const { full_name, email_id, password } = user;

    try {
        // Load email template (you may want to define this elsewhere)
        const emailTemplate = {
            template_subject: 'Your Login Details',
            template_data: `
                Dear ${full_name},

                Your login details:
                Username: ${email_id}
                Password: ${password}

                Warm Regards,
                Office of Gurudev Sri Sri Ravi Shankar
            `
        };

        // Prepare email content
        const subject = emailTemplate.template_subject;
        const body = emailTemplate.template_data;

        // Send email
        await sendMailer(email_id, subject, body);

        return { message: 'Email sent successfully' };
    } catch (error) {
        console.error('Error in sending email:', error);
        throw error; // Rethrow the error for further handling
    }
};
