const { getRows, insertRow, updateRow, deleteRow } = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/appointment_guest');
const _ = require('lodash');

exports.find = async (offset, pageSize) => {
    const query = `SELECT t.id, t.ap_id, t.guest_name, t.guest_contact, t.guest_age, t.guest_photo, t.photo_status, t.admit_status, t.entry_date FROM appointment_guest as t`;
    return getRows(query, [offset, pageSize]);
};

exports.findOne = async (id) => {
    const query = `SELECT t.id, t.ap_id, t.guest_name, t.guest_contact, t.guest_age, t.guest_photo, t.photo_status, t.admit_status, t.entry_date FROM appointment_guest as t WHERE t.id = ?`;
    return getRows(query, [id]);
};

exports.insert = async (object) => {
    const query = `INSERT INTO appointment_guest SET ?`;
    const id = await insertRow(query, object);
    if (id > 0) {
        return this.findOne(id);
    } else {
        return this.findOne(object.id);
    }
};

exports.update = async (id, object) => {
    const updateKeys = [];
    let updateValues = [];

    for (const key in object) {
        if (validationDto.hasOwnProperty(key)) {
            updateKeys.push(`${key}=?`);
            if (_.isNumber(object[key])) {
                updateValues.push(+object[key]);
            } else {
                updateValues.push(`${object[key]}`);
            }
        }
    }

    let query = `UPDATE appointment_guest SET ? WHERE id = ?`;
    updateValues = updateValues.concat([id]);
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOne(id) : null;
};

exports.remove = async (id) => {
    const query = `DELETE FROM appointment_guest WHERE id = ?`;
    return deleteRow(query, [id]);
};

exports.count = async () => {
    const query = `SELECT count(*) as total FROM appointment_guest t`;
    const result = await getRows(query);
    return (result && result[0] && result[0].total) ? result[0].total : 0;
};

exports.search = async (offset, pageSize, key) => {
    const query = `SELECT t.id, t.ap_id, t.guest_name, t.guest_contact, t.guest_age, t.guest_photo, t.photo_status, t.admit_status, t.entry_date 
                   FROM appointment_guest as t 
                   WHERE LOWER(t.ap_id) LIKE ` + SqlString.escape('%' + key + '%') + `
                   OR LOWER(t.guest_name) LIKE ` + SqlString.escape('%' + key + '%') + `
                   OR LOWER(t.guest_contact) LIKE ` + SqlString.escape('%' + key + '%') + `
                   OR LOWER(t.photo_status) LIKE ` + SqlString.escape('%' + key + '%') + `
                   OR LOWER(t.entry_date) LIKE ` + SqlString.escape('%' + key + '%') + `
                   LIMIT ?,?`;
    return getRows(query, [offset, pageSize]);
};

exports.searchCount = async (key) => {
    const query = `SELECT count(*) as total FROM appointment_guest t  
                   WHERE LOWER(t.ap_id) LIKE ` + SqlString.escape('%' + key + '%') + `
                   OR LOWER(t.guest_name) LIKE ` + SqlString.escape('%' + key + '%') + `
                   OR LOWER(t.guest_contact) LIKE ` + SqlString.escape('%' + key + '%') + `
                   OR LOWER(t.photo_status) LIKE ` + SqlString.escape('%' + key + '%') + `
                   OR LOWER(t.entry_date) LIKE ` + SqlString.escape('%' + key + '%') + ``;

    const result = await getRows(query);
    return (result && result[0] && result[0].total) ? result[0].total : 0;
};

exports.findOneByGuestName = async (guestName) => {
    const query = `SELECT t.id, t.ap_id, t.guest_name, t.guest_contact, t.guest_age, t.guest_photo, t.photo_status, t.admit_status, t.entry_date 
                   FROM appointment_guest as t 
                   WHERE t.guest_name = ?`;
    return getRows(query, [guestName]);
};

exports.updatePhotoStatusById = async (id, newStatus) => {
    const query = `UPDATE appointment_guest SET photo_status = ? WHERE id = ?`;
    const result = await updateRow(query, [newStatus, id]);
    return result; // Return the result of the update operation
};

exports.findOneGuest = async (guestId) => {
    const query = `SELECT * FROM appointment_guest WHERE id = ?`;
    console.log("testtt")
    return getRows(query, [guestId]);
};

exports.findByAppointmentId = async (appointmentId) => {
    try {
        const query = 'SELECT * FROM appointment_guest WHERE ap_id = ?';
        const result = await getRows(query, [appointmentId]);
        return result;
    } catch (error) {
        console.error('Error in findByAppointmentId:', error);
        throw error;
    }
};
