import {Request, Response} from "express";
import express from 'express'
import nodemailer from 'nodemailer'
import cors from 'cors'
import dotenv from 'dotenv'
import path from "path";
import fs from 'fs'
import * as handlebars from "handlebars";

dotenv.config()

const app = express()
const port = 3003

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.options('*', cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const filePath = path.join(__dirname, '..', 'src/common/templateHtml.html')
const fileContent = fs.readFileSync(filePath, 'utf8')
const template = handlebars.compile(fileContent)

/**
 * Тестовый запрос для проверки работы сервера.
 */
app.get('/', (req: Request, res: Response) => {
    try {
        res.status(200).send('Server started!')
    } catch (e) {
        console.error(e);
        res.status(500).send({error: 'Server not response!'});
    }
})

/**
 * запрос на отправку письма
 */
app.post('/send-email', async (req: Request, res: Response) => {

    try {
        //объект с входящими данными на сервер
        const {email, name, message} = req.body

        //валидация почты
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

        //проверка валидности почты
        if (!emailRegex.test(email)) {
            res.status(400).send({error: 'Email error!'})
            return;
        }

        //валидация имени
        const nameRegex = /^[a-zA-Zа-яА-ЯёЁ ]{1,20}$/
        if (name && !nameRegex.test(name)) {
            res.status(400).send({error: 'Name error!'})
            return;
        }

        //передача данных в файл common/templateHtml.html для настройки полученного письма.
        const html = template({name, email, message})

        //настройка транспорта
        const transporter = nodemailer.createTransport({
            host: 'smtp.yandex.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        })

        //настройка почтового отправления
        const mailOptions = {
            from: process.env.EMAIL,
            to: process.env.EMAIL,
            subject: 'Портфолио',
            html: html
        }

        //ответ на запрос /send-email
        await transporter.sendMail(mailOptions)

        //возврат положительного отвтета
        res.status(200).json({message: 'Ok!'})

    } catch (e) {
        console.error(e);
        res.status(500).send({error: 'Some error occurred!'});
    }

})

app.listen(port, () => {
    console.log(`Server started on ${port} port`)
})