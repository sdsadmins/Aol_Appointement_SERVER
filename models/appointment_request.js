const { getRows, insertRow, updateRow, deleteRow } = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/appointment_request.dto');
const _ = require('lodash');
const moment = require('moment-timezone');
const userModel = require("../models/users_reg");
 // Ensure this path is correct

// exports.find = async (offset, pageSize) => {
//     const query = `SELECT t.id, t.ap_id, t.user_id, t.for_ap, t.full_name, t.email_id, t.country_code, t.mobile_no, t.ref_name, t.ref_country_code, t.ref_mobile_no, t.ref_email_id, t.ap_location, t.app_visit, t.city, t.state, t.country, t.designation, t.designationcomp, t.meet_purpose, t.meet_subject, t.no_people, t.no_people_partial, t.from_date, t.to_date, t.tags, t.attachment, t.attachment_url, t.picture, t.secretary_note, t.gurudev_remark, t.assign_to, t.assign_to_fill, t.assigned_by, t.ap_date, t.ap_time, t.star_rate, t.ap_status, t.check_in_status, t.darshan_line, t.backstage_status, t.deleted_app, t.entry_date_time, t.position_order, t.darshan_line_email, t.entry_date, t.mtype, t.zoom_link, t.access_token, t.venue, t.join_url, t.password, t.travelled, t.from_where, t.currently_doing, t.dop, t.selCountry, t.selState, t.selCity, t.toa, t.curr_loc, t.email_status, t.tcode, t.taughtCourses, t.more_info, t.admit_status, t.admitted_by, t.no_people_names, t.no_people_numbers, t.no_people_eleven_details, t.send_schedule, t.arrival_time, t.schedule_date, t.schedule_time, t.schedule_send_status, t.stay_avail FROM appointment_request as t`;
//     return getRows(query,[offset,pageSize]);
// }

exports.find = async (assignToId, offset, pageSize) => {
    const query = `
        SELECT t.id, t.ap_id, t.user_id, t.for_ap, t.full_name, t.email_id, t.country_code, t.mobile_no, 
            t.ref_name, t.ref_country_code, t.ref_mobile_no, t.ref_email_id, t.ap_location, t.app_visit, 
            t.city, t.state, t.country, t.designation, t.designationcomp, t.meet_purpose, t.meet_subject, 
            t.no_people, t.no_people_partial, t.from_date, t.to_date, t.tags, t.attachment, t.attachment_url, 
            t.picture, t.secretary_note, t.gurudev_remark, t.assign_to, t.assign_to_fill, t.assigned_by, 
            t.ap_date, t.ap_time, t.star_rate, t.ap_status, t.check_in_status, t.darshan_line, t.backstage_status, 
            t.deleted_app, t.entry_date_time, t.position_order, t.darshan_line_email, t.entry_date, t.mtype, 
            t.zoom_link, t.access_token, t.venue, t.join_url, t.password, t.travelled, t.from_where, 
            t.currently_doing, t.dop, t.selCountry, t.selState, t.selCity, t.toa, t.curr_loc, t.email_status, 
            t.tcode, t.taughtCourses, t.more_info, t.admit_status, t.admitted_by, t.no_people_names, 
            t.no_people_numbers, t.no_people_eleven_details, t.send_schedule, t.arrival_time, t.schedule_date, 
            t.schedule_time, t.schedule_send_status, t.stay_avail
        FROM appointment_request as t
        WHERE t.assign_to = ? 
        ORDER BY t.ap_date DESC
        LIMIT ?, ?`;

    const countQuery = `
        SELECT COUNT(*) AS totalCount
        FROM appointment_request as t
        WHERE t.assign_to = ?`;

    const [appointments, countResult] = await Promise.all([
        getRows(query, [assignToId, offset, pageSize]),
        getRows(countQuery, [assignToId]),
    ]);

    const totalCount = countResult && countResult[0] ? countResult[0].totalCount : 0;

    // Define your desired timezone
    const timezone = 'Asia/Kolkata'; // Replace with the desired timezone

    // Convert `ap_date` to local timezone
    const adjustedAppointments = appointments.map((appointment) => {
        return {
            ...appointment,
            ap_date: moment(appointment.ap_date).tz(timezone).format('YYYY-MM-DDTHH:mm:ssZ'), // Convert to local timezone
        };
    });

    return { appointments: adjustedAppointments, totalCount };
};


