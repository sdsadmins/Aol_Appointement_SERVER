const {getRows, insertRow, updateRow, deleteRow} = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/appointment_location.dto');
const _ = require('lodash');

exports.find = async (offset, pageSize) => {
    const query = `SELECT t.id, t.location_name, t.location_sname, t.status, t.Con, t.cc FROM appointment_location as t`;
    return getRows(query,[offset,pageSize]);
}

// Divya --added on 23 Dec 2024
exports.getFilteredLocations = async (locids) => {
    // console.log("locids",locids);
    const status = "1";
    const query = `SELECT * 
    FROM appointment_location 
    WHERE status = ? 
    AND id IN (${locids.map(() => '?').join(', ')}) 
    ORDER BY location_name`;
    return getRows(query, [status, ...locids]);
}

exports.findOne = async (id) => {
    const query = `SELECT t.id, t.location_name, t.location_sname, t.status, t.Con, t.cc FROM appointment_location as t WHERE t.id = ? `;
    return getRows(query,[id]);
}

exports.insert = async (object) => {
    const query = `INSERT INTO appointment_location SET ?`;
    const id = await insertRow(query, object);
    if(id>0){
        return this.findOne(id);
    }
    else{
        return this.findOne(object.id);
    }
    
}

exports.update = async (id, object) => {
    const updateKeys = [];
    let updateValues = [];
    for (const key in object) {
    if (validationDto.hasOwnProperty(key)) {
        updateKeys.push(`${key}=?`);
         if(_.isNumber(object[key])){
            updateValues.push(+object[key]);
        }else{
            updateValues.push(`${object[key]}`);
        }
        }
    }
    let query = `UPDATE appointment_location SET ? WHERE id = ? `;
    updateValues = updateValues.concat([id])
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOne(id) : null;
}

exports.remove = async (id) => {
    const query = `DELETE from appointment_location WHERE id = ? `;
    return deleteRow(query,[id]);
}

exports.count = async () => {
    const query = `SELECT count(*) as total FROM appointment_location t `;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.search = async (offset, pageSize, key) => {
    const query = `SELECT t.id, t.location_name, t.location_sname, t.status, t.Con, t.cc FROM appointment_location as t WHERE  LOWER(t.location_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.location_sname) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.status) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.Con) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.cc) LIKE `+SqlString.escape('%'+key+'%')+` LIMIT ?,?`;
    return getRows(query,[offset, pageSize]);
}

exports.searchCount = async (key) => {
    const query = `SELECT count(*) as total FROM appointment_location t  WHERE  LOWER(t.location_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.location_sname) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.status) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.Con) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.cc) LIKE `+SqlString.escape('%'+key+'%')+``;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.getAppointmentsByDate = async (userId, apDate, apLocation) => {
    const query = `SELECT * FROM appointment_location WHERE DATE(ap_date) = ? AND user_id = ? AND ap_location = ?`;
    return getRows(query, [apDate, userId, apLocation]);
};

exports.getActiveLocations = async () => {
    const query = `SELECT * FROM appointment_location WHERE status = "1" ORDER BY location_name`;
    return getRows(query);
};
