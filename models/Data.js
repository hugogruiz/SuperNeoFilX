import mongoose from "mongoose";

const DataSchema = new mongoose.Schema({
  Temp: Number,
  Termino: Boolean,
  Comenzar: Boolean,
  fecha: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Data || mongoose.model("Data", DataSchema);