// Added updateAppointmentStatus function to handle appointment status updates
exports.updateAppointmentStatus = async (appid, status) => {
    const query = `UPDATE appointment_request SET ap_status = ?, star_rate = ? WHERE ap_id = ?`;
    const result = await updateRow(query, [status, status, appid]);
    return result;
};

exports.findOne = async (id) => {
    const query = `SELECT * FROM appointment_request WHERE id = ?`;
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
    const query = `UPDATE appointment_request SET deleted_app = 1 WHERE id = ?`;
    return updateRow(query, [id]);
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
    const query = `SELECT t.id, t.ap_id, t.user_id, t.for_ap, t.full_name, t.email_id, t.country_code, t.mobile_no, t.ref_name, t.ref_country_code, t.ref_mobile_no, t.ref_email_id, t.ap_location, t.app_visit, t.city, t.state, t.country, t.designation, t.designationcomp, t.meet_purpose, t.meet_subject, t.no_people, t.no_people_partial, t.from_date, t.to_date, t.tags, t.attachment, t.attachment_url, t.picture, t.secretary_note, t.gurudev_remark, t.assign_to, t.assign_to_fill, t.assigned_by, t.ap_date, t.ap_time, t.star_rate, t.ap_status, t.check_in_status, t.darshan_line, t.backstage_status, t.deleted_app, t.entry_date_time, t.position_order, t.darshan_line_email, t.entry_date, t.mtype, t.zoom_link, t.access_token, t.venue, t.join_url, t.password, t.travelled, t.from_where, t.currently_doing, t.dop, t.selCountry, t.selState, t.selCity, t.toa, t.curr_loc, t.email_status, t.tcode, t.taughtCourses, t.more_info, t.admit_status, t.admitted_by, t.no_people_names, t.no_people_numbers, t.no_people_eleven_details, t.send_schedule, t.arrival_time, t.schedule_date, t.schedule_time, t.schedule_send_status, t.stay_avail FROM appointment_request as t WHERE  LOWER(t.ap_id) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.user_id) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.for_ap) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.full_name) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.email_id) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.country_code) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.mobile_no) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ref_name) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ref_country_code) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ref_mobile_no) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ref_email_id) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ap_location) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.app_visit) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.city) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.state) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.country) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.designation) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.designationcomp) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.meet_purpose) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.meet_subject) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people_partial) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.from_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.to_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.tags) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.attachment) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.attachment_url) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.picture) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.secretary_note) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.gurudev_remark) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.assign_to) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.assign_to_fill) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.assigned_by) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ap_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ap_time) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.star_rate) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.ap_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.check_in_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.darshan_line) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.backstage_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.deleted_app) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.entry_date_time) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.position_order) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.darshan_line_email) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.entry_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.mtype) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.zoom_link) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.access_token) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.venue) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.join_url) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.password) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.travelled) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.from_where) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.currently_doing) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.dop) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.selCountry) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.selState) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.selCity) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.toa) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.curr_loc) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.email_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.tcode) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.taughtCourses) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.more_info) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.admit_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.admitted_by) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people_names) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people_numbers) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.no_people_eleven_details) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.send_schedule) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.arrival_time) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.schedule_date) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.schedule_time) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.schedule_send_status) LIKE ` + SqlString.escape('%' + key + '%') + ` OR  LOWER(t.stay_avail) LIKE ` + SqlString.escape('%' + key + '%') + ``;
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
    const query = `SELECT * FROM appointment_request WHERE user_id = ?`;
    return getRows(query, [userId, emailId, emailId]); // Pass emailId twice for both conditions
};

// exports.getAppointmentsByDate = async (datestring, assignTo) => {
//     try {
//         const query = `
//             SELECT * 
//             FROM appointments 
//             WHERE assign_to = ? AND DATE(appointment_date) = ?
//         `;
//         const values = [assignTo, datestring];
//         const [results] = await db.execute(query, values); // Assuming you're using a database connection like MySQL
//         return results;
//     } catch (error) {
//         throw error;
//     }
// };


