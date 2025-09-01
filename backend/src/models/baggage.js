import mongoose from 'mongoose';

const baggageSchema = new mongoose.Schema({
  tagId: {
    type: String,
    unique: true,
    index: true
  },
  flightId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight'
  },
  weight: Number,
  status: {
    type: String,
    enum: [
      'checkin',
      'loaded',
      'inTransit',
      'unloaded',
      'atBelt',
      'lost'
    ],
    default: 'checkin'
  },
  lastLocation: String
}, {
  timestamps: true
});

export default mongoose.model('Baggage', baggageSchema);
