const _ = require("lodash");
const EmpTemplate = require("../models/template");
const bcrypt = require("bcrypt");
const EmployeeSchema = require("../models/EmployeeModel");
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
          const salt = await bcrypt.genSalt(10);
          const newPass = await bcrypt.hash("123456", salt);

          item.password = newPass;
          item.userType = "HR";
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

exports.getemployees = async (req, res) => {
  try {
    const {
      status,
      signStatus,
      page = 0,
      pageSize = 10,
      empCode,
      search,
    } = req.query;

    const skip = page * pageSize;

    let findObject = { isDelete: "0" };

    if (search) {
      findObject.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { empCode: { $regex: search.trim(), $options: "i" } },
        { signType: { $regex: search.trim(), $options: "i" } },
        { status: { $regex: search.trim(), $options: "i" } },
        { signStatus: { $regex: search.trim(), $options: "i" } },
        { location: { $regex: search.trim(), $options: "i" } },
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
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    async function addDocs(data) {
      const promises = data.map(async (item) => {
        const findDoc = await EmpTemplate.findOne({ empCode: item.empCode })
          .lean()
          .exec();
        return {
          ...item,
          document: findDoc ? findDoc.document : "",
          fileName: findDoc ? findDoc.fileName : "",
        };
      });

      return Promise.all(promises);
    }

    const usersWithDocs = await addDocs(users);

    const total = await EmployeeSchema.countDocuments(findObject);

    return res.status(200).json({
      data: usersWithDocs,
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

    let employeeData = await EmployeeSchema.findByIdAndUpdate(
      id,
      { isDelete: 1 },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
      data: employeeData,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.addDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { document, empCode, fileName } = req.body;

    let employeeData = await EmployeeSchema.findByIdAndUpdate(
      id,
      { status: "Unsent" },
      { new: true }
    );

    await EmpTemplate.create({
      document: document,
      empCode,
      fileName,
    });

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      data: employeeData,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, adhar, phone, birth, gender, name } = req.body;

    let data = {
      email,
      adhar,
      phone,
      birth,
      gender,
      name,
    };

    const updateEmployee = await EmployeeSchema.findByIdAndUpdate(id, data, {
      new: true,
    });

    return res.status(200).json({
      message: "Employee Updated",
      data: updateEmployee,
      success: true,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.changeSignType = async (req, res) => {
  try {
    const { id } = req.params;
    const { signType } = req.body;

    const updateEmployee = await EmployeeSchema.findByIdAndUpdate(
      id,
      { signType },
      { new: true }
    );

    return res.status(200).json({
      error: false,
      message: "Sign Type changed successfully",
      data: updateEmployee,
    });
  } catch (error) {
    console.log(error, "changeSignType error=====");
  }
};

exports.handleEmployeeExcelDownload = async (req, res) => {
  try {
    const { status, signStatus } = req.body;

    if (status !== "") {
      findObject.status = status;
    }

    if (signStatus !== "") {
      findObject.signStatus = signStatus;
    }

    let findObject = { isDelete: "0" };
    const findEmployeeData = await EmployeeSchema.find(findObject)
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
    const { search } = req.body;
    const limit = 5;

    // for searching
    let findObject = {};
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
