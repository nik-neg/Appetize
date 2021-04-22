const db = require('./db');

const DishSchema = new db.mongoose.Schema({
  title: String,
  image: { data: Buffer, contentType: String }, // chunnks(fk:files) - files
  description: String, // limitation to x char ?
  isSelfCoocked: Boolean,
});

const DishModel = db.mongoose.model('Dish', DishSchema);

module.exports = DishModel;
