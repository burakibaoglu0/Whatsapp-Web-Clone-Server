const express = require('express')
const socketio = require('socket.io')
const bodyParser = require("body-parser")
var cors = require("cors")
const fs = require('fs')
const _ = require("lodash")
const {
    Client
} = require('whatsapp-web.js');
const app = express()
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
const http = require('http')
const server = http.createServer(app)
const PORT = process.env.PORT || 8081

const io = socketio(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"]
    }
})


const SESSION_FILE_PATH = './session.json';

let sessionData;


server.listen(PORT, () => {

    io.on('connection', socket => {

        if (fs.existsSync(SESSION_FILE_PATH)) {
            sessionData = require(SESSION_FILE_PATH);
            const client = new Client({
                session: sessionData
            });
            client.on('ready', () => {
                console.log('Client is ready!');
                socket.emit("GET_LOGIN_STATUS", true)

                client.getProfilePicUrl(`${client.info.me._serialized}`).then(url => {
                    socket.emit("GET_PROFILE_PICTURE_URL", url);
                }).catch(e => console.error({
                    e
                }))

                client.getContactById(`${client.info.me._serialized}`).then(id => {
                    socket.emit("GET_USER_NUMBER", id.number)
                })

                client.getContacts().then(contacts => {
                    socket.emit("GET_CONTACTS", contacts)
                })

                app.post('/getpictureurl',(req,res)=>{
                    client.getProfilePicUrl(req.body.data).then(url => {
                        res.send(url)
                    }).catch(e => console.error({e}));
                })

                socket.emit("GET_USER_NAME", client.info.pushname)

                client.getChats().then(chats => {

                    for(let chat of chats){
                        chat.fetchMessages().then(messages => {
                           // console.log({messages})
                        })
                    }

                })


            });

            client.initialize();

        } else {
            const client = new Client();
            var qrCode = "";
            client.on('qr', qr => {
                qrCode = qr;
                socket.emit("GET_QR_CODE", qrCode)
            });

            client.on('ready', () => {
                console.log('Client is ready!');
                socket.emit("GET_LOGIN_STATUS", true)

                client.getProfilePicUrl(`${client.info.me._serialized}`).then(url => {
                    socket.emit("GET_PROFILE_PICTURE_URL", url);
                }).catch(e => console.error({
                    e
                }))

                client.getContactById(`${client.info.me._serialized}`).then(id => {
                    socket.emit("GET_USER_NUMBER", id.number)
                })

                client.getContacts().then(contacts => {
                    socket.emit("GET_CONTACTS", contacts)
                })

                app.post('/getpictureurl',(req,res)=>{
                    client.getProfilePicUrl(req.body.data).then(url => {
                        res.send(url)
                    }).catch(e => console.error({e}));
                })

                socket.emit("GET_USER_NAME", client.info.pushname)

                client.getChats().then(chats => {

                    for(let chat of chats){
                        chat.fetchMessages().then(messages => {
                            //console.log({messages})
                        })
                    }

                })

                
            });

            var login_status = false;

            let isSaveSession = false;

            socket.on("IS_SAVE_SESSION", (data) => {
                isSaveSession = data;
            });

            client.on('authenticated', (session) => {
                login_status = true;
                socket.emit("GET_LOGIN_STATUS", login_status)
                if (isSaveSession) {
                    sessionData = session;
                    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
                        if (err) {
                            console.error(err);
                        }
                    });
                }
            });

            client.initialize();
        }
    })
});