const _ = require("lodash");
const EmployeeSchema = require("../models/employee");
const DocumentSchema = require("../models/document")
const CompanySchema = require("../models/company");
const UserSchema = require("../models/user");
const { default: mongoose } = require("mongoose");
const phoneNumberRegex = /^\d{10}$/;

exports.createmultiemployees = async (req, res) => {
  try {
    const oldUsers = await EmployeeSchema.find({}).lean().exec();
    const reqBody = _.chunk(req.body, 100);

    const errors = [];
    const invalidEntries = [];
    let newEmployees = [];
    let updatePromises = [];

    const padAdharNumbers = (array) => {
      array.forEach((item) => {
        if (item.adhar && item.adhar.length < 4) {
          item.adhar = item.adhar.padStart(4, "0");
        }
      });
    };

    const findDuplicateEmpCodes = (array) => {
      const empCodeIndexes = {};
      const duplicates = new Set();

      array.forEach((chunk, chunkIndex) => {
        chunk.forEach((item, itemIndex) => {
          padAdharNumbers(chunk);

          const { empCode } = item;
          if (empCode === "") {
            errors.push("Employee code empty in excel");
          } else if (empCodeIndexes[empCode] !== undefined) {
            duplicates.add(empCodeIndexes[empCode]);
            duplicates.add(`${chunkIndex}-${itemIndex}`);
          } else {
            empCodeIndexes[empCode] = `${chunkIndex}-${itemIndex}`;
          }
        });
      });

      return Array.from(duplicates);
    };

    const hasDuplicate = findDuplicateEmpCodes(reqBody);
    if (hasDuplicate.length > 0) {
      errors.push(
        `Duplicate empCode found on entries ${hasDuplicate.join(", ")}`
      );
    }

    const oldEmployeeMap = new Map(
      oldUsers.map((user) => [user.empCode, user])
    );

    for (const chunk of reqBody) {
      for (const item of chunk) {
        if (item.phone && !phoneNumberRegex.test(item.phone)) {
          invalidEntries.push({
            name: item.name,
            empCode: item.empCode,
          });
          continue;
        }

        const existingEmployee = oldEmployeeMap.get(item.empCode);
        if (existingEmployee) {
          const updates = {};
          let needsUpdate = false;

          Object.keys(item).forEach((key) => {
            if (
              existingEmployee[key] !== item[key] &&
              key !== "empCode" &&
              key !== "cc"
            ) {
              updates[key] = item[key];
              needsUpdate = true;
            }
          });

          if (existingEmployee.isDelete == "1") {
            const data = {
              name: item.name,
              email: item.email,
              companyName: item.companyName,
              empCode: item.empCode,
              phone: item.phone,
              cc: item.cc
                ? item.cc.split(",").map((ccItem) => ccItem.trim())
                : [],
              location: item.location,
              status: "Pending",
              adhar: item.adhar,
              birth: item.birth,
              gender: item.gender,
              isDelete: "0",
              signType: "adhar",
            };
            await EmployeeSchema.create(data);
          } else if (existingEmployee.isDelete == "0" && !needsUpdate) {
            errors.push(
              `Employee with empCode ${existingEmployee.empCode} already exists`
            );
          } else {
            let updatedEmployee = await EmployeeSchema.findOneAndUpdate(
              { empCode: item.empCode, isDelete: "0" },
              { $set: updates },
              { new: true }
            ).exec();

            updatePromises.push(updatedEmployee);
          }
        } else {
          // const salt = await bcrypt.genSalt(10);
          // const newPass = await bcrypt.hash("123456", salt);

          // item.password = newPass;
          // item.userType = "HR";
          item.status = "Pending";
          item.isDelete = "0";
          item.signType = "adhar";
          item.cc = item.cc
            ? item.cc.split(",").map((ccItem) => ccItem.trim())
            : [];
          newEmployees.push(item);
        }
      }
    }

    if (invalidEntries.length > 0) {
      errors.push(
        `Employees with these empCodes have invalid phone numbers: ${invalidEntries
          .map((item) => item.empCode)
          .join(", ")}`
      );
    }

    if (newEmployees.length > 0) {
      await EmployeeSchema.insertMany(newEmployees);
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    const getAllEmployees = await EmployeeSchema.find({ isDelete: "0" })
      .lean()
      .exec();

    if (errors.length > 0) {
      return res.status(400).json({ error: true, message: errors.join("; ") });
    }

    return res.status(200).json({
      error: false,
      message: "Employees added successfully",
      data: getAllEmployees,
    });
  } catch (error) {
    return res.status(400).json({
      error: true,
      message: error.message || "An error occurred",
    });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { empCode, phone } = req.body
    const isExist = await EmployeeSchema.find({ empCode });

    if (isExist && isExist.length > 0) {
      return res.status(400).json({
        message: "Employee with Empcode already exists",
        error: true,
      });
    }

    const newEmployee = await EmployeeSchema.create(req.body)


    if (phone && !phoneNumberRegex.test(phone)) {
      return res.status(200).json({
        message: `Invalid Phone Number`,
        error: false,
      });
    }

    return res.status(200).json({
      data: newEmployee,
      message: "Employee created successfully",
      error: false,
    });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

exports.getEmployees = async (req, res) => {
  try {
    const { userId } = req
    const {
      status,
      signStatus,
      page = 0,
      pageSize = 10,
      empCode,
      search,
    } = req.query;


    const userData = await UserSchema.findById(userId)

    const skip = page * pageSize;

    let findObject = { isDelete: "0", company: new mongoose.Types.ObjectId(userData.company) };

    if (search) {
      findObject.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { empCode: { $regex: search.trim(), $options: "i" } },
        { signType: { $regex: search.trim(), $options: "i" } },
        { status: { $regex: search.trim(), $options: "i" } },
        { signStatus: { $regex: search.trim(), $options: "i" } },
        { location: { $regex: search.trim(), $options: "i" } },
        { adhar: { $regex: search.trim(), $options: "i" } },
        { gender: { $regex: search.trim(), $options: "i" } },
        { birth: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (status !== "") {
      findObject.status = status;
    }

    if (signStatus !== "") {
      findObject.signStatus = signStatus;
    }

    if (empCode !== "") {
      findObject.empCode = empCode;
    }

    const users = await EmployeeSchema.find(findObject)
      .sort({ createdAt: -1 })
      .populate("company")
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    const total = await EmployeeSchema.countDocuments(findObject);

    return res.status(200).json({
      data: users,
      total,
      message: "Employee Data Get Successfully",
      error: false,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    let employeeData = await EmployeeSchema.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
      data: employeeData,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, empCode, phone } = req.body;

    if (phone && !phoneNumberRegex.test(phone)) {
      return res.status(200).json({
        message: `Invalid Phone Number`,
        error: false,
      });
    }

    const updatedEmployee = await EmployeeSchema.findByIdAndUpdate(id, req.body, { new: true });

    await DocumentSchema.updateMany({ empCode }, { empName: name, empCode });

    return res.status(200).json({
      data: updatedEmployee,
      message: "Employee updated successfully",
      error: false,
    });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const users = await EmployeeSchema.findById(id)

    const company = await CompanySchema.findById(users.company)

    return res.status(200).json({
      data: { ...users.toObject(), company: { label: company && company.name || "", value: company && company._id || "" } },
      message: "Employee Data Get Successfully",
      error: false,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.changeSignType = async (req, res) => {
  try {
    const { id } = req.params;
    const { signType } = req.body;

    const updatedEmployee = await EmployeeSchema.findByIdAndUpdate(id, { signType }, { new: true });

    return res.status(200).json({
      data: updatedEmployee,
      message: "Employee Sign Type changed successfully",
      error: false,
    });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

exports.handleEmployeeExcelDownload = async (req, res) => {
  try {
    const { userId } = req
    const { status, signStatus } = req.body;

    const userData = await UserSchema.findById(userId)

    let findObject = { company: new mongoose.Types.ObjectId(userData.company) };

    if (status !== "") {
      findObject.status = status;
    }

    if (signStatus !== "") {
      findObject.signStatus = signStatus;
    }

    const findEmployeeData = await EmployeeSchema.find(findObject)
      .populate("company")
      .lean()
      .exec();

    return res.status(200).json({
      error: false,
      message: "Excel downloaded successfully",
      data: findEmployeeData,
    });
  } catch (error) {
    console.log(error, "handleEmployeeExcelDownload error=====");
  }
};

exports.searchEmployees = async (req, res) => {
  try {
    const { userId } = req
    const { search } = req.body;
    const limit = 5;

    const userData = await UserSchema.findById(userId)

    // for searching
    let findObject = { company: new mongoose.Types.ObjectId(userData.company) };
    if (search) {
      findObject.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { empCode: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const employeesData = await EmployeeSchema.find(findObject)
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean()
      .exec();

    return res.status(200).json({
      error: false,
      data: employeesData,
    });
  } catch (error) {
    return res.status(400).json({ error: true, message: error.message });
  }
};

exports.getLatestEmployees = async (req, res) => {
  try {
    const { userId } = req
    const {
      pageSize = 5,
    } = req.query;


    const userData = await UserSchema.findById(userId)

    let findObject = { isDelete: "0", company: new mongoose.Types.ObjectId(userData.company) };

    const users = await EmployeeSchema.find(findObject)
      .sort({ createdAt: -1 })
      .populate("company")
      .limit(pageSize)
      .lean()
      .exec();


    return res.status(200).json({
      data: users,
      message: "Employee Data Get Successfully",
      error: false,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};