const Company = require("../models/company")

exports.createCompany = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        const user = await Company.create({
            name,
            email,
            phone
        });

        return res.status(200).json({ data: user, message: "Company created successfully", error: false });
    } catch (error) {
        return res.status(400).json(error);
    }
};

exports.getCompanies = async (req, res) => {
    try {
        const companies = await Company.find({}).lean().exec();

        return res.status(200).json({ data: companies });
    } catch (error) {
        return res.status(400).json(error);
    }
};

exports.getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;

        const company = await Company.findById(id).lean().exec();

        return res.status(200).json({ data: company });
    } catch (error) {
        return res.status(400).json(error);
    }
};