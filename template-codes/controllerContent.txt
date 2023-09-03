const User=require('../models/User');

module.exports={
SomeUserFunction:async(req,res,next)=>{
return new Promise((resolve, reject)=>{
resolve('Some user function');
})
}
}