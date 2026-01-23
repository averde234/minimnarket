import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'ale.verde234@gmail.com',
    pass: 'Gaby--123'
  }
});

transporter.sendMail({
  from: 'tu-correo@gmail.com',
  to: 'ale.verde150@gmail.com',
  subject: 'Prueba SMTP',
  text: 'Este es un correo de prueba'
});