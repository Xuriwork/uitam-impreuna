export const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
};	

export const validateData = (username, roomName) => {
    const errors = {};
        
    if (isEmpty(username)) {
        errors.username = 'This field is required';
    } else if (!/^[a-zA-Z0-9_-]*$/.test(username)) {
        errors.username = 'Only alphanumeric characters';
    } else if (username.length < 1) {
        errors.username = 'The min character length is 1 characters';
    } else if (username.length > 50) {
        errors.username = 'The max character length is 50 characters';
    };

    if (isEmpty(roomName)) {
        errors.roomName = 'This field is required';
    } else if (!/^[a-zA-Z0-9_-]*$/.test(roomName)) {
        errors.roomName = 'Only alphanumeric characters';
    } else if (roomName.length < 1) {
        errors.roomName = 'The min character length is 1 characters';
    } else if (roomName.length > 150) {
        errors.roomName = 'The max character length is 150 characters';
    };

    const valid = Object.keys(errors).length === 0 ? true : false;

    return { errors, valid };
};