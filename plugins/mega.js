const { Storage } = require('mega-nz');
const fs = require('fs');

/**
 * ෆයිල් එකක් Mega.nz cloud එකට upload කරන function එක
 * @param {ReadableStream} fileStream - Upload කරන්න ඕන ෆයිල් එකේ stream එක
 * @param {string} fileName - Mega එකේ සේව් වෙන්න ඕන නම
 * @returns {Promise<string>} - Mega file link එක
 */
async function upload(fileStream, fileName) {
    return new Promise((resolve, reject) => {
        // මෙතන email සහ password හිස්ව තිබුනොත් Mega එකෙන් auto Anonymous (ගෙස්ට්) එකවුන්ට් එකක් හදනවා
        const storage = new Storage({
            email: process.env.MEGA_EMAIL || undefined,
            password: process.env.MEGA_PASSWORD || undefined
        });

        storage.ready((err) => {
            if (err) return reject(err);

            // ෆයිල් එක Mega එකට upload කිරීම
            storage.upload(fileName, fileStream, (err, file) => {
                if (err) return reject(err);

                // Upload වුණු ෆයිල් එකේ public link එක (URL) ලබා ගැනීම
                file.link((err, url) => {
                    if (err) return reject(err);
                    resolve(url);
                });
            });
        });
    });
}

module.exports = { upload };