exports.getAppointmentsByDate = async (datestring, assignTo) => {
    let query = `
        SELECT * 
        FROM appointment_request 
        WHERE DATE(ap_date) = ?
    `;
    const params = [datestring];

    // Add condition for `assign_to` if it's provided
    if (assignTo) {
        query += ` AND assign_to = ?`;
        params.push(assignTo);
    }

    // Execute query with dynamic parameters
    return getRows(query, params);
};



exports.findOneByApId = async (apId) => {
    const query = `SELECT * FROM appointment_request WHERE ap_id = ?`; // Query to find by ap_id
    return getRows(query, [apId]);
};

// Divya --added on 12 Dec 2024
exports.findOneById = async (id) => {
    const query = `SELECT * FROM appointment_request WHERE id = ?`; // Query to find by ap_id
    return getRows(query, [id]);
};

exports.updateCheckInStatus = async (appid, { status, secretary_note, gurudev_remark }) => {
    const query = `UPDATE appointment_request SET check_in_status = ?, secretary_note = ?, gurudev_remark = ? WHERE ap_id = ?`;
    const result = await updateRow(query, [status, secretary_note, gurudev_remark, appid]);
    return result;
};

exports.updateAppointmentStatus = async (appid, status) => {
    const query = `UPDATE appointment_request SET ap_status = ?, star_rate = ? WHERE ap_id = ?`;
    const result = await updateRow(query, [status, '1', appid]);
    return result;
};

exports.restore = async (appid) => {
    const query = `UPDATE appointment_request SET deleted_app = '0' WHERE ap_id = ?`; // Assuming 'deleted_app' indicates if the appointment is deleted
    const result = await updateRow(query, [appid]);
    return result ? this.findOneByApId(appid) : null; // Return the restored appointment details
};

exports.updateDeletedApp = async (appid, status) => {
    const query = `UPDATE appointment_request SET deleted_app = ? WHERE ap_id = ?`;
    const result = await updateRow(query, [status, appid]);
    return result;
};

exports.markAppointmentAsDeleted = async (appid) => {
    const query = `UPDATE appointment_request SET deleted_app = '1' WHERE ap_id = ?`;
    const result = await updateRow(query, [appid]);
    return result ? this.findOneByApId(appid) : null;
};

// Fetch and classify appointments
exports.classifyAppointments = async () => {
    const query = 'SELECT * FROM appointment_request';
    const results = await getRows(query);

    // Process and classify appointments
    const classifiedAppointments = results.map(appointment => {
        const hour = new Date(appointment.ap_time * 1000).getHours(); // Convert Unix timestamp to hours

        let timePeriod;
        if (hour < 16) {
            timePeriod = 'Morning';
        } else if (hour >= 16 && hour < 19) {
            timePeriod = 'Evening';
        } else {
            timePeriod = 'Night';
        }

        return {
            ...appointment,
            timePeriod // Add the classification
        };
    });

    return classifiedAppointments;
};

// exports.getAppointmentsFromDate = async (userId, startDate) => {
//     let query = `SELECT * FROM appointment_request WHERE DATE(ap_date) >= ?`;
//     const params = [startDate];

//     if (userId) {
//         query += ` AND user_id = ?`;
//         params.push(userId);
//     }

//     console.log('Executing query:', query, 'with params:', params); // Debugging line

//     const results = await getRows(query, params);
//     console.log('Query results:', results); // Log the results

//     return results;
// };

exports.getUpcomingAppointmentsByDate = async (dateString) => {
    // Validate the input date
    const inputDate = new Date(dateString);

    if (isNaN(inputDate.getTime())) {
        throw new Error('Invalid date format');
    }

    // Query to get the count of appointments grouped by date
    const query = `
        SELECT DATE(ap_date) as appointment_date, COUNT(id) as app_count
        FROM appointment_request
        WHERE 
            DATE(ap_date) >= ? 
            AND DATE(ap_date) != '0000-00-00'
            AND deleted_app = '0'
            AND ap_status IN ('Scheduled', 'TB R/S', 'Done')
        GROUP BY DATE(ap_date)
        ORDER BY appointment_date ASC
    `;

    const rows = await getRows(query, [dateString]);

    // Return the result directly
    return rows.map(row => ({
        appointment_date: row.appointment_date,
        app_count: row.app_count
    }));
};

