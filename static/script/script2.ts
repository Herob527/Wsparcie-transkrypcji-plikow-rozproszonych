(async () => {
  await fetch('https://unpkg.com/wavesurfer.js').then(el => el.text()).then(data => eval(data));
  
  const apiAddress = 'http://localhost:5002'; 
  const pagesElementArray = document.querySelectorAll(
    "#pagination .page_offset"
  );
  pagesElementArray.forEach((page) =>
    page.addEventListener("click", () => {
      const currentOffset = page.getAttribute("data-offset");
      fetch(`${apiAddress}/bindings?offset=${currentOffset}&limit=30`).then(res => res.json()).then(data => console.log(data))
    })
  );
})();
