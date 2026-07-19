const { Storage } = require('megajs');

/**
 * ෆයිල් එකක් Mega.nz cloud එකට upload කරන function එක
 * @param {ReadableStream} fileStream - Upload කරන්න ඕන ෆයිල් එකේ stream එක
 * @param {string} fileName - Mega එකේ සේව් වෙන්න ඕන නම
 * @returns {Promise<string>} - Mega file link එක
 */
async function upload(fileStream, fileName) {
    return new Promise((resolve, reject) => {
        const email = process.env.MEGA_EMAIL || undefined;
        const password = process.env.MEGA_PASSWORD || undefined;

        let storage;
        if (email && password) {
            storage = new Storage({ email, password });
        } else {
            storage = new Storage();
        }

        storage.login((err) => {
            if (err) return reject(err);

            storage.upload({ name: fileName }, fileStream, (err, file) => {
                if (err) return reject(err);

                file.link((err, url) => {
                    if (err) return reject(err);
                    resolve(url);
                });
            });
        });
    });
}

module.exports = { upload };
