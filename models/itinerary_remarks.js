const {getRows, insertRow, updateRow, deleteRow} = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/itinerary_remarks.dto');
const _ = require('lodash');

exports.find = async (offset, pageSize) => {
    const query = `SELECT t.remarks_id, t.itinerary_id, t.event_id, t.secretary_remarks, t.sec_id, t.remarks_time FROM itinerary_remarks as t`;
    return getRows(query,[offset,pageSize]);
}

exports.findOne = async (remarks_id) => {
    const query = `SELECT t.remarks_id, t.itinerary_id, t.event_id, t.secretary_remarks, t.sec_id, t.remarks_time FROM itinerary_remarks as t WHERE t.remarks_id = ? `;
    return getRows(query,[remarks_id]);
}

exports.insert = async (object) => {
    const query = `INSERT INTO itinerary_remarks SET ?`;
    const id = await insertRow(query, object);
    if(id>0){
        return this.findOne(id);
    }
    else{
        return this.findOne(object.remarks_id);
    }
    
}

exports.update = async (remarks_id, object) => {
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
    let query = `UPDATE itinerary_remarks SET ? WHERE remarks_id = ? `;
    updateValues = updateValues.concat([remarks_id])
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOne(remarks_id) : null;
}

exports.remove = async (remarks_id) => {
    const query = `DELETE from itinerary_remarks WHERE remarks_id = ? `;
    return deleteRow(query,[remarks_id]);
}

exports.count = async () => {
    const query = `SELECT count(*) as total FROM itinerary_remarks t `;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.search = async (offset, pageSize, key) => {
    const query = `SELECT t.remarks_id, t.itinerary_id, t.event_id, t.secretary_remarks, t.sec_id, t.remarks_time FROM itinerary_remarks as t WHERE  LOWER(t.itinerary_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.event_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.secretary_remarks) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.sec_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.remarks_time) LIKE `+SqlString.escape('%'+key+'%')+` LIMIT ?,?`;
    return getRows(query,[offset, pageSize]);
}

exports.searchCount = async (key) => {
    const query = `SELECT count(*) as total FROM itinerary_remarks t  WHERE  LOWER(t.itinerary_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.event_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.secretary_remarks) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.sec_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.remarks_time) LIKE `+SqlString.escape('%'+key+'%')+``;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}


