const Emojis = require("./emojis");

class Frequent {
    getAll() {
        var list = localStorage.getItem("EmojiPanel-frequent") || "[]";

        try {
            return JSON.parse(list);
        } catch (e) {
            return [];
        }
    }
    add(emoji, limit) {
        var list = this.getAll();

        if (list.find((row) => row.char === emoji.char)) {
            return false;
        } else if (limit && list.length >= limit) {
            list.push(emoji);
            list.shift();
            localStorage.setItem("EmojiPanel-frequent", JSON.stringify(list));
            return true;
        } else {
            list.push(emoji);
            localStorage.setItem("EmojiPanel-frequent", JSON.stringify(list));
            return true;
        }
    }
}

export default new Frequent();
