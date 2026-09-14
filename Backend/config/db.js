const mongoose=require("mongoose");
require("dotenv").config();

const dbconnect = async()=>{
    try{
        const connectioninstance=await mongoose.connect(process.env.MONGODB_URI);
        console.log(`db connected succesfully ${connectioninstance.connection.host}`)
    }
    catch(err)
    {
        console.log(err,"error connecting database");
        process.exit(1);
    }
}

module.exports=dbconnect;