(() => {
  let allTranscriptDivs = document.querySelectorAll(".transcript");
  let categoriesSelector = document.querySelectorAll(".category");
  let textsSelector = document.querySelectorAll(".textarea_transcript");
  const filterSelector = <HTMLSelectElement>document.querySelector("#filter");
  const newCategoryForm = document.querySelector("#add_category");
  const paginationBoxes = document.querySelectorAll(".last_id");
  const mainContainer = document.querySelector("#data");
  const finalise = document.querySelector("#moveToCategories");

  finalise.addEventListener("click", (ev) => {
    ev.preventDefault();
    fetch("http://localhost:5001/finalise", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => data)
      .catch((err) => err);
  });
  type dataForView = {
    categories: Array<Object>;
    bindings: Array<Object>;
    texts: Array<Object>;
  };

  const createView = (parent: Element, data: dataForView): void => {
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
    const { bindings, texts, categories } = data;
    for (let i in data) {
      console.log(data);
    }
    texts.forEach((element, index) => {
      const line = document.createElement("div");
      line.classList.add("transcript");
      line.setAttribute("data-binding-id", element["binding_id"]);

      const textareaTranscript = document.createElement("textarea");
      textareaTranscript.classList.add("textarea_transcript");
      textareaTranscript.name = "pl_fonetic_transcript";
      textareaTranscript.setAttribute("data-binding-id", element["binding_id"]);
      textareaTranscript.textContent = element["pl_fonetic_transcript"];

      const audioElement = document.createElement("audio");
      audioElement.src = `static/source/${bindings[index]["name"]}`;
      audioElement.classList.add("original_audio");
      audioElement.controls = true;

      const selectCategories = document.createElement("select");
      selectCategories.classList.add("category");
      selectCategories.setAttribute("data-binding-id", element["binding_id"]);

      for (let x of categories) {
        const optionCategory = document.createElement("option");
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
  const initialiseView = () => {
    allTranscriptDivs = document.querySelectorAll(".transcript");
    categoriesSelector = document.querySelectorAll(".category");
    textsSelector = document.querySelectorAll(".textarea_transcript");
    

    textsSelector.forEach((el) =>
      el.addEventListener("change", async (ev) => {
        const cur = <HTMLSelectElement> ev.currentTarget;
        const text = cur.value;
        const bindingsId = cur.getAttribute("data-binding-id");
        const dataToSend = {
          text: text,
          bindings_id: bindingsId,
        };
        const query: { Key: "new_category" } = await fetch(
          "http://localhost:5001/texts",
          {
            method: "POST",
            body: JSON.stringify(dataToSend),
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
          .then((res) => res.json())
          .then((data) => data)
          .catch((err) => err);
      })
    );
    categoriesSelector.forEach((el) =>
      el.addEventListener("change", async (ev) => {
        const cur = <HTMLSelectElement> ev.currentTarget;
        const categoryId = cur.value;
        const bindingsId = cur.getAttribute("data-binding-id");
        const dataToSend = {
          category_id: categoryId,
          bindings_id: bindingsId,
        };
        const query: { Key: "new_category" } = await fetch(
          `http://localhost:5001/bindings`,
          {
            method: "POST",
            body: JSON.stringify(dataToSend),
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
          .then((res) => res.json())
          .then((data) => data)
          .catch((err) => err);
      })
    );
  };

  paginationBoxes.forEach((el) => {
    el.addEventListener("click", () => {
      paginationBoxes.forEach((el) => el.classList.remove("active"));
      el.classList.add("active");
    });
    el.addEventListener("click", async (ev) => {
      const lastId = el.getAttribute("data-last_id");
      const textsQuery = await fetch(
        `http://localhost:5001/texts?last_id=${lastId}&limit=20`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
        .then((res) => res.json())
        .then((data) => data)
        .catch((err) => err);

      const categoriesQuery = await fetch(`http://localhost:5001/categories`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => data)
        .catch((err) => err);
      const bindingsQuery = await fetch(
        `http://localhost:5001/bindings?last_id=${lastId}&limit=20`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
        .then((res) => res.json())
        .then((data) => data)
        .catch((err) => err);
      const data = {
        categories: categoriesQuery,
        bindings: bindingsQuery,
        texts: textsQuery,
      };
      createView(mainContainer, data);
    });
  });

  newCategoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = {
      new_category: (<HTMLInputElement>document.querySelector("#new_category"))
        .value,
    };
    const query: { Key: "new_category" } = await fetch(
      "http://localhost:5001/categories",
      {
        method: "POST",
        body: JSON.stringify(form),
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((data) => data)
      .catch((err) => err);
    if (query["Error"]) {
      console.log(query["Error"]);
      return;
    }
    categoriesSelector.forEach((el) => {
      const newOptionElement = document.createElement("option");
      newOptionElement.value = query["id"];
      newOptionElement.text = form["new_category"];
      const cur = <HTMLSelectElement>el;
      cur.add(newOptionElement);
    });
    const newOptionElement = document.createElement("option");
    newOptionElement.value = form["new_category"];
    newOptionElement.text = form["new_category"];
    filterSelector.add(newOptionElement);
  });

  filterSelector.addEventListener("change", (ev) => {
    const cur = <HTMLSelectElement>ev.currentTarget;
    const currentValue = cur.value;
    categoriesSelector.forEach((el) => {
      el.parentElement.style.display = "grid";
      const cur = <HTMLSelectElement>el;
      if (cur.value !== currentValue && currentValue !== "-1") {
        el.parentElement.style.display = "none";
      }
    });
  });

  window.addEventListener("load", () => {
    initialiseView();
  });
})();
