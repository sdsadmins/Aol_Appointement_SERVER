const { getRows, insertRow, updateRow, deleteRow } = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/appointment_request.dto');
const _ = require('lodash');

// exports.find = async (offset, pageSize) => {
//     const query = `SELECT t.id, t.ap_id, t.user_id, t.for_ap, t.full_name, t.email_id, t.country_code, t.mobile_no, t.ref_name, t.ref_country_code, t.ref_mobile_no, t.ref_email_id, t.ap_location, t.app_visit, t.city, t.state, t.country, t.designation, t.designationcomp, t.meet_purpose, t.meet_subject, t.no_people, t.no_people_partial, t.from_date, t.to_date, t.tags, t.attachment, t.attachment_url, t.picture, t.secretary_note, t.gurudev_remark, t.assign_to, t.assign_to_fill, t.assigned_by, t.ap_date, t.ap_time, t.star_rate, t.ap_status, t.check_in_status, t.darshan_line, t.backstage_status, t.deleted_app, t.entry_date_time, t.position_order, t.darshan_line_email, t.entry_date, t.mtype, t.zoom_link, t.access_token, t.venue, t.join_url, t.password, t.travelled, t.from_where, t.currently_doing, t.dop, t.selCountry, t.selState, t.selCity, t.toa, t.curr_loc, t.email_status, t.tcode, t.taughtCourses, t.more_info, t.admit_status, t.admitted_by, t.no_people_names, t.no_people_numbers, t.no_people_eleven_details, t.send_schedule, t.arrival_time, t.schedule_date, t.schedule_time, t.schedule_send_status, t.stay_avail FROM appointment_request as t`;
//     return getRows(query,[offset,pageSize]);
// }

exports.find = async (userId, offset, pageSize) => {
    const query = `SELECT t.id, t.ap_id, t.user_id, t.for_ap, t.full_name, t.email_id, t.country_code, t.mobile_no, t.ref_name, t.ref_country_code, t.ref_mobile_no, t.ref_email_id, t.ap_location, t.app_visit, t.city, t.state, t.country, t.designation, t.designationcomp, t.meet_purpose, t.meet_subject, t.no_people, t.no_people_partial, t.from_date, t.to_date, t.tags, t.attachment, t.attachment_url, t.picture, t.secretary_note, t.gurudev_remark, t.assign_to, t.assign_to_fill, t.assigned_by, t.ap_date, t.ap_time, t.star_rate, t.ap_status, t.check_in_status, t.darshan_line, t.backstage_status, t.deleted_app, t.entry_date_time, t.position_order, t.darshan_line_email, t.entry_date, t.mtype, t.zoom_link, t.access_token, t.venue, t.join_url, t.password, t.travelled, t.from_where, t.currently_doing, t.dop, t.selCountry, t.selState, t.selCity, t.toa, t.curr_loc, t.email_status, t.tcode, t.taughtCourses, t.more_info, t.admit_status, t.admitted_by, t.no_people_names, t.no_people_numbers, t.no_people_eleven_details, t.send_schedule, t.arrival_time, t.schedule_date, t.schedule_time, t.schedule_send_status, t.stay_avail 
                  FROM appointment_request as t
                  WHERE t.user_id = ? 
                  LIMIT ?, ?`;

    return getRows(query, [userId, offset, pageSize]);
};


exports.findOne = async (id) => {
    const query = `SELECT t.id, t.ap_id, t.user_id, t.for_ap, t.full_name, t.email_id, t.country_code, t.mobile_no, t.ref_name, t.ref_country_code, t.ref_mobile_no, t.ref_email_id, t.ap_location, t.app_visit, t.city, t.state, t.country, t.designation, t.designationcomp, t.meet_purpose, t.meet_subject, t.no_people, t.no_people_partial, t.from_date, t.to_date, t.tags, t.attachment, t.attachment_url, t.picture, t.secretary_note, t.gurudev_remark, t.assign_to, t.assign_to_fill, t.assigned_by, t.ap_date, t.ap_time, t.star_rate, t.ap_status, t.check_in_status, t.darshan_line, t.backstage_status, t.deleted_app, t.entry_date_time, t.position_order, t.darshan_line_email, t.entry_date, t.mtype, t.zoom_link, t.access_token, t.venue, t.join_url, t.password, t.travelled, t.from_where, t.currently_doing, t.dop, t.selCountry, t.selState, t.selCity, t.toa, t.curr_loc, t.email_status, t.tcode, t.taughtCourses, t.more_info, t.admit_status, t.admitted_by, t.no_people_names, t.no_people_numbers, t.no_people_eleven_details, t.send_schedule, t.arrival_time, t.schedule_date, t.schedule_time, t.schedule_send_status, t.stay_avail FROM appointment_request as t WHERE t.id = ? `;
    return getRows(query, [id]);
}

exports.insert = async (object) => {
    const query = `INSERT INTO appointment_request SET ?`;
    const id = await insertRow(query, object);
    if (id > 0) {
        return this.findOne(id);
    }
    else {
        return this.findOne(object.id);
    }

}

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
    let query = `UPDATE appointment_request SET ? WHERE id = ? `;
    updateValues = updateValues.concat([id])
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOne(id) : null;
}

