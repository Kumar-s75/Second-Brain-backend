import {Server} from "socket.io";

import http from "http";
import { ContentModel } from "./db";


const server=http.createServer();

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "https://second-brain-frontend-two.vercel.app"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const docRooms = new Map();

io.on("connection",(socket)=>{
    console.log("A user connected:",socket.id);

    socket.on("join-document",async({docId,userId})=>{
        socket.join(docId);
        console.log(`User ${userId} joined document ${docId}`);

        let content=docRooms.get(docId);
        if(!content){
            const doc=await ContentModel.findById(docId);
            content=doc?.content||"";
            docRooms.set(docId,content);
        }

        socket.emit("load-document",content);
    });


    socket.on("edit-document",({docId,content})=>{
        docRooms.set(docId,content);

        socket.to(docId).emit("update-document",content);
    });


    socket.on("save-document",async ({docId,content})=>{
       await ContentModel.findByIdAndUpdate(docId,{content});
       console.log(`Document ${docId} saved.`);
    });

    socket.on("disconnect",()=>{
        console.log("User disconnected:",socket.id);
    });


});

server.listen(8080,()=>{
console.log("Websocket server running on port 8080");
});