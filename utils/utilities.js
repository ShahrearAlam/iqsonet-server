const { UserModel, UserStatus } = require("../models/user.model")

const generateUniqueUsername = async (firstName, lastName) => {
    const makeUserName = (fn, ln) => (fn + ln).replace(/[^a-z0-9]/gi, "").toLowerCase();

    const baseUsername = makeUserName(firstName, lastName || " ");
    let username = baseUsername;
    let suffix = 1;

    while (true) {
        const isUsernameTaken = await UserModel.findOne({ username });

        if (!isUsernameTaken) {
            return username;
        }

        username = `${baseUsername}${suffix}`;
        suffix++;

        // if (suffix > MAX_USERNAME_SUFFIX_ATTEMPTS) {
        //     throw new Error("Failed to generate a unique username");
        // }
    }
};

module.exports = { generateUniqueUsername }