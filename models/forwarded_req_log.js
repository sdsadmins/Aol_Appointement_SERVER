const {getRows, insertRow, updateRow, deleteRow} = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/forwarded_req_log.dto');
const _ = require('lodash');

exports.find = async (offset, pageSize) => {
    const query = `SELECT t.id, t.app_id, t.to_email_id, t.req_time, t.forward_by, t.entry_date FROM forwarded_req_log as t`;
    return getRows(query,[offset,pageSize]);
}

exports.findOne = async (id) => {
    const query = `SELECT t.id, t.app_id, t.to_email_id, t.req_time, t.forward_by, t.entry_date FROM forwarded_req_log as t WHERE t.id = ? `;
    return getRows(query,[id]);
}

exports.insert = async (object) => {
    const query = `INSERT INTO forwarded_req_log SET ?`;
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
    let query = `UPDATE forwarded_req_log SET ? WHERE id = ? `;
    updateValues = updateValues.concat([id])
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOne(id) : null;
}

exports.remove = async (id) => {
    const query = `DELETE from forwarded_req_log WHERE id = ? `;
    return deleteRow(query,[id]);
}

exports.count = async () => {
    const query = `SELECT count(*) as total FROM forwarded_req_log t `;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.search = async (offset, pageSize, key) => {
    const query = `SELECT t.id, t.app_id, t.to_email_id, t.req_time, t.forward_by, t.entry_date FROM forwarded_req_log as t WHERE  LOWER(t.app_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.to_email_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.req_time) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.forward_by) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.entry_date) LIKE `+SqlString.escape('%'+key+'%')+` LIMIT ?,?`;
    return getRows(query,[offset, pageSize]);
}

exports.searchCount = async (key) => {
    const query = `SELECT count(*) as total FROM forwarded_req_log t  WHERE  LOWER(t.app_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.to_email_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.req_time) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.forward_by) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.entry_date) LIKE `+SqlString.escape('%'+key+'%')+``;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}


