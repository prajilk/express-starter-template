const {Schema,model,models}=require('mongoose');

const userSchema=new Schema({
fullname:String,
email:String,
password:String
});

module.exports=models.User || model('User',userSchema);