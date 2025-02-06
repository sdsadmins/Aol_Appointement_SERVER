module.exports = {
    "id": { required: true, type: "number" },
    "ap_id": { required: true, type: "string" },
    "guest_name": { required: true, type: "string" },
    "guest_contact": { required: true, type: "string" },
    "guest_age": { required: true, type: "number" },
    "guest_photo": { required: true, type: "string" },
    "photo_status": { required: true, type: "string" },
    "admit_status": { required: false, type: "number" }, // Nullable field
    "entry_date": { required: true, type: "string" } // Can be converted to Date in processing
}; 
