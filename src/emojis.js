const modifiers = require("./modifiers");
import Frequent from "./frequent";
import EmojiPanel from "./index";

let json = null;
const Emojis = {
    load: (options) => {
        // Load and inject the SVG sprite into the DOM
        let svgPromise = Promise.resolve();
        if (
            options.pack_url &&
            !document.querySelector(`.${options.classnames.svg}`)
        ) {
            svgPromise = new Promise((resolve) => {
                const svgXhr = new XMLHttpRequest();
                svgXhr.open("GET", options.pack_url, true);
                svgXhr.onload = () => {
                    const container = document.createElement("div");
                    container.classList.add(options.classnames.svg);
                    container.style.display = "none";
                    container.innerHTML = svgXhr.responseText;
                    document.body.appendChild(container);
                    resolve();
                };
                svgXhr.send();
            });
        }

        // Load the emojis json
        if (!json && options.json_save_local) {
            try {
                json = JSON.parse(localStorage.getItem("EmojiPanel-json"));
            } catch (e) {
                json = null;
            }
        }

        let jsonPromise = Promise.resolve(json);
        if (json == null) {
            jsonPromise = new Promise((resolve) => {
                const emojiXhr = new XMLHttpRequest();
                emojiXhr.open("GET", options.json_url, true);
                emojiXhr.onreadystatechange = () => {
                    if (
                        emojiXhr.readyState == XMLHttpRequest.DONE &&
                        emojiXhr.status == 200
                    ) {
                        if (options.json_save_local) {
                            localStorage.setItem(
                                "EmojiPanel-json",
                                emojiXhr.responseText
                            );
                        }

                        json = JSON.parse(emojiXhr.responseText);
                        resolve(json);
                    }
                };
                emojiXhr.send();
            });
        }

        return Promise.all([svgPromise, jsonPromise]);
    },
    createEl: (emoji, options) => {
        if (options.pack_url) {
            if (
                document.querySelector(
                    `.${options.classnames.svg} [id="${emoji.unicode}"]`
                )
            ) {
                return `<svg viewBox="0 0 20 20"><use xlink:href="#${emoji.unicode}"></use></svg>`;
            } else if (
                document.querySelector(
                    `.${options.classnames.svg} [id="${emoji.unicode_alt}"]`
                )
            ) {
                return `<svg viewBox="0 0 20 20"><use xlink:href="#${emoji.unicode_alt}"></use></svg>`;
            }
        }

        // Fallback to the emoji char if the pack does not have the sprite, or no pack
        return emoji.char;
    },
    createButton: (emoji, options, emit) => {
        if (emoji.fitzpatrick && options.fitzpatrick) {
            // Remove existing modifiers
            Object.keys(modifiers).forEach(
                (i) =>
                    (emoji.unicode = emoji.unicode.replace(
                        modifiers[i].unicode,
                        ""
                    ))
            );
            Object.keys(modifiers).forEach(
                (i) => (emoji.char = emoji.char.replace(modifiers[i].char, ""))
            );

            // Append fitzpatrick modifier
            emoji.unicode += modifiers[options.fitzpatrick].unicode;
            emoji.char += modifiers[options.fitzpatrick].char;
        }

        const button = document.createElement("button");
        button.setAttribute("type", "button");
        button.innerHTML = Emojis.createEl(emoji, options);
        button.classList.add("emoji");
        button.dataset.unicode =
            emoji.unicode_alt.length > 1 ? emoji.unicode_alt : emoji.unicode;
        button.dataset.char = emoji.char;
        button.dataset.category = emoji.category;
        button.dataset.name = emoji.name;
        if (emoji.fitzpatrick) {
            button.dataset.fitzpatrick = emoji.fitzpatrick;
        }

        if (emit) {
            button.addEventListener("click", () => {
                emit("select", emoji);
                if (options.frequent == true && Frequent.add(emoji)) {
                    let frequentResults = document.querySelector(
                        `.${options.classnames.frequentResults}`
                    );
                    let list = Frequent.getAll();

                    const html = list.map((emoji) =>
                        Emojis.createButton(emoji, options, emit)
                    );
                    console.log(html);
                    frequentResults.innerHTML = html;
                    frequentResults.style.display = "block";
                }

                if (options.editable) {
                    Emojis.write(emoji, options);
                }
            });
        }

        return button;
    },
    write: (emoji, options) => {
        const input = options.editable;
        const currentValue = input.value;
        const caretPosStart = input.selectionStart;
        const caretPosEnd = input.selectionEnd;
        const lastChar = input.value.length;

        if (!options.editable) {
            return;
        }
        input.value = [
            currentValue.slice(0, caretPosStart),
            emoji.char,
            currentValue.slice(caretPosEnd, lastChar),
        ].join("");

        const panel = document.querySelector(`.${options.classnames.panel}`);
        panel.classList.toggle(options.classnames.open);

        if (options.use_shroud) {
            const shroud = document.querySelector(
                `.${options.classnames.shroud}`
            );
            shroud.classList.toggle(options.classnames.open);
        }
        // clear search on close
        // if (options.search) {
        //     const searchInput = document.querySelector(
        //         `.${options.classnames.searchInput}`
        //     );
        //     searchInput.value = "";
        // }
    },
};

module.exports = Emojis;
