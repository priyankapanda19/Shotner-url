const express=require('express');
const mongoose=require('mongoose');
const route=require('./routes/route')
const app=express();

app.use(express.json());

mongoose.connect("mongodb+srv://Priyanka19:G8reXRlHUbBX65ev@plutonium01.9fxu8wj.mongodb.net/group59Database",{
    useNewUrlParser:true
})
  .then(()=>console.log("mongoDB is connected .........."))
  .catch((err)=>console.log(err))

app.use('/',route)

const PORT=3000;
app.listen(PORT,()=>{
    console.log(`Express is running on ${PORT}`)
})