exports.getUpcomingAppointmentsByMonthYear = async (month, year, userId) => {
    // Construct the first and last dates of the month
    const firstDateOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDateOfMonth = new Date(year, month, 0).toISOString().split("T")[0]; // Last day of the month

    // Base query
    let query = `
        SELECT DATE(ap_date) as appointment_date, COUNT(id) as app_count
        FROM appointment_request
        WHERE 
            DATE(ap_date) >= ? AND DATE(ap_date) <= ?
            AND DATE(ap_date) != '0000-00-00'
            AND deleted_app = '0'
            AND ap_status IN ('Scheduled', 'TB R/S', 'Done')
    `;

    // Add userId filter dynamically if provided
    const params = [firstDateOfMonth, lastDateOfMonth];
    if (userId) {
        query += ` AND assign_to = ?`;
        params.push(userId);
    }

    // Add grouping and ordering
    query += `
        GROUP BY DATE(ap_date)
        ORDER BY appointment_date ASC
    `;

    const rows = await getRows(query, params);

    // Return the result directly
    return rows.map(row => ({
        appointment_date: row.appointment_date,
        app_count: row.app_count
    }));
};



exports.getAppointmentCountByDate = async (userId, apDate) => {
    const query = `SELECT COUNT(*) as total FROM appointment_request WHERE user_id = ? AND DATE(ap_date) = ?`;
    const result = await getRows(query, [userId, apDate]);
    return result[0] ? result[0].total : 0; // Return the count or 0 if no results
};

exports.getAppointmentsByLocation = async (locationId) => {
    const query = `SELECT * FROM appointment_request WHERE ap_location = ?`;
    return getRows(query, [locationId]);
};

