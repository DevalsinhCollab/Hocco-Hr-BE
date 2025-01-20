const DFStore = require("../models/df_store");

exports.addmultidfs = async (req, res) => {
  try {
    const addDF = await DFStore.insertMany(req.body);
    return res.status(200).json(addDF);
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getdfstore = async (req, res) => {
  try {
    const dFStore = await DFStore.find({});
    return res.status(200).json(dFStore);
  } catch (error) {
    return res.status(400).json(error);
  }
};
