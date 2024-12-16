const EmployeeSchema = require("../models/employee")
const DocumentSchema = require("../models/document")
const UserSchema = require("../models/user");
const { default: mongoose } = require("mongoose");

exports.getDashboardCount = async (req, res) => {
    try {
        const { userId } = req


        const userData = await UserSchema.findById(userId)

        const documentCounts = await DocumentSchema.aggregate([
            {
                $facet: {
                    totalDocuments: [{ $match: { company: new mongoose.Types.ObjectId(userData.company) } }, { $count: "total" }],
                    signedDocuments: [{ $match: { signStatus: "Signed", company: new mongoose.Types.ObjectId(userData.company) } }, { $count: "signed" }],
                    unsignedDocuments: [{ $match: { signStatus: "Unsigned", company: new mongoose.Types.ObjectId(userData.company) } }, { $count: "unsigned" }],
                    inProgressDocuments: [{ $match: { status: "Sent", company: new mongoose.Types.ObjectId(userData.company) } }, { $count: "inProgress" }],
                    completedDocuments: [{ $match: { status: "Completed", company: new mongoose.Types.ObjectId(userData.company) } }, { $count: "completed" }]
                }
            }
        ]).allowDiskUse(true);

        const [documentStats] = documentCounts;
        const employeeCount = await EmployeeSchema.countDocuments({ company: new mongoose.Types.ObjectId(userData.company) });

        return res.status(200).json({
            data: {
                employeeCount,
                documentCount: documentStats.totalDocuments[0]?.total || 0,
                signedDocuments: documentStats.signedDocuments[0]?.signed || 0,
                unSignedCount: documentStats.unsignedDocuments[0]?.unsigned || 0,
                inProgressCount: documentStats.inProgressDocuments[0]?.inProgress || 0,
                completedCount: documentStats.completedDocuments[0]?.completed || 0,
            }
        });
    } catch (error) {
        return res.status(400).json(error);
    }
};