exports.getStarredAppointments = async () => {
    try {
        const query = `SELECT * FROM appointment_request WHERE star_rate = '1'`;
        console.log('Executing query:', query);

        const results = await getRows(query);
        console.log('Query results:', results);

        // Fetch user data for each starred appointment
        const userPromises = results.map(async (appointment) => {
            const userData = await userModel.findOne(appointment.user_id); // Fetch user data
            return {
                ...appointment,
                user: userData[0] || null // Add user data to the appointment
            };
        });

        // Wait for all user data to be fetched
        return await Promise.all(userPromises);
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
};


exports.filterAppointmentsByAssignedStatus = async (assignToFill, offset, pageSize) => {
    console.log('Filtering appointments with:', { assignToFill, offset, pageSize });

    let query = `SELECT * FROM appointment_request`;
    let countQuery = `SELECT COUNT(*) as total FROM appointment_request`;
    let whereClause = '';
    let params = [];

    // Handle different assignToFill scenarios
    switch (assignToFill) {
        case 'all':
            // No additional filtering for 'all'
            break;
        case 'assigned':
            whereClause = ` WHERE assign_to_fill IS NOT NULL AND assign_to_fill != ''`;
            break;
        case 'unassigned':
            whereClause = ` WHERE (assign_to_fill IS NULL OR assign_to_fill = '')`;
            break;
        default:
            // For specific assign_to_fill values
            whereClause = ` WHERE assign_to_fill = ?`;
            params.push(assignToFill);
    }

    // Add pagination
    const limitClause = ` LIMIT ?, ?`;
    params.push(offset, pageSize);

    // Construct full queries
    query += whereClause + limitClause;
    countQuery += whereClause;

    try {
        // Execute count query
        const countResult = await getRows(countQuery,
            assignToFill === 'all' ? [] : params.slice(0, -2)
        );
        const totalCount = countResult[0] ? countResult[0].total : 0;

        // Execute data query
        const data = await getRows(query, params);

        return {
            totalCount,  // Total number of records matching the filter
            totalPages: Math.ceil(totalCount / pageSize),  // Total number of pages
            currentPage: Math.floor(offset / pageSize) + 1,  // Current page number
            pageSize,  // Number of records per page
            data
        };
    } catch (error) {
        console.error('Detailed Error filtering appointments:', error);
        return {
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
            pageSize,
            data: []
        };
    }
};

exports.getDoneAppointments = async (offset, pageSize) => {
    const query = `SELECT * FROM appointment_request WHERE ap_status = 'Done' AND deleted_app = '0' LIMIT ?, ?`;
    const countQuery = `SELECT COUNT(*) as total FROM appointment_request WHERE ap_status = 'Done' AND deleted_app = '0'`;
    const countResult = await getRows(countQuery);
    const data = await getRows(query, [offset, pageSize]);
    
    // Fetch user data for each appointment
    const userPromises = data.map(async (appointment) => {
        const userData = await userModel.findOne(appointment.user_id); // Fetch user data
        return {
            ...appointment,
            user: userData[0] || null // Add user data to the appointment
        };
    });

    // Wait for all user data to be fetched
    const appointmentsWithUserData = await Promise.all(userPromises);

    return {
        totalCount: countResult[0] ? countResult[0].total : 0,
        data: appointmentsWithUserData // Return appointments with user data
    };
};

exports.getDeletedAppointments = async (offset, pageSize) => {
    const query = `SELECT * FROM appointment_request WHERE deleted_app = '1' LIMIT ?, ?`;
    return getRows(query, [offset, pageSize]); // Pass offset and pageSize as parameters
};

exports.countDeletedAppointments = async () => {
    const query = `SELECT COUNT(*) as total FROM appointment_request WHERE deleted_app = '1'`;
    const result = await getRows(query);
    return result[0] ? result[0].total : 0; // Return total count or 0 if no results
};

exports.updateAssignToFill = async (ap_id, name, assignToFill) => {
    console.log("Updating assign_to and assign_to_fill for ap_id:", ap_id, "with name:", name, "and assignToFill:", assignToFill); // Log the parameters
    const query = `UPDATE appointment_request SET assign_to = ?, assign_to_fill = ? WHERE ap_id = ?`; // Update both assign_to and assign_to_fill
    const result = await updateRow(query, [name, assignToFill, ap_id]);
    
    console.log("Update Result:", result); // Log the result of the updateRow call

    // Check if the update was successful
    if (result) {
        return this.findOneByApId(ap_id); // Return the updated appointment details
    } else {
        console.warn("No rows affected for ap_id:", ap_id); // Log if no rows were affected
        return null; // Return null if no update occurred
    }
};

exports.updateByApId = async (ap_id, object) => {
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
    let query = `UPDATE appointment_request SET ? WHERE ap_id = ? `;
    updateValues = updateValues.concat([ap_id]);
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOneByApId(ap_id) : null;
};

exports.updateAppointmentStar = async (appid, starRate) => {
    const query = `UPDATE appointment_request SET star_rate = ? WHERE ap_id = ?`;
    const result = await updateRow(query, [starRate, appid]); // Update only star_rate
    return result;
};

exports.getTodayAppointments = async (userId, locationId) => {
    const query = `SELECT * FROM appointment_request WHERE DATE(ap_date) = CURDATE() AND user_id = ? AND ap_location = ?`;
    return getRows(query, [userId, locationId]);
};

exports.getTomorrowsAppointments = async (assignTo) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Increment the date by 1 to get tomorrow's date
    const dateString = tomorrow.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'

    const query = `SELECT * FROM appointment_request WHERE DATE(ap_date) = ? AND assign_to = ?`; // Updated query to use assign_to
    return getRows(query, [dateString, assignTo]); // Pass dateString and assignTo as parameters
};

