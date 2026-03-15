const Counter = require("../models/Counter");

async function getNextSequence(sequenceName, session = undefined) {
  const updated = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true, session }
  ).lean();

  return updated.seq;
}

module.exports = {
  getNextSequence,
};
