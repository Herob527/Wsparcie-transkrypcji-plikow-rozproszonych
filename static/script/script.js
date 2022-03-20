var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
(function () {
    var allTranscriptDivs = document.querySelectorAll(".transcript");
    var categoriesSelector = document.querySelectorAll(".category");
    var textsSelector = document.querySelectorAll(".textarea_transcript");
    var filterSelector = document.querySelector("#filter");
    var newCategoryForm = document.querySelector("#add_category");
    var paginationBoxes = document.querySelectorAll(".last_id");
    var mainContainer = document.querySelector("#data");
    var finalise = document.querySelector("#moveToCategories");
    finalise.addEventListener("click", function (ev) {
        ev.preventDefault();
        fetch("http://localhost:5001/finalise", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(function (res) { return res.json(); })
            .then(function (data) { return data; })["catch"](function (err) { return err; });
    });
    var createView = function (parent, data) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
        var bindings = data.bindings, texts = data.texts, categories = data.categories;
        for (var i in data) {
            console.log(data);
        }
        texts.forEach(function (element, index) {
            var line = document.createElement("div");
            line.classList.add("transcript");
            line.setAttribute("data-binding-id", element["binding_id"]);
            var textareaTranscript = document.createElement("textarea");
            textareaTranscript.classList.add("textarea_transcript");
            textareaTranscript.name = "pl_fonetic_transcript";
            textareaTranscript.setAttribute("data-binding-id", element["binding_id"]);
            textareaTranscript.textContent = element["pl_fonetic_transcript"];
            var audioElement = document.createElement("audio");
            audioElement.src = "static/source/".concat(bindings[index]["name"]);
            audioElement.classList.add("original_audio");
            audioElement.controls = true;
            var selectCategories = document.createElement("select");
            selectCategories.classList.add("category");
            selectCategories.setAttribute("data-binding-id", element["binding_id"]);
            for (var _i = 0, categories_1 = categories; _i < categories_1.length; _i++) {
                var x = categories_1[_i];
                var optionCategory = document.createElement("option");
                optionCategory.textContent = x["name"];
                optionCategory.value = x["id"];
                if (x["id"] == bindings[index]["category_id"]) {
                    optionCategory.selected = true;
                }
                selectCategories.add(optionCategory);
            }
            line
                .appendChild(textareaTranscript)
                .after(audioElement, selectCategories);
            parent.appendChild(line);
            initialiseView();
        });
    };
    var initialiseView = function () {
        allTranscriptDivs = document.querySelectorAll(".transcript");
        categoriesSelector = document.querySelectorAll(".category");
        textsSelector = document.querySelectorAll(".textarea_transcript");
        textsSelector.forEach(function (el) {
            return el.addEventListener("change", function (ev) { return __awaiter(_this, void 0, void 0, function () {
                var cur, text, bindingsId, dataToSend, query;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            cur = ev.currentTarget;
                            text = cur.value;
                            bindingsId = cur.getAttribute("data-binding-id");
                            dataToSend = {
                                text: text,
                                bindings_id: bindingsId
                            };
                            return [4 /*yield*/, fetch("http://localhost:5001/texts", {
                                    method: "POST",
                                    body: JSON.stringify(dataToSend),
                                    headers: {
                                        "Content-Type": "application/json"
                                    }
                                })
                                    .then(function (res) { return res.json(); })
                                    .then(function (data) { return data; })["catch"](function (err) { return err; })];
                        case 1:
                            query = _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        categoriesSelector.forEach(function (el) {
            return el.addEventListener("change", function (ev) { return __awaiter(_this, void 0, void 0, function () {
                var cur, categoryId, bindingsId, dataToSend, query;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            cur = ev.currentTarget;
                            categoryId = cur.value;
                            bindingsId = cur.getAttribute("data-binding-id");
                            dataToSend = {
                                category_id: categoryId,
                                bindings_id: bindingsId
                            };
                            return [4 /*yield*/, fetch("http://localhost:5001/bindings", {
                                    method: "POST",
                                    body: JSON.stringify(dataToSend),
                                    headers: {
                                        "Content-Type": "application/json"
                                    }
                                })
                                    .then(function (res) { return res.json(); })
                                    .then(function (data) { return data; })["catch"](function (err) { return err; })];
                        case 1:
                            query = _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    };
    paginationBoxes.forEach(function (el) {
        el.addEventListener("click", function () {
            paginationBoxes.forEach(function (el) { return el.classList.remove("active"); });
            el.classList.add("active");
        });
        el.addEventListener("click", function (ev) { return __awaiter(_this, void 0, void 0, function () {
            var lastId, textsQuery, categoriesQuery, bindingsQuery, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lastId = el.getAttribute("data-last_id");
                        return [4 /*yield*/, fetch("http://localhost:5001/texts?last_id=".concat(lastId, "&limit=20"), {
                                method: "GET",
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            })
                                .then(function (res) { return res.json(); })
                                .then(function (data) { return data; })["catch"](function (err) { return err; })];
                    case 1:
                        textsQuery = _a.sent();
                        return [4 /*yield*/, fetch("http://localhost:5001/categories", {
                                method: "GET",
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            })
                                .then(function (res) { return res.json(); })
                                .then(function (data) { return data; })["catch"](function (err) { return err; })];
                    case 2:
                        categoriesQuery = _a.sent();
                        return [4 /*yield*/, fetch("http://localhost:5001/bindings?last_id=".concat(lastId, "&limit=20"), {
                                method: "GET",
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            })
                                .then(function (res) { return res.json(); })
                                .then(function (data) { return data; })["catch"](function (err) { return err; })];
                    case 3:
                        bindingsQuery = _a.sent();
                        data = {
                            categories: categoriesQuery,
                            bindings: bindingsQuery,
                            texts: textsQuery
                        };
                        createView(mainContainer, data);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    newCategoryForm.addEventListener("submit", function (e) { return __awaiter(_this, void 0, void 0, function () {
        var form, query, newOptionElement;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    form = {
                        new_category: document.querySelector("#new_category")
                            .value
                    };
                    return [4 /*yield*/, fetch("http://localhost:5001/categories", {
                            method: "POST",
                            body: JSON.stringify(form),
                            headers: {
                                "Content-Type": "application/json"
                            }
                        })
                            .then(function (res) { return res.json(); })
                            .then(function (data) { return data; })["catch"](function (err) { return err; })];
                case 1:
                    query = _a.sent();
                    if (query["Error"]) {
                        console.log(query["Error"]);
                        return [2 /*return*/];
                    }
                    categoriesSelector.forEach(function (el) {
                        var newOptionElement = document.createElement("option");
                        newOptionElement.value = query["id"];
                        newOptionElement.text = form["new_category"];
                        var cur = el;
                        cur.add(newOptionElement);
                    });
                    newOptionElement = document.createElement("option");
                    newOptionElement.value = form["new_category"];
                    newOptionElement.text = form["new_category"];
                    filterSelector.add(newOptionElement);
                    return [2 /*return*/];
            }
        });
    }); });
    filterSelector.addEventListener("change", function (ev) {
        var cur = ev.currentTarget;
        var currentValue = cur.value;
        categoriesSelector.forEach(function (el) {
            el.parentElement.style.display = "grid";
            var cur = el;
            if (cur.value !== currentValue && currentValue !== "-1") {
                el.parentElement.style.display = "none";
            }
        });
    });
    window.addEventListener("load", function () {
        initialiseView();
    });
})();
