const {getRows, insertRow, updateRow, deleteRow} = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/itinerary_event.dto');
const _ = require('lodash');

exports.find = async (offset, pageSize) => {
    const query = `SELECT t.id, t.itinerary_id, t.event_date, t.event_time, t.event_name, t.venue_name, t.order_no FROM itinerary_event as t`;
    return getRows(query,[offset,pageSize]);
}

exports.findOne = async (id) => {
    const query = `SELECT t.id, t.itinerary_id, t.event_date, t.event_time, t.event_name, t.venue_name, t.order_no FROM itinerary_event as t WHERE t.id = ? `;
    return getRows(query,[id]);
}

exports.insert = async (object) => {
    const query = `INSERT INTO itinerary_event SET ?`;
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
    let query = `UPDATE itinerary_event SET ? WHERE id = ? `;
    updateValues = updateValues.concat([id])
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOne(id) : null;
}

exports.remove = async (id) => {
    const query = `DELETE from itinerary_event WHERE id = ? `;
    return deleteRow(query,[id]);
}

exports.count = async () => {
    const query = `SELECT count(*) as total FROM itinerary_event t `;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.search = async (offset, pageSize, key) => {
    const query = `SELECT t.id, t.itinerary_id, t.event_date, t.event_time, t.event_name, t.venue_name, t.order_no FROM itinerary_event as t WHERE  LOWER(t.itinerary_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.event_date) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.event_time) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.event_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.venue_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.order_no) LIKE `+SqlString.escape('%'+key+'%')+` LIMIT ?,?`;
    return getRows(query,[offset, pageSize]);
}

exports.searchCount = async (key) => {
    const query = `SELECT count(*) as total FROM itinerary_event t  WHERE  LOWER(t.itinerary_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.event_date) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.event_time) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.event_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.venue_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.order_no) LIKE `+SqlString.escape('%'+key+'%')+``;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}