// Divya --added on 23 Dec 2024
exports.getInboxAppointments = async (location, limit, offset) => {
    // console.log("Inbox model",location,limit,offset);

    // const query = `SELECT * FROM appointment_request WHERE ap_status = ? AND darshan_line = '' AND backstage_status = '' AND deleted_app = ? ORDER BY id DESC LIMIT ? OFFSET ?`;
    // const params = ['Pending', '0', limit, offset];
	// return getRows(query, params);

    const main_location = "1";
    const allowedUSLocations = ['2', '4', '9', '10', '11', '12', '13']; // Define US locations

    // Base query
    let query = `
        SELECT * 
        FROM appointment_request 
        WHERE ap_status = ? 
        AND darshan_line = '' 
        AND backstage_status = '' 
        AND deleted_app = ? 
    `;

    const params = ['Pending', '0']; // Base parameters

    // Apply location conditions
    if (main_location === location) {
        query += `AND ap_location = ? `;
        params.push(location);

    } else {
        if (allowedUSLocations.includes(location)) {
        if (role === 'gurudev') {
            query += `AND ap_location = ? `;
            params.push(location);
        } else {
            query += `AND ap_location IN (${allowedUSLocations.map(() => '?').join(', ')}) `;
            params.push(...allowedUSLocations);
        }
        } else {
            query += `AND ap_location = ? `;
            params.push(location);
        }
    }

    // Add ordering and pagination
    query += `ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Execute query
    return getRows(query, params);
}

// Divya --added on 24 Dec 2024
// exports.getAssignedAppointments = async (userid, role, location, limit, offset) => {
//     console.log("Assigned model",userid,role,location,limit,offset);

//     const main_location = "1";
//     const allowedUSLocations = ['2', '4', '9', '10', '11', '12', '13']; // Define US locations

//     // Base query
//     let query = `
//         SELECT * 
//         FROM appointment_request 
//         WHERE ap_status = ? 
//         AND darshan_line = '' 
//         AND backstage_status = '' 
//         AND deleted_app = ? 
//     `;

//     const params = ['Pending', '0']; // Base parameters

//     // Apply location conditions
//     if (main_location === location) {
//         query += `AND ap_location IS NOT NULL `;
//     } else {
//         if (allowedUSLocations.includes(location)) {
//             query += `AND ap_location IN (${allowedUSLocations.map(() => '?').join(', ')}) `;
//             params.push(...allowedUSLocations);
//         } else {
//             query += `AND ap_location = ? `;
//             params.push(location);
//         }
//     }

//     // Apply role condition
//     if (role === "secretary") {
//         query += `AND assign_to = ? `;
//         params.push(userid);
//     }

//     // Add ordering and pagination
//     query += `ORDER BY id DESC LIMIT ? OFFSET ?`;
//     params.push(limit, offset);

//     // Execute query
//     return getRows(query, params);
// }

exports.getAssignedAppointments = async (assignTo, location, limit, offset) => {
    console.log("Assigned model - Parameters:", assignTo, location, limit, offset);

    const main_location = "1";
    const allowedUSLocations = ['2', '4', '9', '10', '11', '12', '13']; // Define US locations

    // Base query
    let query = `
        SELECT * 
        FROM appointment_request 
        WHERE ap_status = ? 
        AND darshan_line = '' 
        AND backstage_status = '' 
        AND deleted_app = ? 
    `;

    const params = ['Pending', '0']; // Base parameters

    // Apply location conditions
    if (main_location === location) {
        query += `AND ap_location IS NOT NULL `;
    } else {
        if (allowedUSLocations.includes(location)) {
            query += `AND ap_location IN (${allowedUSLocations.map(() => '?').join(', ')}) `;
            params.push(...allowedUSLocations);  // Adds each allowed location as a parameter
        } else {
            query += `AND ap_location = ? `;
            params.push(location);  // Filter by specific location if not in allowed locations
        }
    }

    // Apply the assign_to condition
    query += `AND assign_to = ? `;
    params.push(assignTo);  // Fetch appointments assigned to the provided assign_to ID

    // Add ordering and pagination
    query += `ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Log the final query and parameters for debugging
    console.log("Final Query:", query);
    console.log("Parameters:", params);

    try {
        // Execute query
        const rows = await getRows(query, params);  // Assuming getRows is your DB function
        console.log("Query Results:", rows);
        return rows;
    } catch (error) {
        console.error("Error executing query:", error);
        throw new Error("Database query failed.");
    }
}

exports.getUserAppointmentsCountByDate = async (assignToId) => {
    const query = `
        SELECT ap_date, COUNT(*) AS appointment_count 
        FROM appointment_request 
        WHERE assign_to = ? 
        GROUP BY ap_date
    `;

    const timezone = 'Asia/Kolkata'; // Replace with the desired timezone
    const result = await getRows(query, [assignToId]);

    return result.map((row) => ({
        ap_date: moment(row.ap_date).tz(timezone).format('YYYY-MM-DDTHH:mm:ssZ'),
        appointment_count: row.appointment_count,
    }));
};

// Divya --added on 28 Dec 2024
exports.getndateAppointments = async (user_id, show_appts_of, location, datestring) => {
    // console.log("ndate model - Parameters:", user_id, show_appts_of, location, datestring);

    const params = [];
    const main_location = "1";
    const statusList = ['Scheduled','TB R/S','Done','SB','GK','PB'];
  
    // Base query
    let query = `
        SELECT * 
        FROM appointment_request 
        WHERE deleted_app = ? 
    `;
    params.push('0'); // deleted_app is always '0'

    // Location logic
    if (main_location !== location) {
        if (show_appts_of !== 'All') {
            const showApptsOfArray = show_appts_of.split(','); // Convert string to array
            query += `AND ap_location IN (${showApptsOfArray.map(() => '?').join(', ')}) `;
            params.push(...showApptsOfArray);
        }
    }

    // Add date condition (convert time zones if necessary)
    // const todayDate = oneTimeZoneToAnother(today, 'Y-m-d', timezone); // Assuming you have a utility for time zone conversion
    query += `AND ap_date = ? `;
    params.push(datestring);

    // Add status filter
    if (statusList && statusList.length > 0) {
        query += `AND ap_status IN (${statusList.map(() => '?').join(', ')}) `;
        params.push(...statusList);
    }

    // Add ordering
    query += `ORDER BY ap_time ASC`;

    // Debug the final query and params
    // console.log('Final Query:', query);
    // console.log('Params:', params);


    // Execute query
    const appointments = await getRows(query, params);

    // Fetch user data for each appointment
    const userPromises = appointments.map(async (appointment) => {
        const userData = await userModel.findOne(appointment.user_id); // Fetch user data
        return {
            ...appointment,
            user: userData[0] || null // Add user data to the appointment
        };
    });

    // Wait for all user data to be fetched
    const appointmentsWithUserData = await Promise.all(userPromises);

    // Return the appointments with user data
    return appointmentsWithUserData;
}

exports.getAppointmentsByDateRange = async (fromDate, toDate) => {
    const query = `
        SELECT * 
        FROM appointment_request 
        WHERE ap_date BETWEEN ? AND ? 
        AND deleted_app = '0'`; // Ensure deleted appointments are excluded

    return getRows(query, [fromDate, toDate]);
};

exports.getAllAppointments = async () => {
    const query = `SELECT * FROM appointment_request WHERE deleted_app != 0 ORDER BY ap_date DESC`; // Query to get all non-deleted appointments, latest first
    return getRows(query); // Assuming getRows is your DB function
};




exports.getUpcomingAppointmentsByDate = async (date, assignTo) => {
    const query = `
        SELECT * FROM appointment_request 
        WHERE DATE(ap_date) >= ? AND assign_to = ? AND deleted_app = '0'
        ORDER BY ap_date ASC
    `;
    return getRows(query, [date, assignTo]);
};

exports.getUserAppointmentsHistory = async (userId) => {
    const query = `
        SELECT * FROM appointment_request 
        WHERE user_id = ? AND deleted_app = '0'
        ORDER BY ap_date DESC
    `;
    return getRows(query, [userId]);
};

exports.getAppointmentInfoById = async (id) => {
    const query = `
        SELECT id, for_ap, assign_to, assign_to_fill, meet_purpose, 
               ap_status, no_people, ap_date, ap_time, from_date, to_date,
               ap_id
        FROM appointment_request
        WHERE id = ? AND deleted_app = '0'`;

    const result = await getRows(query, [id]);
    const appointment = result[0];

    if (appointment && appointment.ap_status === 'Scheduled') {
        // Ensure the AWS_S3_BASE_URL is defined in your environment
        const s3BaseUrl = process.env.AWS_S3_BASE_URL;
        if (!s3BaseUrl) {
            throw new Error('AWS_S3_BASE_URL is not defined in the environment variables');
        }

        // Construct the S3 URL for the QR code
        const qrCodeUrl = `${s3BaseUrl}/qr_code_${appointment.id}.png`;
        appointment.qr_code_url = qrCodeUrl;
    }

    return appointment;
};
