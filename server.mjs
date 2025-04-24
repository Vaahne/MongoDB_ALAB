import express from 'express'
import dotenv from "dotenv"
// import db from './db/conn.mjs'
import gradeRoute from './routes/gradeRoutes.mjs'

dotenv.config();
const app= express();
const PORT= process.env.PORT || 3001;

app.use(express.json());
// middleware

// routes
app.use('/',gradeRoute);


// Error handling middleware
app.use((err,req,res,next)=>{
    console.log(err.stack);
    res.status(500).json('Something went wrong');
});
// Listen
app.listen(PORT,(req,res)=>{
    console.log(`Running in port: ${PORT}`);
});