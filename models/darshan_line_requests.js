const {getRows, insertRow, updateRow, deleteRow} = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/darshan_line_requests.dto');
const _ = require('lodash');

exports.find = async (offset, pageSize) => {
    const query = `SELECT t.id, t.full_name, t.country_code, t.mobile_no, t.email_id, t.appt_date, t.no_people, t.approve_status, t.created_at, t.updated_at FROM darshan_line_requests as t`;
    return getRows(query,[offset,pageSize]);
}

exports.findOne = async (id) => {
    const query = `SELECT t.id, t.full_name, t.country_code, t.mobile_no, t.email_id, t.appt_date, t.no_people, t.approve_status, t.created_at, t.updated_at FROM darshan_line_requests as t WHERE t.id = ? `;
    return getRows(query,[id]);
}

exports.insert = async (object) => {
    const query = `INSERT INTO darshan_line_requests SET ?`;
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
    let query = `UPDATE darshan_line_requests SET ? WHERE id = ? `;
    updateValues = updateValues.concat([id])
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOne(id) : null;
}

exports.remove = async (id) => {
    const query = `DELETE from darshan_line_requests WHERE id = ? `;
    return deleteRow(query,[id]);
}

exports.count = async () => {
    const query = `SELECT count(*) as total FROM darshan_line_requests t `;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.search = async (offset, pageSize, key) => {
    const query = `SELECT t.id, t.full_name, t.country_code, t.mobile_no, t.email_id, t.appt_date, t.no_people, t.approve_status, t.created_at, t.updated_at FROM darshan_line_requests as t WHERE  LOWER(t.full_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.country_code) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.mobile_no) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.email_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.appt_date) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.no_people) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.approve_status) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.created_at) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.updated_at) LIKE `+SqlString.escape('%'+key+'%')+` LIMIT ?,?`;
    return getRows(query,[offset, pageSize]);
}

exports.searchCount = async (key) => {
    const query = `SELECT count(*) as total FROM darshan_line_requests t  WHERE  LOWER(t.full_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.country_code) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.mobile_no) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.email_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.appt_date) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.no_people) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.approve_status) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.created_at) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.updated_at) LIKE `+SqlString.escape('%'+key+'%')+``;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}


