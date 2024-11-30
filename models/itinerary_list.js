const {getRows, insertRow, updateRow, deleteRow} = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/itinerary_list.dto');
const _ = require('lodash');

exports.find = async (offset, pageSize) => {
    const query = `SELECT t.itinerary_id, t.apex_id, t.itinerary_code, t.event_city, t.event_state, t.from_date, t.to_date, t.visit_purpose, t.point_contact_name, t.point_contact_no, t.itinerary_status, t.entry_date, t.last_modified FROM itinerary_list as t`;
    return getRows(query,[offset,pageSize]);
}

exports.findOne = async (itinerary_id) => {
    const query = `SELECT t.itinerary_id, t.apex_id, t.itinerary_code, t.event_city, t.event_state, t.from_date, t.to_date, t.visit_purpose, t.point_contact_name, t.point_contact_no, t.itinerary_status, t.entry_date, t.last_modified FROM itinerary_list as t WHERE t.itinerary_id = ? `;
    return getRows(query,[itinerary_id]);
}

exports.insert = async (object) => {
    const query = `INSERT INTO itinerary_list SET ?`;
    const id = await insertRow(query, object);
    if(id>0){
        return this.findOne(id);
    }
    else{
        return this.findOne(object.itinerary_id);
    }
    
}

exports.update = async (itinerary_id, object) => {
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
    let query = `UPDATE itinerary_list SET ? WHERE itinerary_id = ? `;
    updateValues = updateValues.concat([itinerary_id])
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOne(itinerary_id) : null;
}

exports.remove = async (itinerary_id) => {
    const query = `DELETE from itinerary_list WHERE itinerary_id = ? `;
    return deleteRow(query,[itinerary_id]);
}

exports.count = async () => {
    const query = `SELECT count(*) as total FROM itinerary_list t `;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.search = async (offset, pageSize, key) => {
    const query = `SELECT t.itinerary_id, t.apex_id, t.itinerary_code, t.event_city, t.event_state, t.from_date, t.to_date, t.visit_purpose, t.point_contact_name, t.point_contact_no, t.itinerary_status, t.entry_date, t.last_modified FROM itinerary_list as t WHERE  LOWER(t.apex_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.itinerary_code) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.event_city) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.event_state) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.from_date) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.to_date) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.visit_purpose) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.point_contact_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.point_contact_no) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.itinerary_status) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.entry_date) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.last_modified) LIKE `+SqlString.escape('%'+key+'%')+` LIMIT ?,?`;
    return getRows(query,[offset, pageSize]);
}

exports.searchCount = async (key) => {
    const query = `SELECT count(*) as total FROM itinerary_list t  WHERE  LOWER(t.apex_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.itinerary_code) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.event_city) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.event_state) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.from_date) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.to_date) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.visit_purpose) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.point_contact_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.point_contact_no) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.itinerary_status) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.entry_date) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.last_modified) LIKE `+SqlString.escape('%'+key+'%')+``;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}


