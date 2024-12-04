module.exports = {
    "title": { required: false, type: "string" },
    "full_name": { required: true, type: "string" },
    "email_id": { required: true, type: "string" },
    "designation": { required: true, type: "string" },
    "company": { required: true, type: "string" },
    "aol_teacher": { required: true, type: "string" },
    "teacher_code": { required: false, type: "string", default:""},
    "teach_courses": { required: false, type: "string" },
    "address": { required: false, type: "string" },
    "password": { required: true, type: "string" },
    "country_code": { required: false, type: "string" },
    "phone_no": { required: true, type: "string" },
    "city": { required: false, type: "string" },
    "state": { required: false, type: "number" },
    "post_code": { required: false, type: "string" },
    "country": { required: false, type: "string" },
    "photo": { required: true, type: "string" },
    "tags": { required: false, type: "string" },
    "status": { required: false, type: "string" },
    "entry_date": { required: false, type: "date" },
};

// allowed types - number, string, boolean, object, undefined
