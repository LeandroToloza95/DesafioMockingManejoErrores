import express from 'express';
import productsRouter from './routes/products.router.js';
import cartRouter from './routes/cart.router.js';
import usersRouter from './routes/users.router.js';
import sessionRouter from './routes/sessions.router.js';
import ticketRouter from './routes/tickets.router.js';
import mockingRouter from './routes/mocking.router.js';
import __dirname from './utils.js';
import { engine } from 'express-handlebars';
import viewsRouter from './routes/views.router.js'
import {Server} from 'socket.io';
import "./dao/config.js";
import cookieParser, { signedCookie } from 'cookie-parser';
import session from 'express-session'
import FileStore from "session-file-store"
import MongoStore from 'connect-mongo';
import passport from 'passport';
import './passport.js';
import config from "./config.js";

const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'))

const secret = '123456'
app.use(cookieParser(secret))

//session file
// const fileStore = FileStore(session)
// app.use(session({
//     secret: "SESSIONSECRETKEY",
//     cookie:{maxAge: 60*60*1000},
//     store:new fileStore({
//         path: __dirname+"/sessions"
//     })
// }))

//session mongo
app.use(session({
    secret: config.jwt_secret,
    cookie:{maxAge: 60*60*1000},
    store:new MongoStore({
        mongoUrl:config.mongo_uri,
    })
}))

//passport
app.use(passport.initialize());
app.use(passport.session());

//handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');

//routes
app.use('/api/products', productsRouter)
app.use('/api/users', usersRouter)
app.use('/api/carts', cartRouter)
app.use('/api/sessions',sessionRouter)
app.use('/api/tickets',ticketRouter)
app.use('/api/mocking',mockingRouter)

//render handlebars
app.use('/api/views',viewsRouter)

//cookies
app.get('/set-cookie', (req,res)=>{
    res.cookie('idioma','ingles').json({msg:'ok'})
})

app.get('/get-cookie', (req,res)=>{
    console.log(req.cookies);
    const {idioma} = req.cookies
    idioma ==='ingles' ? res.send('Hello!') : res.send('Hola!')
    
})

app.get('/setsignedcookie', (req,res)=>{
    res.cookie('name','Leandro',{signed:true}).json({msg:'ok'})
})

app.get('/getsignedcookie', (req,res)=>{
    res.json({
        cookies: req.cookies,
        signedCookies:req.signedCookies
    })
    /*
    console.log(req.cookies);
    const {idioma} = req.cookies
    idioma ==='ingles' ? res.send('Hello!') : res.send('Hola!')
    */
})

app.get('/deletecookie', (req,res)=>{
    res.clearCookie('name').send('idioma eliminado')
    
})

const httpServer = app.listen(8080, () => console.log("Servidor 8080 escuchando"))

//Websocket - desde lado servidor
const socketServer = new Server(httpServer);

//connection - disconnect
const names = [];
const messages = [];
socketServer.on('connection',(socket)=>{
    console.log(`Cliente conectado: ${socket.id}`);
    socket.on("disconnect",()=>{
        console.log(`Cliente desconectado: ${socket.id}`)
    })

    socket.on('firstEvent',(info)=>{
        names.push(info)
        console.log(`Array: ${names}`);
        socket.emit('secondEvent',names)
        socketServer.emit('secondEvent',names)
        socketServer.broadcast.emit('secondEvent',names)
        socketServer.emit('secondEvent',info)
    })
    }
    
);

socketServer.on('connection',(socket)=>{
    socket.on('newProduct',(user)=>{
        socket.broadcast.emit('newUserBroadcast',user)
    });

    socket.on('message',(info)=>{
        messages.push(info)
        socketServer.emit('chat',messages)
    })
})

