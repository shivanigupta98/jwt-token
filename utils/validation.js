const validateInput = (req) => {
    const ALLOWED_EDIT_FIELDS = ['password', 'city', 'mobile', 'skills'];
    const isEditAllowed = Object.keys(req.body).every((field) => ALLOWED_EDIT_FIELDS.includes(field));
    return isEditAllowed;
}

module.exports = { validateInput };