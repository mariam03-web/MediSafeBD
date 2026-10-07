const express=require("express");const cors=require("cors");const app=express();app.use(cors());app.use(express.json());
const patients=[{id:"MSBD-P-10001",name:"Demo Patient",problem:""}];
app.get("/api/health",(req,res)=>res.json({status:"ok",service:"MediSafe BD backend"}));
app.get("/api/patients",(req,res)=>res.json(patients));
app.get("/api/patients/:id",(req,res)=>{const p=patients.find(x=>x.id===req.params.id);if(!p)return res.status(404).json({message:"Patient not found"});res.json(p)});
app.post("/api/patients/:id/health-problem",(req,res)=>{const p=patients.find(x=>x.id===req.params.id);if(!p)return res.status(404).json({message:"Patient not found"});p.problem=String(req.body.problem||"");res.json(p)});
app.listen(3000,()=>console.log("MediSafe BD backend running at http://localhost:3000"));
