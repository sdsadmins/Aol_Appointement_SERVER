const {getRows, insertRow, updateRow, deleteRow} = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/qr_scan_logs.dto');
const _ = require('lodash');

exports.find = async (offset, pageSize) => {
    const query = `SELECT t.id, t.ap_id, t.ap_date, t.ap_time, t.people, t.venue, t.scanned_at, t.scanned_by, t.scan_status FROM qr_scan_logs as t`;
    return getRows(query,[offset,pageSize]);
}

exports.findOne = async (id) => {
    const query = `SELECT t.id, t.ap_id, t.ap_date, t.ap_time, t.people, t.venue, t.scanned_at, t.scanned_by, t.scan_status FROM qr_scan_logs as t WHERE t.id = ? `;
    return getRows(query,[id]);
}

exports.insert = async (object) => {
    const query = `INSERT INTO qr_scan_logs SET ?`;
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
    let query = `UPDATE qr_scan_logs SET ? WHERE id = ? `;
    updateValues = updateValues.concat([id])
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOne(id) : null;
}

exports.remove = async (id) => {
    const query = `DELETE from qr_scan_logs WHERE id = ? `;
    return deleteRow(query,[id]);
}

exports.count = async () => {
    const query = `SELECT count(*) as total FROM qr_scan_logs t `;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.search = async (offset, pageSize, key) => {
    const query = `SELECT t.id, t.ap_id, t.ap_date, t.ap_time, t.people, t.venue, t.scanned_at, t.scanned_by, t.scan_status FROM qr_scan_logs as t WHERE  LOWER(t.ap_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.ap_date) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.ap_time) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.people) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.venue) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.scanned_at) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.scanned_by) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.scan_status) LIKE `+SqlString.escape('%'+key+'%')+` LIMIT ?,?`;
    return getRows(query,[offset, pageSize]);
}

exports.searchCount = async (key) => {
    const query = `SELECT count(*) as total FROM qr_scan_logs t  WHERE  LOWER(t.ap_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.ap_date) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.ap_time) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.people) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.venue) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.scanned_at) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.scanned_by) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.scan_status) LIKE `+SqlString.escape('%'+key+'%')+``;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}


