const rooms = [];

const addRoom = ({ host, id, users }) => {

    id = id.trim();

    if (!host) host = users[0].id;
    const room = { host, id, numberOfUsers: users.length, playlist: [], maxRoomSize: 20 };
    rooms.push(room);

    return { room };
};

const removeRoom = (id) => {
    const index = rooms.findIndex((room) => room.id === id);
    if (index !== -1) return rooms.splice(index, 1)[0];
};

const getRoom = (roomId) => rooms.filter((room) => room.id === roomId)[0];

module.exports = { addRoom, getRoom, removeRoom };
