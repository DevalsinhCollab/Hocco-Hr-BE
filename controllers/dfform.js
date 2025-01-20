const DFForm = require("../models/df_form");

exports.addmultidfform = async (req, res) => {
  try {
    const addDF = await DFForm.insertMany(req.body);
    return res.status(200).json(addDF);
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getdfform = async (req, res) => {
  try {
    const dfForm = await DFForm.find({});
    return res.status(200).json(dfForm);
  } catch (error) {
    return res.status(400).json(error);
  }
};
