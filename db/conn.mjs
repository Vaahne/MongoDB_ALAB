import { MongoClient } from "mongodb";
import dotenv from 'dotenv';

dotenv.config();
const connectionStr= process.env.mongoURI;

let client = new MongoClient(connectionStr);

let conn;
try{
    conn = await client.connect();
    console.log("Connection success!!!!");
}catch(err){
    console.error(err);
}

let db = conn.db('sample_training');
// let db = conn.db('sample_restaurants');

export default db;