exports.remove = async (id) => {
    const query = `DELETE from appointment_request WHERE id = ? `;
    return deleteRow(query, [id]);
}

exports.count = async () => {
    const query = `SELECT count(*) as total FROM appointment_request t `;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.search = async (offset, pageSize, key) => {
    const query = `SELECT t.id, t.ap_id, t.user_id, t.for_ap, t.full_name, t.email_id, t.country_code, t.mobile_no, t.ref_name, t.ref_country_code, t.ref_mobile_no, t.ref_email_id, t.ap_location, t.app_visit, t.city, t.state, t.country, t.designation, t.designationcomp, t.meet_purpose, t.meet_subject, t.no_people, t.no_people_partial, t.from_date, t.to_date, t.tags, t.attachment, t.attachment_url, t.picture, t.secretary_note, t.gurudev_remark, t.assign_to, t.assign_to_fill, t.assigned_by, t.ap_date, t.ap_time, t.star_rate, t.ap_status, t.check_in_status, t.darshan_line, t.backstage_status, t.deleted_app, t.entry_date_time, t.position_order, t.darshan_line_email, t.entry_date, t.mtype, t.zoom_link, t.access_token, t.venue, t.join_url, t.password, t.travelled, t.from_where, t.currently_doing, t.dop, t.selCountry, t.selState, t.selCity, t.toa, t.curr_loc, t.email_status, t.tcode, t.taughtCourses, t.more_info, t.admit_status, t.admitted_by, t.no_people_names, t.no_people_numbers, t.no_people_eleven_details, t.send_schedule, t.arrival_time, t.schedule_date, t.schedule_time, t.schedule_send_status, t.stay_avail FROM appointment_request as t WHERE  LOWER(t.ap_id) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.user_id) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.for_ap) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.full_name) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.email_id) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.country_code) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.mobile_no) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ref_name) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ref_country_code) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ref_mobile_no) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ref_email_id) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ap_location) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.app_visit) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.city) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.state) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.country) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.designation) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.designationcomp) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.meet_purpose) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.meet_subject) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people_partial) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.from_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.to_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.tags) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.attachment) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.attachment_url) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.picture) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.secretary_note) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.gurudev_remark) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.assign_to) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.assign_to_fill) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.assigned_by) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ap_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ap_time) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.star_rate) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ap_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.check_in_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.darshan_line) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.backstage_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.deleted_app) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.entry_date_time) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.position_order) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.darshan_line_email) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.entry_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.mtype) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.zoom_link) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.access_token) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.venue) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.join_url) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.password) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.travelled) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.from_where) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.currently_doing) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.dop) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.selCountry) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.selState) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.selCity) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.toa) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.curr_loc) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.email_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.tcode) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.taughtCourses) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.more_info) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.admit_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.admitted_by) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people_names) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people_numbers) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people_eleven_details) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.send_schedule) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.arrival_time) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.schedule_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.schedule_time) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.schedule_send_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.stay_avail) LIKE ` + SqlString.escape('%' + key + '%') + ` LIMIT ?,?`;
    return getRows(query, [offset, pageSize]);
}

exports.searchCount = async (key) => {
    const query = `SELECT count(*) as total FROM appointment_request t  WHERE  LOWER(t.ap_id) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.user_id) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.for_ap) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.full_name) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.email_id) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.country_code) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.mobile_no) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ref_name) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ref_country_code) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ref_mobile_no) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ref_email_id) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ap_location) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.app_visit) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.city) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.state) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.country) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.designation) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.designationcomp) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.meet_purpose) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.meet_subject) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people_partial) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.from_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.to_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.tags) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.attachment) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.attachment_url) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.picture) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.secretary_note) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.gurudev_remark) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.assign_to) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.assign_to_fill) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.assigned_by) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ap_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ap_time) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.star_rate) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ap_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.check_in_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.darshan_line) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.backstage_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.deleted_app) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.entry_date_time) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.position_order) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.darshan_line_email) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.entry_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.mtype) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.zoom_link) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.access_token) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.venue) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.join_url) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.password) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.travelled) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.from_where) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.currently_doing) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.dop) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.selCountry) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.selState) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.selCity) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.toa) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.curr_loc) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.email_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.tcode) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.taughtCourses) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.more_info) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.admit_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.admitted_by) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people_names) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people_numbers) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people_eleven_details) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.send_schedule) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.arrival_time) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.schedule_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.schedule_time) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.schedule_send_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.stay_avail) LIKE ` + SqlString.escape('%' + key + '%') + ``;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.getLastSecretary = async (userId, forAp) => {
    const query = `SELECT * FROM secretary WHERE user_id = ? AND for_ap = ? ORDER BY entry_date_time DESC LIMIT 1`; // Adjust the table and fields as necessary
    const result = await getRows(query, [userId, forAp]);
    return result[0]; // Return the first result
};

exports.getUserHistory = async (userId, emailId) => {
    const query = `SELECT * FROM appointment_request WHERE user_id = ? AND email_id = ?`;
    return getRows(query, [userId, emailId]);
};

exports.getAppointmentsByDate = async (userId, dateString) => {
    const query = `SELECT * FROM appointment_request WHERE user_id = ? AND DATE(from_date) = ?`;
    return getRows(query, [userId, dateString]);
};


